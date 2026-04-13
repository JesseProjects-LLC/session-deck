// src/routes/status.js — Pane status REST API
//
// GET /api/status — returns current status for all active terminal PTYs
// Powered by StatusEngine, which classifies output in real time.

import statusEngine from '../services/status-engine.js';

export default async function statusRoutes(fastify) {
  // GET /api/status — snapshot of all pane states
  fastify.get('/api/status', async () => {
    return { panes: statusEngine.getAll() };
  });
}
