// src/server.js — Fastify server factory

import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebSocket from '@fastify/websocket';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import config from './lib/config.js';
import { getDb, closeDb } from './lib/db.js';
import healthRoutes from './routes/health.js';
import hostsRoutes from './routes/hosts.js';
import sessionsRoutes from './routes/sessions.js';
import terminalWsRoutes from './routes/terminal-ws.js';
import workspaceRoutes from './routes/workspaces.js';

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      transport: config.logLevel === 'debug' || config.logLevel === 'trace'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // CORS — allow any origin on LAN
  await fastify.register(cors, { origin: true });

  // WebSocket support
  await fastify.register(fastifyWebSocket);

  // Initialize database
  const db = getDb();
  fastify.decorate('db', db);
  fastify.log.info({ dbPath: config.dbPath }, 'Database initialized');

  // Close DB on shutdown
  fastify.addHook('onClose', () => {
    closeDb();
    fastify.log.info('Database closed');
  });

  // Static files — serve Svelte build in production, playground always available
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const frontendDist = join(__dirname, '..', 'frontend', 'dist');
  const publicDir = join(__dirname, '..', 'public');

  // Serve frontend/dist/ as primary static root (Svelte app)
  await fastify.register(fastifyStatic, {
    root: frontendDist,
    prefix: '/',
    decorateReply: true,
  });

  // Also serve public/playground for playground mockups
  await fastify.register(fastifyStatic, {
    root: join(publicDir, 'playground'),
    prefix: '/playground/',
    decorateReply: false,
  });

  // SPA fallback — serve index.html for unmatched routes (not /api, not /playground)
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api/') || request.url.startsWith('/playground/')) {
      reply.code(404).send({ error: 'Not found' });
    } else {
      reply.sendFile('index.html', frontendDist);
    }
  });

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(hostsRoutes);
  await fastify.register(sessionsRoutes);
  await fastify.register(terminalWsRoutes);
  await fastify.register(workspaceRoutes);

  return fastify;
}
