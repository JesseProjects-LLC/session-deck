// src/routes/terminal-ws.js — WebSocket route for terminal I/O

import { spawnTerminal, resizeTerminal, killTerminal } from '../services/terminal.js';
import config from '../lib/config.js';
import { randomBytes } from 'node:crypto';

// Short-lived WS auth tokens — valid for 30 seconds
const wsTokens = new Map();

function generateWsToken(sessionId) {
  const token = randomBytes(24).toString('hex');
  wsTokens.set(token, { sessionId, created: Date.now() });
  // Clean up expired tokens
  for (const [t, v] of wsTokens) {
    if (Date.now() - v.created > 30000) wsTokens.delete(t);
  }
  return token;
}

function validateWsToken(token) {
  const entry = wsTokens.get(token);
  if (!entry) return false;
  wsTokens.delete(token); // One-time use
  return Date.now() - entry.created < 30000;
}

// CIDR check (duplicated from auth.js to avoid circular imports)
function isTrustedIp(ip) {
  const networks = config.auth.trustedNetworks;
  if (!networks) return false;
  const ranges = networks.split(',').map(s => s.trim()).filter(Boolean).map(cidr => {
    const [addr, bits] = cidr.split('/');
    const mask = bits ? parseInt(bits, 10) : 32;
    const parts = addr.split('.').map(Number);
    const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const maskNum = (~0 << (32 - mask)) >>> 0;
    return { start: (ipNum & maskNum) >>> 0, end: ((ipNum & maskNum) | (~maskNum >>> 0)) >>> 0 };
  });
  const normalizedIp = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  const parts = normalizedIp.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p))) return false;
  const ipNum = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
  return ranges.some(r => ipNum >= r.start && ipNum <= r.end);
}

export default async function terminalWsRoutes(fastify) {
  // Token endpoint — authenticated users get a short-lived WS token
  fastify.get('/api/ws-token', async (req, reply) => {
    // This endpoint goes through normal auth middleware (cookie-based)
    const token = generateWsToken(req.session?.sessionId || 'anon');
    return { token };
  });

  fastify.get('/ws/terminal', { websocket: true }, (socket, req) => {
    // Auth check: accept session cookie, trusted IP, OR valid WS token
    if (config.auth.method !== 'none') {
      const isAuthenticated = req.session?.authenticated;
      const isTrusted = isTrustedIp(req.ip);
      const tokenValid = req.query.token ? validateWsToken(req.query.token) : false;
      if (!isAuthenticated && !isTrusted && !tokenValid) {
        fastify.log.warn({ ip: req.ip, isAuthenticated, isTrusted, tokenValid }, 'WebSocket auth rejected');
        socket.close(1008, 'Authentication required');
        return;
      }
    }

    const session = req.query.session;
    const host = req.query.host || 'reliant';

    if (!session) {
      fastify.log.warn('WebSocket connect without session param');
      socket.close(1008, 'Missing session parameter');
      return;
    }

    const cols = parseInt(req.query.cols) || 80;
    const rows = parseInt(req.query.rows) || 24;

    fastify.log.info({ session, host, cols, rows }, 'Terminal WebSocket connecting');

    let terminal;
    try {
      terminal = spawnTerminal(session, host, { cols, rows });
    } catch (err) {
      fastify.log.error({ err, session, host }, 'Failed to spawn terminal');
      socket.close(1011, `Failed to spawn: ${err.message}`);
      return;
    }

    const { pty: term, id } = terminal;

    fastify.log.info({ id, session, host }, 'Terminal PTY spawned');

    // PTY output → WebSocket
    term.onData((data) => {
      try {
        if (socket.readyState === 1) { // OPEN
          socket.send(data);
        }
      } catch {
        // Socket may have closed
      }
    });

    // PTY exit → close WebSocket
    term.onExit(({ exitCode, signal }) => {
      fastify.log.info({ id, session, exitCode, signal }, 'Terminal PTY exited');
      try {
        socket.close(1000, 'PTY exited');
      } catch {
        // Already closed
      }
      killTerminal(id);
    });

    // WebSocket messages → PTY input or control
    socket.on('message', (rawMsg) => {
      const str = rawMsg.toString();

      // Try parsing as JSON control message
      if (str.startsWith('{')) {
        try {
          const msg = JSON.parse(str);
          if (msg.type === 'resize' && msg.cols && msg.rows) {
            resizeTerminal(id, msg.cols, msg.rows);
            return;
          }
        } catch {
          // Not valid JSON, fall through to terminal input
        }
      }

      // Raw terminal input
      try {
        term.write(str);
      } catch {
        // PTY may have closed
      }
    });

    // WebSocket close → kill PTY
    socket.on('close', () => {
      fastify.log.info({ id, session }, 'Terminal WebSocket closed');
      killTerminal(id);
    });

    socket.on('error', (err) => {
      fastify.log.error({ id, session, err: err.message }, 'Terminal WebSocket error');
      killTerminal(id);
    });
  });
}
