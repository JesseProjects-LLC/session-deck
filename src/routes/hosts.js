// src/routes/hosts.js — SSH hosts API (reads from managed_hosts table)

export default async function hostsRoutes(fastify) {
  const db = fastify.db;

  fastify.get('/api/hosts', async () => {
    const hosts = db.prepare(
      'SELECT * FROM managed_hosts WHERE enabled = 1 ORDER BY sort_order, name'
    ).all();

    // Map to the shape the frontend expects
    const mapped = hosts.map(h => ({
      name: h.name,
      hostname: h.hostname,
      user: h.user,
      identityFile: h.identity_file,
      group: h.group_name,
      isLocal: !!h.is_local,
    }));

    const groups = {};
    for (const host of mapped) {
      const g = host.group || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(host);
    }

    // If no managed hosts yet, fall back to SSH config import
    if (mapped.length === 0) {
      const { parseSSHConfig } = await import('../services/ssh-config.js');
      const sshHosts = parseSSHConfig();
      const sshGroups = {};
      for (const host of sshHosts) {
        const g = host.group || 'Other';
        if (!sshGroups[g]) sshGroups[g] = [];
        sshGroups[g].push(host);
      }
      return { hosts: sshHosts, groups: sshGroups, count: sshHosts.length, source: 'ssh-config' };
    }

    return { hosts: mapped, groups, count: mapped.length, source: 'managed' };
  });
}
