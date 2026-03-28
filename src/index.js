// src/index.js — Entry point: start server with graceful shutdown

import config from './lib/config.js';
import { buildServer } from './server.js';

const server = await buildServer();

// Graceful shutdown
const shutdown = async (signal) => {
  server.log.info({ signal }, 'Shutdown signal received');
  try {
    await server.close();
    server.log.info('Server closed');
    process.exit(0);
  } catch (err) {
    server.log.error(err, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start
try {
  await server.listen({ port: config.port, host: config.host });
  server.log.info({ port: config.port, host: config.host }, 'Session Deck server started');
} catch (err) {
  server.log.error(err, 'Failed to start server');
  process.exit(1);
}
