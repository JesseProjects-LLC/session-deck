// src/services/terminal.js — PTY lifecycle manager for terminal connections

import pty from 'node-pty';
import { parseSSHConfig } from './ssh-config.js';

const activePTYs = new Map();

/**
 * Spawn a PTY connected to a tmux session.
 * @param {string} sessionName — tmux session name
 * @param {string} hostName — host name (from SSH config) or 'reliant' for local
 * @param {object} options
 * @param {number} [options.cols=80]
 * @param {number} [options.rows=24]
 * @returns {{ pty, id }}
 */
export function spawnTerminal(sessionName, hostName, options = {}) {
  const cols = options.cols || 80;
  const rows = options.rows || 24;
  const id = `${hostName}:${sessionName}:${Date.now()}`;

  let shell, args;
  const host = resolveHost(hostName);

  if (!host || host.isLocal) {
    // Local tmux attach
    shell = 'tmux';
    args = ['attach-session', '-t', sessionName];
  } else {
    // Remote via SSH
    shell = 'ssh';
    args = [
      '-o', 'ConnectTimeout=5',
      '-o', 'StrictHostKeyChecking=accept-new',
      '-t', // Force PTY allocation
    ];
    if (host.identityFile) {
      args.push('-i', host.identityFile.replace('~', process.env.HOME));
    }
    const userHost = host.user ? `${host.user}@${host.hostname}` : host.hostname;
    args.push(userHost, `tmux attach-session -t ${sessionName}`);
  }

  const term = pty.spawn(shell, args, {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: process.env.HOME,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
    },
  });

  activePTYs.set(id, { term, sessionName, hostName, createdAt: Date.now() });

  return { pty: term, id };
}

/**
 * Resize an active PTY.
 */
export function resizeTerminal(id, cols, rows) {
  const entry = activePTYs.get(id);
  if (entry) {
    try {
      entry.term.resize(cols, rows);
    } catch {
      // PTY may already be closed
    }
  }
}

/**
 * Kill an active PTY and clean up.
 */
export function killTerminal(id) {
  const entry = activePTYs.get(id);
  if (entry) {
    try {
      entry.term.kill();
    } catch {
      // Already dead
    }
    activePTYs.delete(id);
  }
}

/**
 * Get count of active terminals.
 */
export function getActiveCount() {
  return activePTYs.size;
}

function resolveHost(hostName) {
  if (!hostName || hostName === 'reliant' || hostName === 'localhost') {
    return { isLocal: true };
  }
  const hosts = parseSSHConfig();
  return hosts.find(h => h.name === hostName || h.aliases?.includes(hostName));
}
