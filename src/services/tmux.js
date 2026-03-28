// src/services/tmux.js — tmux session query and type detection

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const SESSION_FORMAT = '#{session_name}|#{session_windows}|#{session_attached}|#{session_created}';
const PANE_FORMAT = '#{pane_current_command}';

const TYPE_MAP = {
  claude: 'claude-code',
  gsd: 'gsd',
  pi: 'gsd',
};

/**
 * List tmux sessions on a host.
 * @param {object} host — host entry from ssh-config parser
 * @param {object} [options]
 * @param {number} [options.timeout=5000] — SSH connect timeout in ms
 * @returns {Promise<{host: string, status: string, sessions: Array, error?: string, queryMs: number}>}
 */
export async function listSessions(host, options = {}) {
  const timeout = options.timeout || 5000;
  const start = Date.now();

  try {
    const rawSessions = host.isLocal
      ? await execLocal(['list-sessions', '-F', SESSION_FORMAT], timeout)
      : await execRemote(host, `tmux list-sessions -F '${SESSION_FORMAT}'`, timeout);

    if (!rawSessions.trim()) {
      return result(host.name, 'online', [], start);
    }

    const sessions = [];
    for (const line of rawSessions.trim().split('\n')) {
      const [name, windows, attached, created] = line.split('|');
      if (!name) continue;

      const type = await detectType(host, name, timeout);

      sessions.push({
        name,
        windows: parseInt(windows, 10),
        attached: parseInt(attached, 10) > 0,
        attachedCount: parseInt(attached, 10),
        created: parseInt(created, 10) * 1000, // epoch ms
        type,
      });
    }

    return result(host.name, 'online', sessions, start);
  } catch (err) {
    const status = classifyError(err);
    return result(host.name, status, [], start, err.message);
  }
}

/**
 * Query all hosts for tmux sessions in parallel.
 * @param {Array<object>} hosts — host entries from ssh-config parser
 * @param {object} [options]
 * @returns {Promise<Array>}
 */
export async function listAllSessions(hosts, options = {}) {
  const results = await Promise.allSettled(
    hosts.map(host => listSessions(host, options))
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return result(hosts[i].name, 'error', [], Date.now(), r.reason?.message);
  });
}

/**
 * Detect session type by inspecting running command in the first pane.
 */
async function detectType(host, sessionName, timeout) {
  try {
    const raw = host.isLocal
      ? await execLocal(['list-panes', '-t', sessionName, '-F', PANE_FORMAT], timeout)
      : await execRemote(host, `tmux list-panes -t '${sessionName}' -F '${PANE_FORMAT}'`, timeout);

    const commands = raw.trim().split('\n').map(c => c.trim().toLowerCase());
    // Check all panes — first match wins
    for (const cmd of commands) {
      if (TYPE_MAP[cmd]) return TYPE_MAP[cmd];
    }
    return 'terminal';
  } catch {
    return 'terminal'; // default if detection fails
  }
}

async function execLocal(args, timeout) {
  const { stdout } = await execFileAsync('tmux', args, { timeout });
  return stdout;
}

async function execRemote(host, command, timeout) {
  const connectTimeoutSec = Math.ceil(timeout / 1000);
  const args = [
    '-o', `ConnectTimeout=${connectTimeoutSec}`,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new',
  ];

  if (host.identityFile) {
    args.push('-i', host.identityFile.replace('~', process.env.HOME));
  }

  const userHost = host.user ? `${host.user}@${host.hostname}` : host.hostname;
  args.push(userHost, command);

  const { stdout } = await execFileAsync('ssh', args, { timeout: timeout + 2000 });
  return stdout;
}

function classifyError(err) {
  const msg = (err.message || '') + (err.stderr || '');
  if (msg.includes('ETIMEDOUT') || msg.includes('timed out') || msg.includes('Connection timed out')) {
    return 'unreachable';
  }
  if (msg.includes('Connection refused') || msg.includes('No route to host')) {
    return 'unreachable';
  }
  if (msg.includes('no server running') || msg.includes('no current client') ||
      msg.includes('failed to connect') || msg.includes('error connecting') ||
      msg.includes('No such file or directory')) {
    return 'no-tmux';
  }
  if (msg.includes('command not found')) {
    return 'no-tmux';
  }
  if (msg.includes('Permission denied')) {
    return 'auth-failed';
  }
  return 'error';
}

function result(hostName, status, sessions, startMs, error) {
  return {
    host: hostName,
    status,
    sessions,
    sessionCount: sessions.length,
    queryMs: Date.now() - startMs,
    ...(error ? { error } : {}),
  };
}

// --- Session mutation operations ---

const SESSION_NAME_RE = /^[a-zA-Z0-9_-]+$/;

function validateSessionName(name) {
  if (!name || typeof name !== 'string') {
    throw Object.assign(new Error('Session name is required'), { statusCode: 400 });
  }
  if (!SESSION_NAME_RE.test(name)) {
    throw Object.assign(
      new Error(`Invalid session name: "${name}". Use only letters, numbers, hyphens, underscores.`),
      { statusCode: 400 }
    );
  }
  if (name.length > 64) {
    throw Object.assign(new Error('Session name must be 64 characters or fewer'), { statusCode: 400 });
  }
}

/**
 * Create a new tmux session on a host.
 * @param {object} host
 * @param {string} name — session name
 * @param {string} [startDir] — starting directory
 * @returns {Promise<{success: boolean, host: string, session: string}>}
 */
export async function createSession(host, name, startDir) {
  validateSessionName(name);

  const args = ['new-session', '-d', '-s', name];
  if (startDir) args.push('-c', startDir);

  try {
    if (host.isLocal) {
      await execLocal(args, 5000);
    } else {
      const cmd = `tmux new-session -d -s '${name}'${startDir ? ` -c '${startDir}'` : ''}`;
      await execRemote(host, cmd, 5000);
    }
    return { success: true, host: host.name, session: name };
  } catch (err) {
    if (err.stderr?.includes('duplicate session') || err.message?.includes('duplicate session')) {
      throw Object.assign(new Error(`Session "${name}" already exists on ${host.name}`), { statusCode: 409 });
    }
    throw Object.assign(new Error(`Failed to create session on ${host.name}: ${err.message}`), { statusCode: 500 });
  }
}

/**
 * Rename a tmux session on a host.
 * @param {object} host
 * @param {string} oldName
 * @param {string} newName
 * @returns {Promise<{success: boolean, host: string, oldName: string, newName: string}>}
 */
export async function renameSession(host, oldName, newName) {
  validateSessionName(newName);

  try {
    if (host.isLocal) {
      await execLocal(['rename-session', '-t', oldName, newName], 5000);
    } else {
      await execRemote(host, `tmux rename-session -t '${oldName}' '${newName}'`, 5000);
    }
    return { success: true, host: host.name, oldName, newName };
  } catch (err) {
    if (err.stderr?.includes('no such session') || err.message?.includes("can't find session")) {
      throw Object.assign(new Error(`Session "${oldName}" not found on ${host.name}`), { statusCode: 404 });
    }
    throw Object.assign(new Error(`Failed to rename session on ${host.name}: ${err.message}`), { statusCode: 500 });
  }
}

/**
 * Delete (kill) a tmux session on a host.
 * @param {object} host
 * @param {string} name
 * @returns {Promise<{success: boolean, host: string, session: string}>}
 */
export async function deleteSession(host, name) {
  try {
    if (host.isLocal) {
      await execLocal(['kill-session', '-t', name], 5000);
    } else {
      await execRemote(host, `tmux kill-session -t '${name}'`, 5000);
    }
    return { success: true, host: host.name, session: name };
  } catch (err) {
    if (err.stderr?.includes('no such session') || err.message?.includes("can't find session")) {
      throw Object.assign(new Error(`Session "${name}" not found on ${host.name}`), { statusCode: 404 });
    }
    throw Object.assign(new Error(`Failed to delete session on ${host.name}: ${err.message}`), { statusCode: 500 });
  }
}
