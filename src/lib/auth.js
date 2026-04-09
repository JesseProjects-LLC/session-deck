// src/lib/auth.js — Authentication middleware (basic auth + OIDC)

import config from './config.js';

const { auth } = config;

// Parse trusted networks into CIDR ranges
const trustedRanges = auth.trustedNetworks
  ? auth.trustedNetworks.split(',').map(s => s.trim()).filter(Boolean).map(parseCIDR)
  : [];

/**
 * Register auth plugins and hooks on the Fastify instance.
 */
export async function registerAuth(fastify) {
  if (auth.method === 'none') {
    fastify.log.info('Auth disabled — no authentication required');
    return;
  }

  // Cookie + session support (needed for both basic and OIDC)
  const cookie = await import('@fastify/cookie');
  const session = await import('@fastify/session');

  await fastify.register(cookie.default);
  // Detect if behind HTTPS proxy (from OIDC redirect URI or explicit env)
  const isHttps = auth.oidcRedirectUri?.startsWith('https://') || process.env.SESSION_DECK_HTTPS === 'true';

  await fastify.register(session.default, {
    secret: auth.sessionSecret,
    cookie: {
      secure: isHttps,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: auth.sessionMaxAge * 1000,
    },
    saveUninitialized: false,
  });

  if (auth.method === 'basic') {
    await registerBasicAuth(fastify);
  } else if (auth.method === 'oidc') {
    await registerOIDC(fastify);
  }

  // Global auth hook — runs before every request
  fastify.addHook('onRequest', async (request, reply) => {
    // Skip auth for health check
    if (request.url === '/api/health') return;

    // Skip auth for the auth routes themselves
    if (request.url.startsWith('/auth/')) return;

    // Skip auth for PWA assets (needed before login for install prompt)
    if (request.url === '/manifest.json' || request.url === '/sw.js' ||
        request.url.startsWith('/icon') || request.url === '/favicon.png') return;

    // Skip auth for trusted networks
    if (isTrustedNetwork(request.ip)) return;

    // Check session
    if (request.session?.authenticated) return;

    // Not authenticated
    if (auth.method === 'basic') {
      // For basic auth, trigger browser prompt on HTML requests, 401 on API
      if (request.url.startsWith('/api/') || request.url.startsWith('/ws/')) {
        reply.code(401).send({ error: 'Authentication required' });
      } else {
        reply.redirect('/auth/login');
      }
    } else if (auth.method === 'oidc') {
      // For OIDC, redirect to login
      if (request.url.startsWith('/api/') || request.url.startsWith('/ws/')) {
        reply.code(401).send({ error: 'Authentication required' });
      } else {
        // Save the original URL to redirect back after login
        request.session.returnTo = request.url;
        reply.redirect('/auth/login');
      }
    }
  });

  fastify.log.info({ method: auth.method, trustedNetworks: trustedRanges.length }, 'Auth enabled');
}

/**
 * Basic auth: simple login form + session cookie.
 */
async function registerBasicAuth(fastify) {
  // Login page
  fastify.get('/auth/login', async (request, reply) => {
    if (request.session?.authenticated) {
      return reply.redirect('/');
    }
    reply.type('text/html').send(loginPage());
  });

  // Login handler (rate limited)
  fastify.post('/auth/login', {
    config: {
      rateLimit: { max: 10, timeWindow: '5 minutes' },
    },
  }, async (request, reply) => {
    const { username, password } = request.body || {};
    if (username === auth.basicUser && password === auth.basicPass) {
      request.session.authenticated = true;
      request.session.user = { name: username, method: 'basic' };
      return reply.redirect(request.session.returnTo || '/');
    }
    reply.type('text/html').send(loginPage('Invalid username or password'));
  });

  // Logout
  fastify.get('/auth/logout', async (request, reply) => {
    request.session.destroy();
    reply.redirect('/auth/login');
  });

  // User info API
  fastify.get('/auth/me', async (request) => {
    return request.session?.user || null;
  });
}

/**
 * OIDC auth: OpenID Connect with any provider (Entra ID, Authentik, Keycloak, etc.)
 * Uses openid-client v6 API.
 */
async function registerOIDC(fastify) {
  const oidc = await import('openid-client');

  // Discover OIDC provider configuration
  let oidcConfig;
  try {
    const issuerUrl = new URL(auth.oidcIssuer);
    oidcConfig = await oidc.discovery(issuerUrl, auth.oidcClientId, auth.oidcClientSecret);
    fastify.log.info({ issuer: auth.oidcIssuer }, 'OIDC provider discovered');
  } catch (err) {
    fastify.log.error({ err, issuer: auth.oidcIssuer }, 'Failed to discover OIDC provider');
    throw new Error(`OIDC discovery failed: ${err.message}`);
  }

  // Derive redirect URI from the request origin so auth works from any domain
  function buildRedirectUri(request) {
    const proto = request.headers['x-forwarded-proto'] || request.protocol;
    const host = request.headers['x-forwarded-host'] || request.hostname;
    return `${proto}://${host}/auth/callback`;
  }

  // Login — redirect to provider
  fastify.get('/auth/login', async (request, reply) => {
    if (request.session?.authenticated) {
      return reply.redirect('/');
    }

    const redirectUri = buildRedirectUri(request);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    request.session.oidcState = state;
    request.session.oidcNonce = nonce;
    request.session.oidcCodeVerifier = codeVerifier;
    request.session.oidcRedirectUri = redirectUri;

    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      scope: auth.oidcScopes,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = oidc.buildAuthorizationUrl(oidcConfig, params);
    reply.redirect(authUrl.href);
  });

  // Callback — handle provider response
  fastify.get('/auth/callback', async (request, reply) => {
    try {
      // Use the redirect URI from the session (set during login) so the token
      // exchange matches the exact URI sent to the provider
      const redirectUri = request.session.oidcRedirectUri || buildRedirectUri(request);
      const currentUrl = new URL(request.url, redirectUri.replace('/auth/callback', ''));

      const tokens = await oidc.authorizationCodeGrant(oidcConfig, currentUrl, {
        pkceCodeVerifier: request.session.oidcCodeVerifier,
        expectedState: request.session.oidcState,
        expectedNonce: request.session.oidcNonce,
        idTokenExpected: true,
      });

      const claims = tokens.claims();
      let userinfo = { name: claims?.name, email: claims?.email, sub: claims?.sub };

      // Try fetching full userinfo if available
      try {
        const info = await oidc.fetchUserInfo(oidcConfig, tokens.access_token, claims.sub);
        userinfo = {
          name: info.name || info.preferred_username || info.email || claims?.name || 'User',
          email: info.email || claims?.email || null,
          sub: info.sub || claims?.sub,
        };
      } catch {
        // Token claims are sufficient
        userinfo.name = userinfo.name || 'User';
      }

      request.session.authenticated = true;
      request.session.user = { ...userinfo, method: 'oidc' };

      // Clean up OIDC state
      delete request.session.oidcState;
      delete request.session.oidcNonce;
      delete request.session.oidcCodeVerifier;
      delete request.session.oidcRedirectUri;

      const returnTo = request.session.returnTo || '/';
      delete request.session.returnTo;
      reply.redirect(returnTo);
    } catch (err) {
      fastify.log.error({ err }, 'OIDC callback error');
      reply.type('text/html').send(loginPage('Authentication failed: ' + err.message));
    }
  });

  // Logout
  fastify.get('/auth/logout', async (request, reply) => {
    const loginUri = buildRedirectUri(request).replace('/auth/callback', '/auth/login');
    request.session.destroy();

    // If the provider supports end_session_endpoint, redirect there
    const serverMeta = oidcConfig.serverMetadata();
    if (serverMeta.end_session_endpoint) {
      const logoutUrl = oidc.buildEndSessionUrl(oidcConfig, {
        post_logout_redirect_uri: loginUri,
      });
      return reply.redirect(logoutUrl.href);
    }

    reply.redirect('/auth/login');
  });

  // User info API
  fastify.get('/auth/me', async (request) => {
    return request.session?.user || null;
  });
}

/**
 * Login page HTML (used for basic auth and OIDC errors)
 */
function loginPage(error = null) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Deck — Login</title>
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #0a0e14; color: #c5cdd9;
      display: flex; align-items: center; justify-content: center;
      height: 100vh;
    }
    .login-card {
      width: 360px; padding: 32px;
      background: #151b23; border: 1px solid #1e2530; border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      display: flex; flex-direction: column; align-items: center; gap: 20px;
    }
    .login-logo { display: flex; align-items: center; gap: 8px; }
    .login-title {
      font-size: 16px; font-weight: 700; color: #F97316;
      font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;
    }
    .login-error {
      width: 100%; padding: 8px 12px; border-radius: 6px;
      background: rgba(240,113,120,0.1); border: 1px solid rgba(240,113,120,0.3);
      color: #f07178; font-size: 12px; text-align: center;
    }
    .login-form { width: 100%; display: flex; flex-direction: column; gap: 12px; }
    .login-field {
      width: 100%; padding: 10px 14px; border-radius: 6px;
      border: 1px solid #1e2530; background: #0b0e14; color: #c5cdd9;
      font-size: 14px; font-family: 'JetBrains Mono', monospace; outline: none;
    }
    .login-field:focus { border-color: #F97316; }
    .login-btn {
      width: 100%; padding: 10px; border-radius: 6px; border: none;
      background: #F97316; color: #fff; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: background 0.12s;
    }
    .login-btn:hover { background: #fb923c; }
  </style>
</head>
<body>
  <div class="login-card">
    <div class="login-logo">
      <img src="/icon.svg" width="32" height="32" alt="Session Deck">
      <span class="login-title">SESSION DECK</span>
    </div>
    ${error ? `<div class="login-error">${error}</div>` : ''}
    ${auth.method === 'basic' ? `
    <form class="login-form" method="POST" action="/auth/login">
      <input class="login-field" type="text" name="username" placeholder="Username" required autofocus>
      <input class="login-field" type="password" name="password" placeholder="Password" required>
      <button class="login-btn" type="submit">Sign In</button>
    </form>
    ` : `
    <a href="/auth/login" class="login-btn" style="text-align:center;text-decoration:none;display:block">Sign in with SSO</a>
    `}
  </div>
</body>
</html>`;
}

/**
 * Check if an IP is in the trusted networks list.
 */
function isTrustedNetwork(ip) {
  if (trustedRanges.length === 0) return false;
  // Normalize IPv6-mapped IPv4
  const normalizedIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const ipNum = ipToNum(normalizedIp);
  if (ipNum === null) return false;
  return trustedRanges.some(range => ipNum >= range.start && ipNum <= range.end);
}

function parseCIDR(cidr) {
  const [ip, bits] = cidr.split('/');
  const mask = bits ? parseInt(bits, 10) : 32;
  const ipNum = ipToNum(ip);
  const maskNum = (~0 << (32 - mask)) >>> 0;
  return {
    start: (ipNum & maskNum) >>> 0,
    end: ((ipNum & maskNum) | (~maskNum >>> 0)) >>> 0,
  };
}

function ipToNum(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
