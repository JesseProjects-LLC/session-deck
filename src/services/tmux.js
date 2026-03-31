// src/services/tmux.js — tmux session query and type detection

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const SESSION_FORMAT = '#{session_name}|#{session_windows}|#{session_attached}|#{session_created}|#{session_activity}';
const ACTIVITY_FORMAT = '#{session_name}|#{session_activity}';
const PANE_FORMAT = '#{pane_current_command}';
const PANE_PATH_FORMAT = '#{pane_current_path}';

const TYPE_MAP = {
  claude: 'claude-code',
  gsd: 'gsd',
  pi: 'gsd',
};

// Dynamic type map loaded from DB (falls back to TYPE_MAP if DB unavailable)
let dynamicTypeMap = null;

/**
 * Load session type mappings from the database.
 * Call this after DB is initialized to enable dynamic type detection.
 */
export function loadTypeMap(db) {
  try {
    const types = db.prepare('SELECT process_name, display_name FROM session_types').all();
    dynamicTypeMap = {};
    for (const t of types) {
      dynamicTypeMap[t.process_name] = t.process_name; // return raw process name as type
    }
  } catch {
    dynamicTypeMap = null;
  }
}

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
      const [name, windows, attached, created, activity] = line.split('|');
      if (!name) continue;

      const type = await detectType(host, name, timeout);
      const context = await detectContext(host, name, timeout);

      sessions.push({
        name,
        windows: parseInt(windows, 10),
        attached: parseInt(attached, 10) > 0,
        attachedCount: parseInt(attached, 10),
        created: parseInt(created, 10) * 1000, // epoch ms
        lastActivity: parseInt(activity, 10) * 1000, // epoch ms
        type,
        workingDir: context.workingDir,
        repoName: context.repoName,
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
 * Lightweight activity-only query. Returns just session names + lastActivity timestamps.
 * Skips type detection, context detection — intended for high-frequency polling.
 * @param {object} host
 * @param {object} [options]
 * @returns {Promise<{host: string, sessions: Array<{name: string, lastActivity: number}>, error?: string}>}
 */
export async function listActivity(host, options = {}) {
  const timeout = options.timeout || 3000;
  try {
    const raw = host.isLocal
      ? await execLocal(['list-sessions', '-F', ACTIVITY_FORMAT], timeout)
      : await execRemote(host, `tmux list-sessions -F '${ACTIVITY_FORMAT}'`, timeout);

    if (!raw.trim()) return { host: host.name, sessions: [] };

    const sessions = [];
    for (const line of raw.trim().split('\n')) {
      const [name, activity] = line.split('|');
      if (!name) continue;
      sessions.push({
        name,
        lastActivity: parseInt(activity, 10) * 1000,
      });
    }
    return { host: host.name, sessions };
  } catch (err) {
    return { host: host.name, sessions: [], error: err.message };
  }
}

/**
 * Query activity timestamps from all hosts in parallel.
 * @param {Array<object>} hosts
 * @param {object} [options]
 * @returns {Promise<Array<{host: string, sessions: Array}>>}
 */
export async function listAllActivity(hosts, options = {}) {
  const results = await Promise.allSettled(
    hosts.map(host => listActivity(host, options))
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { host: hosts[i].name, sessions: [], error: r.reason?.message };
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
    // Check all panes — first non-shell match wins, then fall back to shell type
    for (const cmd of commands) {
      // If we have a dynamic map, check if this process is a "notable" one (not a shell)
      if (dynamicTypeMap) {
        // Skip common shells to find the "interesting" process
        if (!['bash', 'zsh', 'fish', 'sh', 'dash', 'tcsh', 'csh'].includes(cmd) && dynamicTypeMap[cmd]) {
          return cmd;
        }
      } else if (TYPE_MAP[cmd]) {
        return TYPE_MAP[cmd];
      }
    }
    // Return the first command (usually the shell) as the type
    return commands[0] || 'terminal';
  } catch {
    return 'terminal'; // default if detection fails
  }
}

/**
 * Detect working directory and git repo name for a session.
 */
async function detectContext(host, sessionName, timeout) {
  const ctx = { workingDir: null, repoName: null };
  try {
    // Get the current path of the first pane
    const raw = host.isLocal
      ? await execLocal(['list-panes', '-t', sessionName, '-F', PANE_PATH_FORMAT], timeout)
      : await execRemote(host, `tmux list-panes -t '${sessionName}' -F '${PANE_PATH_FORMAT}'`, timeout);

    const panePath = raw.trim().split('\n')[0]?.trim();
    if (!panePath) return ctx;

    ctx.workingDir = panePath;

    // Try to detect git repo name
    if (host.isLocal) {
      try {
        const { stdout } = await execFileAsync('git', ['-C', panePath, 'rev-parse', '--show-toplevel'], { timeout: 2000 });
        const repoRoot = stdout.trim();
        if (repoRoot) {
          ctx.repoName = repoRoot.split('/').pop();
        }
      } catch { /* not a git repo */ }
    } else {
      try {
        const gitOut = await execRemote(host, `cd '${panePath}' && git rev-parse --show-toplevel 2>/dev/null`, timeout);
        const repoRoot = gitOut.trim();
        if (repoRoot) {
          ctx.repoName = repoRoot.split('/').pop();
        }
      } catch { /* not a git repo or git not installed */ }
    }

    // If no git repo, use the directory name as a fallback context
    if (!ctx.repoName) {
      ctx.repoName = panePath.split('/').pop() || null;
    }
  } catch { /* ignore detection failures */ }
  return ctx;
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

/** Produce a clean user-facing error from a raw SSH/tmux error. */
function cleanError(err) {
  const msg = (err.message || '') + (err.stderr || '');
  if (msg.includes('command not found')) return 'tmux is not installed on this host';
  if (msg.includes('no server running') || msg.includes('No such file or directory')) return 'tmux is not running on this host';
  if (msg.includes('ETIMEDOUT') || msg.includes('timed out') || msg.includes('Connection timed out')) return 'host is unreachable (connection timed out)';
  if (msg.includes('Connection refused')) return 'connection refused';
  if (msg.includes('No route to host')) return 'host is unreachable (no route)';
  if (msg.includes('Permission denied')) return 'SSH authentication failed';
  if (msg.includes('duplicate session')) return 'session already exists';
  if (msg.includes('no such session') || msg.includes("can't find session")) return 'session not found';
  // Strip "Command failed: ssh ..." prefix if present
  const clean = (err.stderr || err.message || 'unknown error').replace(/^Command failed:.*?\n?/, '').trim();
  return clean || 'unknown error';
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
    throw Object.assign(new Error(`Failed to create session on ${host.name}: ${cleanError(err)}`), { statusCode: 500 });
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
    throw Object.assign(new Error(`Failed to rename session on ${host.name}: ${cleanError(err)}`), { statusCode: 500 });
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
    throw Object.assign(new Error(`Failed to delete session on ${host.name}: ${cleanError(err)}`), { statusCode: 500 });
  }
}
