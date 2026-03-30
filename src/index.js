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

  // Locale health check — surface encoding issues at startup, not at debug time
  const lang = process.env.LANG || 'unset';
  const lcAll = process.env.LC_ALL || 'unset';
  const isUtf8 = /utf-?8/i.test(lang) || /utf-?8/i.test(lcAll);
  if (!isUtf8) {
    server.log.warn(
      { LANG: lang, LC_ALL: lcAll },
      'Non-UTF-8 locale detected. Terminal Unicode rendering (em-dashes, arrows, etc.) may break. ' +
      'Set LANG=C.UTF-8 in your environment or systemd service file.'
    );
  } else {
    server.log.info({ LANG: lang, LC_ALL: lcAll }, 'Locale OK (UTF-8)');
  }
} catch (err) {
  server.log.error(err, 'Failed to start server');
  process.exit(1);
}
