// src/routes/sessions.js — tmux sessions API

import { parseSSHConfig } from '../services/ssh-config.js';
import { listAllSessions, listSessions, createSession, renameSession, deleteSession } from '../services/tmux.js';

function findHost(hostName) {
  const hosts = parseSSHConfig();
  const host = hosts.find(h => h.name === hostName || h.aliases.includes(hostName));
  return host;
}

export default async function sessionsRoutes(fastify) {
  // Get sessions from all configured hosts
  fastify.get('/api/sessions', async () => {
    const hosts = parseSSHConfig();

    // Filter to tmux-capable hosts (skip network gear, clients)
    const tmuxHosts = hosts.filter(h => {
      const skip = ['Network', 'Client'];
      return !skip.includes(h.group);
    });

    const results = await listAllSessions(tmuxHosts, { timeout: 5000 });

    const totalSessions = results.reduce((sum, r) => sum + r.sessionCount, 0);
    const onlineHosts = results.filter(r => r.status === 'online').length;

    fastify.log.info({
      totalSessions,
      hostsQueried: results.length,
      hostsOnline: onlineHosts,
    }, 'Session inventory complete');

    return {
      results,
      summary: {
        totalSessions,
        hostsQueried: results.length,
        hostsOnline: onlineHosts,
      },
    };
  });

  // Get sessions from a single host
  fastify.get('/api/sessions/:hostName', async (request, reply) => {
    const { hostName } = request.params;
    const host = findHost(hostName);
    if (!host) return reply.code(404).send({ error: `Host not found: ${hostName}` });
    return await listSessions(host, { timeout: 5000 });
  });

  // Create a session on a host
  fastify.post('/api/sessions/:hostName', async (request, reply) => {
    const { hostName } = request.params;
    const { name, startDir } = request.body || {};
    const host = findHost(hostName);
    if (!host) return reply.code(404).send({ error: `Host not found: ${hostName}` });

    try {
      const result = await createSession(host, name, startDir);
      fastify.log.info({ host: hostName, session: name }, 'Session created');
      return reply.code(201).send(result);
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  // Rename a session on a host
  fastify.put('/api/sessions/:hostName/:sessionName', async (request, reply) => {
    const { hostName, sessionName } = request.params;
    const { newName } = request.body || {};
    const host = findHost(hostName);
    if (!host) return reply.code(404).send({ error: `Host not found: ${hostName}` });

    try {
      const result = await renameSession(host, sessionName, newName);
      fastify.log.info({ host: hostName, oldName: sessionName, newName }, 'Session renamed');
      return result;
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });

  // Delete a session on a host
  fastify.delete('/api/sessions/:hostName/:sessionName', async (request, reply) => {
    const { hostName, sessionName } = request.params;
    const host = findHost(hostName);
    if (!host) return reply.code(404).send({ error: `Host not found: ${hostName}` });

    try {
      const result = await deleteSession(host, sessionName);
      fastify.log.info({ host: hostName, session: sessionName }, 'Session deleted');
      return result;
    } catch (err) {
      return reply.code(err.statusCode || 500).send({ error: err.message });
    }
  });
}
