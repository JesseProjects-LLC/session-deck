// src/lib/config.js — Centralized configuration from environment variables

const config = {
  port: parseInt(process.env.SESSION_DECK_PORT || '7890', 10),
  host: process.env.SESSION_DECK_HOST || '0.0.0.0',
  logLevel: process.env.SESSION_DECK_LOG_LEVEL || 'info',
  dbPath: process.env.SESSION_DECK_DB_PATH || './data/session-deck.db',

  // Auth configuration
  auth: {
    // 'none' | 'basic' | 'oidc'
    method: process.env.SESSION_DECK_AUTH || 'none',

    // Basic auth
    basicUser: process.env.SESSION_DECK_AUTH_USER || '',
    basicPass: process.env.SESSION_DECK_AUTH_PASS || '',

    // OIDC (Entra ID, Authentik, Keycloak, etc.)
    oidcIssuer: process.env.SESSION_DECK_OIDC_ISSUER || '',       // e.g. https://login.microsoftonline.com/{tenant}/v2.0
    oidcClientId: process.env.SESSION_DECK_OIDC_CLIENT_ID || '',
    oidcClientSecret: process.env.SESSION_DECK_OIDC_CLIENT_SECRET || '',
    oidcRedirectUri: process.env.SESSION_DECK_OIDC_REDIRECT_URI || '', // e.g. https://deck.hha.sh/auth/callback
    oidcScopes: process.env.SESSION_DECK_OIDC_SCOPES || 'openid profile email',

    // Trusted networks (bypass auth for these CIDRs)
    trustedNetworks: process.env.SESSION_DECK_TRUSTED_NETWORKS || '', // e.g. '192.168.0.0/16,10.0.0.0/8'

    // Session
    sessionSecret: process.env.SESSION_DECK_SESSION_SECRET || 'session-deck-change-me-in-production',
    sessionMaxAge: parseInt(process.env.SESSION_DECK_SESSION_MAX_AGE || '86400', 10), // 24h default
  },
};

// Validate at import time — fail fast
if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid port: ${process.env.SESSION_DECK_PORT}`);
}

const validLogLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
if (!validLogLevels.includes(config.logLevel)) {
  throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
}

// Validate auth config
const validAuthMethods = ['none', 'basic', 'oidc'];
if (!validAuthMethods.includes(config.auth.method)) {
  throw new Error(`Invalid auth method: ${config.auth.method}. Must be one of: ${validAuthMethods.join(', ')}`);
}
if (config.auth.method === 'basic' && (!config.auth.basicUser || !config.auth.basicPass)) {
  throw new Error('Basic auth requires SESSION_DECK_AUTH_USER and SESSION_DECK_AUTH_PASS');
}
if (config.auth.method === 'oidc' && (!config.auth.oidcIssuer || !config.auth.oidcClientId || !config.auth.oidcClientSecret)) {
  throw new Error('OIDC auth requires SESSION_DECK_OIDC_ISSUER, SESSION_DECK_OIDC_CLIENT_ID, and SESSION_DECK_OIDC_CLIENT_SECRET');
}

export default config;
