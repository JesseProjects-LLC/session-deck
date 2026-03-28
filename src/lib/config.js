// src/lib/config.js — Centralized configuration from environment variables

const config = {
  port: parseInt(process.env.SESSION_DECK_PORT || '7890', 10),
  host: process.env.SESSION_DECK_HOST || '0.0.0.0',
  logLevel: process.env.SESSION_DECK_LOG_LEVEL || 'info',
  dbPath: process.env.SESSION_DECK_DB_PATH || './data/session-deck.db',
};

// Validate at import time — fail fast
if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid port: ${process.env.SESSION_DECK_PORT}`);
}

const validLogLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];
if (!validLogLevels.includes(config.logLevel)) {
  throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
}

export default config;
