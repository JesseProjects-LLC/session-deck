// src/routes/health.js — Health check endpoint

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));
const startTime = Date.now();

const healthSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
        timestamp: { type: 'string' },
      },
    },
  },
};

export default async function healthRoutes(fastify) {
  fastify.get('/health', { schema: healthSchema }, async () => {
    return {
      status: 'ok',
      version: pkg.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
  });
}
