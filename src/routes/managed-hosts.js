// src/routes/managed-hosts.js — CRUD API for managed SSH hosts

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseSSHConfig } from '../services/ssh-config.js';

const execFileAsync = promisify(execFile);

/**
 * Test SSH connectivity and tmux availability for a host.
 */
async function testHost(host) {
  const startMs = Date.now();
  const result = {
    status: 'error',
    tmuxAvailable: false,
    os: null,
    osId: null,
    tmuxVersion: null,
    installCommand: null,
    error: null,
    durationMs: 0,
  };

  try {
    if (host.is_local) {
      // Local host — direct exec
      try {
        const { stdout } = await execFileAsync('tmux', ['-V'], { timeout: 5000 });
        result.tmuxAvailable = true;
        result.tmuxVersion = stdout.trim();
      } catch {
        result.tmuxAvailable = false;
      }

      // Get OS info
      try {
        const { stdout } = await execFileAsync('cat', ['/etc/os-release'], { timeout: 3000 });
        const idMatch = stdout.match(/^ID=(.+)$/m);
        const nameMatch = stdout.match(/^PRETTY_NAME="?(.+?)"?$/m);
        result.osId = idMatch?.[1]?.replace(/"/g, '') || null;
        result.os = nameMatch?.[1] || result.osId;
      } catch {
        result.os = 'Linux';
      }

      result.status = 'ok';
    } else {
      // Remote host — SSH
      const sshArgs = buildSSHArgs(host);

      // Step 1: connectivity test
      await execFileAsync('ssh', [...sshArgs, 'echo', 'ok'], { timeout: 8000 });
      result.status = 'ok';

      // Step 2: tmux check
      try {
        const { stdout } = await execFileAsync('ssh', [...sshArgs, 'tmux', '-V'], { timeout: 5000 });
        result.tmuxAvailable = true;
        result.tmuxVersion = stdout.trim();
      } catch (err) {
        result.tmuxAvailable = false;
        // tmux not found — get OS info for install guidance
        try {
          const { stdout } = await execFileAsync('ssh', [...sshArgs, 'cat', '/etc/os-release'], { timeout: 5000 });
          const idMatch = stdout.match(/^ID=(.+)$/m);
          const nameMatch = stdout.match(/^PRETTY_NAME="?(.+?)"?$/m);
          result.osId = idMatch?.[1]?.replace(/"/g, '') || null;
          result.os = nameMatch?.[1] || result.osId;
        } catch {
          // Try uname as fallback
          try {
            const { stdout } = await execFileAsync('ssh', [...sshArgs, 'uname', '-s'], { timeout: 5000 });
            result.os = stdout.trim();
          } catch {
            result.os = 'Unknown';
          }
        }
      }
    }

    // Generate install command based on OS
    if (!result.tmuxAvailable && result.osId) {
      result.installCommand = getInstallCommand(result.osId);
    }
  } catch (err) {
    result.status = 'error';
    const msg = err.stderr || err.message || 'Connection failed';
    // Trim verbose SSH errors to just the key part
    if (msg.includes('Connection timed out')) result.error = 'Connection timed out';
    else if (msg.includes('Connection refused')) result.error = 'Connection refused';
    else if (msg.includes('No route to host')) result.error = 'No route to host';
    else if (msg.includes('Permission denied')) result.error = 'Permission denied (auth failed)';
    else if (msg.includes('Host key verification')) result.error = 'Host key verification failed';
    else result.error = msg.split('\n')[0].slice(0, 120);
  }

  result.durationMs = Date.now() - startMs;
  return result;
}

/**
 * Build SSH command arguments for a host.
 */
function buildSSHArgs(host) {
  const args = [
    '-o', 'ConnectTimeout=5',
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
  ];
  if (host.identity_file) args.push('-i', host.identity_file.replace('~', process.env.HOME));
  if (host.port && host.port !== 22) args.push('-p', String(host.port));
  const target = host.user ? `${host.user}@${host.hostname}` : host.hostname;
  args.push(target);
  return args;
}

/**
 * Get tmux install command for a given OS ID.
 */
function getInstallCommand(osId) {
  const commands = {
    ubuntu: 'sudo apt install -y tmux',
    debian: 'sudo apt install -y tmux',
    fedora: 'sudo dnf install -y tmux',
    centos: 'sudo yum install -y tmux',
    rhel: 'sudo yum install -y tmux',
    arch: 'sudo pacman -S tmux',
    alpine: 'sudo apk add tmux',
    opensuse: 'sudo zypper install -y tmux',
    freebsd: 'sudo pkg install tmux',
    darwin: 'brew install tmux',
  };
  return commands[osId] || `# Install tmux for ${osId}`;
}

export default async function managedHostsRoutes(fastify) {
  const db = fastify.db;

  // List all managed hosts
  fastify.get('/api/managed-hosts', async () => {
    const hosts = db.prepare('SELECT * FROM managed_hosts ORDER BY sort_order, name').all();
    const groups = {};
    for (const host of hosts) {
      const g = host.group_name || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(host);
    }
    return { hosts, groups, count: hosts.length };
  });

  // Get single host
  fastify.get('/api/managed-hosts/:id', async (request, reply) => {
    const host = db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(request.params.id);
    if (!host) return reply.code(404).send({ error: 'Host not found' });
    return host;
  });

  // Create host
  fastify.post('/api/managed-hosts', async (request, reply) => {
    const { name, hostname, user, port, identity_file, auth_method, group_name, is_local, enabled } = request.body;
    if (!name?.trim() || !hostname?.trim()) {
      return reply.code(400).send({ error: 'Name and hostname are required' });
    }

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM managed_hosts WHERE name = ?').get(name.trim());
    if (existing) {
      return reply.code(409).send({ error: `Host "${name.trim()}" already exists` });
    }

    const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM managed_hosts').get();
    const nextSort = (maxSort?.m ?? -1) + 1;

    const result = db.prepare(`
      INSERT INTO managed_hosts (name, hostname, user, port, identity_file, auth_method, group_name, is_local, enabled, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      hostname.trim(),
      user?.trim() || null,
      port || 22,
      identity_file?.trim() || null,
      auth_method || 'key',
      group_name?.trim() || 'Other',
      is_local ? 1 : 0,
      enabled !== false ? 1 : 0,
      nextSort
    );

    const host = db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(result.lastInsertRowid);
    reply.code(201);
    return host;
  });

  // Update host
  fastify.put('/api/managed-hosts/:id', async (request, reply) => {
    const existing = db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(request.params.id);
    if (!existing) return reply.code(404).send({ error: 'Host not found' });

    const { name, hostname, user, port, identity_file, auth_method, group_name, is_local, enabled } = request.body;

    // Check for name collision with other hosts
    if (name && name.trim() !== existing.name) {
      const dup = db.prepare('SELECT id FROM managed_hosts WHERE name = ? AND id != ?').get(name.trim(), existing.id);
      if (dup) return reply.code(409).send({ error: `Host "${name.trim()}" already exists` });
    }

    db.prepare(`
      UPDATE managed_hosts SET
        name = ?, hostname = ?, user = ?, port = ?, identity_file = ?,
        auth_method = ?, group_name = ?, is_local = ?, enabled = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name?.trim() ?? existing.name,
      hostname?.trim() ?? existing.hostname,
      user?.trim() ?? existing.user,
      port ?? existing.port,
      identity_file?.trim() ?? existing.identity_file,
      auth_method ?? existing.auth_method,
      group_name?.trim() ?? existing.group_name,
      is_local !== undefined ? (is_local ? 1 : 0) : existing.is_local,
      enabled !== undefined ? (enabled ? 1 : 0) : existing.enabled,
      existing.id
    );

    return db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(existing.id);
  });

  // Delete host
  fastify.delete('/api/managed-hosts/:id', async (request, reply) => {
    const existing = db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(request.params.id);
    if (!existing) return reply.code(404).send({ error: 'Host not found' });

    db.prepare('DELETE FROM managed_hosts WHERE id = ?').run(existing.id);
    return { deleted: true, name: existing.name };
  });

  // Import hosts from SSH config
  fastify.post('/api/managed-hosts/import-ssh-config', async () => {
    const sshHosts = parseSSHConfig();
    const existing = db.prepare('SELECT name FROM managed_hosts').all().map(h => h.name);
    const existingSet = new Set(existing);

    const insertStmt = db.prepare(`
      INSERT INTO managed_hosts (name, hostname, user, identity_file, auth_method, group_name, is_local, enabled, sort_order)
      VALUES (?, ?, ?, ?, 'key', ?, ?, 1, ?)
    `);

    let imported = 0;
    let skipped = 0;
    const importTransaction = db.transaction(() => {
      const maxSort = db.prepare('SELECT MAX(sort_order) as m FROM managed_hosts').get();
      let nextSort = (maxSort?.m ?? -1) + 1;

      for (const host of sshHosts) {
        if (existingSet.has(host.name)) {
          skipped++;
          continue;
        }
        insertStmt.run(
          host.name,
          host.hostname || host.name,
          host.user || null,
          host.identityFile || null,
          host.group || 'Other',
          host.isLocal ? 1 : 0,
          nextSort++
        );
        imported++;
      }
    });

    importTransaction();

    return { imported, skipped, total: existing.length + imported };
  });

  // Check if any managed hosts exist (for auto-import on first load)
  fastify.get('/api/managed-hosts/count', async () => {
    const result = db.prepare('SELECT COUNT(*) as count FROM managed_hosts').get();
    return { count: result.count };
  });

  // Test connectivity and tmux availability for a single host
  fastify.post('/api/managed-hosts/:id/test', async (request, reply) => {
    const host = db.prepare('SELECT * FROM managed_hosts WHERE id = ?').get(request.params.id);
    if (!host) return reply.code(404).send({ error: 'Host not found' });

    const result = await testHost(host);

    // Update DB with test results
    db.prepare(`
      UPDATE managed_hosts SET
        last_test_status = ?, last_test_at = datetime('now'), tmux_available = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(result.status, result.tmuxAvailable ? 1 : 0, host.id);

    return result;
  });

  // Test all enabled hosts in parallel
  fastify.post('/api/managed-hosts/test-all', async () => {
    const hosts = db.prepare('SELECT * FROM managed_hosts WHERE enabled = 1').all();

    const results = await Promise.allSettled(
      hosts.map(async (host) => {
        const result = await testHost(host);
        db.prepare(`
          UPDATE managed_hosts SET
            last_test_status = ?, last_test_at = datetime('now'), tmux_available = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(result.status, result.tmuxAvailable ? 1 : 0, host.id);
        return { id: host.id, name: host.name, ...result };
      })
    );

    const completed = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    const failed = results
      .filter(r => r.status === 'rejected')
      .map((r, i) => ({ id: hosts[i].id, name: hosts[i].name, error: r.reason?.message }));

    return { tested: completed.length, results: [...completed, ...failed] };
  });
}
