// frontend/src/lib/stores/activity.js — Workspace activity notification store
// Polls /api/activity every 10s and tracks which workspaces have unseen output.

import { getWorkspaces, getActiveId, subscribe as subscribeWorkspaces } from './workspaces.js';
import { getSessionPanes } from './layout.js';

let _pollTimer = null;
let _listeners = [];

// Map of "host:session" → lastActivity timestamp from server
let _serverActivity = {};

// Map of "host:session" → lastSeen timestamp (when user last viewed that session)
let _lastSeen = {};

// Set of workspace IDs that have unseen activity
let _activeWorkspaces = new Set();

function notify() {
  const snapshot = new Set(_activeWorkspaces);
  _listeners.forEach(fn => fn(snapshot));
}

/**
 * Subscribe to activity badge changes.
 * Callback receives a Set<workspaceId> of workspaces with unseen output.
 */
export function subscribeActivity(fn) {
  _listeners.push(fn);
  fn(new Set(_activeWorkspaces));
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

/**
 * Mark all sessions in a workspace as "seen" (clear the badge).
 * Called when the user switches to a workspace.
 */
export function markWorkspaceSeen(workspaceId) {
  const workspaces = getWorkspaces();
  const ws = workspaces.find(w => w.id === workspaceId);
  if (!ws) return;

  const now = Date.now();
  const sessions = getSessionPanes(ws.layout);
  for (const { session, host } of sessions) {
    const key = `${host || 'reliant'}:${session}`;
    _lastSeen[key] = now;
  }

  if (_activeWorkspaces.has(workspaceId)) {
    _activeWorkspaces.delete(workspaceId);
    notify();
  }
}

/**
 * Fetch activity from server and compute which workspaces have unseen output.
 */
async function pollActivity() {
  try {
    const res = await fetch('/api/activity');
    if (!res.ok) return;
    const data = await res.json();

    // Update server activity map
    const newActivity = {};
    for (const entry of data.activity) {
      const key = `${entry.host}:${entry.session}`;
      newActivity[key] = entry.lastActivity;
    }

    // Determine which sessions have new activity since user last saw them
    const activeId = getActiveId();
    const workspaces = getWorkspaces();
    const changedSessions = new Set();

    for (const [key, serverTs] of Object.entries(newActivity)) {
      const prevTs = _serverActivity[key] || 0;
      const seenTs = _lastSeen[key] || 0;
      // New activity = server timestamp advanced beyond what the user last saw
      if (serverTs > seenTs && serverTs > prevTs) {
        changedSessions.add(key);
      }
    }

    _serverActivity = newActivity;

    if (changedSessions.size === 0) return;

    // Map changed sessions to workspace IDs (excluding active workspace)
    let changed = false;
    for (const ws of workspaces) {
      if (ws.id === activeId) continue; // Don't badge the active workspace

      const sessions = getSessionPanes(ws.layout);
      const hasActivity = sessions.some(({ session, host }) => {
        const key = `${host || 'reliant'}:${session}`;
        return changedSessions.has(key);
      });

      if (hasActivity && !_activeWorkspaces.has(ws.id)) {
        _activeWorkspaces.add(ws.id);
        changed = true;
      }
    }

    if (changed) notify();
  } catch {
    // Silently ignore poll failures
  }
}

/**
 * Initialize the active workspace's sessions as "seen" and start polling.
 */
export function startActivityPolling() {
  // Initialize: mark everything in the current workspace as seen
  const activeId = getActiveId();
  if (activeId) markWorkspaceSeen(activeId);

  // Also initialize _serverActivity so the first poll has a baseline
  pollActivity();

  // Poll every 10 seconds
  _pollTimer = setInterval(pollActivity, 10000);
}

/**
 * Stop polling.
 */
export function stopActivityPolling() {
  clearInterval(_pollTimer);
  _pollTimer = null;
}

/**
 * Check if a workspace has unseen activity.
 */
export function hasActivity(workspaceId) {
  return _activeWorkspaces.has(workspaceId);
}
