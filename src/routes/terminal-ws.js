// src/routes/terminal-ws.js — WebSocket route for terminal I/O

import { spawnTerminal, resizeTerminal, killTerminal } from '../services/terminal.js';

export default async function terminalWsRoutes(fastify) {
  fastify.get('/ws/terminal', { websocket: true }, (socket, req) => {
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
