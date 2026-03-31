// src/routes/sessions.js — tmux sessions API

import { parseSSHConfig } from '../services/ssh-config.js';
import { listAllSessions, listSessions, createSession, renameSession, deleteSession } from '../services/tmux.js';
import { isValidSessionName } from '../lib/validate.js';

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
    if (!isValidSessionName(name)) {
      return reply.code(400).send({ error: 'Invalid session name. Use only letters, digits, hyphens, underscores, and dots.' });
    }
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
    if (!isValidSessionName(newName)) {
      return reply.code(400).send({ error: 'Invalid session name. Use only letters, digits, hyphens, underscores, and dots.' });
    }
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

  // Send a rendering test to a tmux session
  fastify.post('/api/sessions/:hostName/:sessionName/render-test', async (request, reply) => {
    const { hostName, sessionName } = request.params;
    const host = findHost(hostName);
    if (!host) return reply.code(404).send({ error: `Host not found: ${hostName}` });

    // The test string — covers ASCII, Unicode, box-drawing, emoji, math symbols
    const lines = [
      `echo ''`,
      `echo '╔══════════════════════════════════════╗'`,
      `echo '║   Session Deck — Rendering Test      ║'`,
      `echo '╚══════════════════════════════════════╝'`,
      `echo ''`,
      `echo 'ASCII:      Hello World [OK] {pass} (done)'`,
      `echo 'Arrows:     ← → ↑ ↓ ⇒ ⇐ ➜'`,
      `echo 'Box light:  ┌─┬─┐│ ││ │└─┴─┘'`,
      `echo 'Box heavy:  ┏━┳━┓┃ ┃┃ ┃┗━┻━┛'`,
      `echo 'Symbols:    ✓ ✗ ● ○ ◆ ◇ ★ ☆ ⚡ ⚙ ▶ ◀'`,
      `echo 'Emoji:      🔥 🚀 📦 ✅ ❌ 🎉 💾 🔧 🔔 📱'`,
      `echo 'Blocks:     ▓▒░ ████ ▀▄▐▌'`,
      `echo 'Math:       ≤ ≥ ≠ ± ∞ √ ∑ ∏ ∫ ∂'`,
      `echo 'Braille:    ⣿⡇⠿⠛⠉⠁'`,
      `echo 'Powerline:     '`,
      `echo ''`,
      `echo 'If all lines render correctly with no clipping,'`,
      `echo 'your terminal font supports the full glyph set.'`,
      `echo ''`,
    ];

    try {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execFileAsync = promisify(execFile);

      for (const line of lines) {
        if (host.isLocal) {
          await execFileAsync('tmux', ['send-keys', '-t', sessionName, line, 'Enter'], { timeout: 2000 });
        } else {
          const sshArgs = [
            '-o', 'ConnectTimeout=3', '-o', 'BatchMode=yes',
            '-o', 'StrictHostKeyChecking=accept-new',
          ];
          if (host.identityFile) sshArgs.push('-i', host.identityFile.replace('~', process.env.HOME));
          const userHost = host.user ? `${host.user}@${host.hostname}` : host.hostname;
          sshArgs.push(userHost, `tmux send-keys -t '${sessionName}' '${line.replace(/'/g, "'\\''")}' Enter`);
          await execFileAsync('ssh', sshArgs, { timeout: 5000 });
        }
        // Small delay between lines to avoid overwhelming the terminal
        await new Promise(r => setTimeout(r, 50));
      }

      return { success: true, host: hostName, session: sessionName, lines: lines.length };
    } catch (err) {
      return reply.code(500).send({ error: `Failed to send render test: ${err.message}` });
    }
  });
}
