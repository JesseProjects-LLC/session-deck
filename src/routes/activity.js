// src/routes/activity.js — Lightweight activity polling endpoint
// Returns session_activity timestamps only (no type/context detection).
// Designed for 10s polling to power workspace notification badges.

import { parseSSHConfig } from '../services/ssh-config.js';
import { listAllActivity } from '../services/tmux.js';

export default async function activityRoutes(fastify) {
  const db = fastify.db;

  // GET /api/activity — returns { host, session, lastActivity } for all sessions
  fastify.get('/api/activity', async () => {
    // Get hosts from managed_hosts DB, fall back to SSH config
    let hosts;
    const managed = db.prepare(
      'SELECT * FROM managed_hosts WHERE enabled = 1 ORDER BY sort_order, name'
    ).all();

    if (managed.length > 0) {
      hosts = managed.map(h => ({
        name: h.name,
        hostname: h.hostname,
        user: h.user,
        identityFile: h.identity_file,
        group: h.group_name,
        isLocal: !!h.is_local,
      }));
    } else {
      hosts = parseSSHConfig();
    }

    // Filter to tmux-capable hosts
    const tmuxHosts = hosts.filter(h => {
      const skip = ['Network', 'Client'];
      return !skip.includes(h.group);
    });

    const results = await listAllActivity(tmuxHosts, { timeout: 3000 });

    // Flatten into a simple array: { host, session, lastActivity }
    const activity = [];
    for (const hostResult of results) {
      for (const s of hostResult.sessions) {
        activity.push({
          host: hostResult.host,
          session: s.name,
          lastActivity: s.lastActivity,
        });
      }
    }

    return { activity };
  });
}
