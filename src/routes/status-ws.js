// src/routes/status-ws.js — WebSocket channel for real-time pane status transitions
//
// ws/status — pushes status change events to all connected clients.
// On connect: sends current snapshot of all pane states.
// On transition: pushes { type: 'status', ptyId, host, session, status, prevStatus, timestamp }.

import statusEngine from '../services/status-engine.js';
import config from '../lib/config.js';

// CIDR check (same as terminal-ws.js — duplicated to avoid circular imports)
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

export default async function statusWsRoutes(fastify) {
  fastify.get('/ws/status', { websocket: true }, (socket, req) => {
    // Auth check — same policy as terminal WebSocket
    if (config.auth.method !== 'none') {
      const isAuthenticated = req.session?.authenticated;
      const isTrusted = isTrustedIp(req.ip);
      if (!isAuthenticated && !isTrusted) {
        fastify.log.warn({ ip: req.ip }, 'Status WebSocket auth rejected');
        socket.close(1008, 'Authentication required');
        return;
      }
    }

    fastify.log.info({ ip: req.ip }, 'Status WebSocket connected');

    // Send current snapshot on connect
    try {
      socket.send(JSON.stringify({
        type: 'snapshot',
        panes: statusEngine.getAll(),
        timestamp: Date.now(),
      }));
    } catch {
      // Socket may have closed immediately
    }

    // Subscribe to status transitions and forward to this client
    const unsubscribe = statusEngine.subscribe((event) => {
      try {
        if (socket.readyState === 1) { // OPEN
          socket.send(JSON.stringify({ type: 'status', ...event }));
        }
      } catch {
        // Socket may have closed
      }
    });

    socket.on('close', () => {
      fastify.log.info({ ip: req.ip }, 'Status WebSocket closed');
      unsubscribe();
    });

    socket.on('error', (err) => {
      fastify.log.error({ ip: req.ip, err: err.message }, 'Status WebSocket error');
      unsubscribe();
    });
  });
}
