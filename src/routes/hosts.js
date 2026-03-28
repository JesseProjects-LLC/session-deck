// src/routes/hosts.js — SSH hosts API

import { parseSSHConfig } from '../services/ssh-config.js';

export default async function hostsRoutes(fastify) {
  fastify.get('/api/hosts', async () => {
    const hosts = parseSSHConfig();
    const groups = {};
    for (const host of hosts) {
      const g = host.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(host);
    }
    return { hosts, groups, count: hosts.length };
  });
}
