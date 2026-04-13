// frontend/src/lib/stores/status.js — Pane status store via ws/status WebSocket
//
// Connects to the status WebSocket and maintains a reactive map of
// host:session → status. Components subscribe to get notified of changes.
// Also fires browser notifications when a background pane transitions to "asking".

let _ws = null;
let _reconnectTimer = null;
let _listeners = [];

// Map of "host:session" → { status, prevStatus, confidence, lastTransition }
let _paneStatus = {};

// Set of "host:session" keys the user is currently viewing (active workspace panes)
let _viewingKeys = new Set();

// Whether browser notification permission has been requested
let _notifPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

function notify() {
  const snapshot = { ..._paneStatus };
  _listeners.forEach(fn => fn(snapshot));
}

/**
 * Subscribe to status changes.
 * Callback receives a map of "host:session" → { status, prevStatus, confidence, lastTransition }.
 */
export function subscribeStatus(fn) {
  _listeners.push(fn);
  fn({ ..._paneStatus });
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

/**
 * Get the current status for a specific pane.
 * @param {string} host
 * @param {string} session
 * @returns {{ status: string, prevStatus: string, confidence: number, lastTransition: number } | null}
 */
export function getPaneStatus(host, session) {
  return _paneStatus[`${host}:${session}`] || null;
}

/**
 * Set which panes the user is currently viewing (active workspace).
 * Used to suppress notifications for panes the user can already see.
 * @param {Array<{host: string, session: string}>} panes
 */
export function setViewingPanes(panes) {
  _viewingKeys = new Set(panes.map(p => `${p.host || 'reliant'}:${p.session}`));
}

/**
 * Request browser notification permission (call on user gesture).
 */
export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    _notifPermission = 'granted';
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(perm => {
      _notifPermission = perm;
    });
  }
}

/**
 * Connect to ws/status WebSocket. Call once on app startup.
 */
export function startStatusConnection() {
  if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return;

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${proto}//${window.location.host}/ws/status`;

  _ws = new WebSocket(wsUrl);

  _ws.onopen = () => {
    clearTimeout(_reconnectTimer);
  };

  _ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === 'snapshot') {
        // Full snapshot — rebuild map
        _paneStatus = {};
        for (const pane of msg.panes) {
          const key = `${pane.host}:${pane.session}`;
          _paneStatus[key] = {
            status: pane.status,
            prevStatus: pane.prevStatus,
            confidence: pane.confidence,
            lastTransition: pane.lastTransition,
          };
        }
        notify();
      } else if (msg.type === 'status') {
        // Single transition
        const key = `${msg.host}:${msg.session}`;
        const prev = _paneStatus[key];
        _paneStatus[key] = {
          status: msg.status,
          prevStatus: msg.prevStatus,
          confidence: msg.confidence || 0,
          lastTransition: msg.timestamp,
        };
        notify();

        // Browser notification for "asking" transitions on background panes
        if (msg.status === 'asking' && prev?.status !== 'asking' && !_viewingKeys.has(key)) {
          fireNotification(msg.session, msg.host);
        }
      }
    } catch {
      // Malformed message — ignore
    }
  };

  _ws.onclose = () => {
    scheduleReconnect();
  };

  _ws.onerror = () => {
    // onerror is always followed by onclose
  };
}

/**
 * Disconnect status WebSocket. Call on app teardown.
 */
export function stopStatusConnection() {
  clearTimeout(_reconnectTimer);
  if (_ws) {
    _ws.onclose = null; // prevent reconnect
    _ws.close();
    _ws = null;
  }
}

// --- Internal ---

function scheduleReconnect() {
  clearTimeout(_reconnectTimer);
  _reconnectTimer = setTimeout(() => {
    startStatusConnection();
  }, 5000);
}

function fireNotification(session, host) {
  if (_notifPermission !== 'granted') return;
  if (typeof Notification === 'undefined') return;

  try {
    const title = 'Session Deck';
    const body = `${session}@${host} needs attention`;
    const n = new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      tag: `asking-${host}-${session}`, // dedupe repeated notifications for same pane
      renotify: true,
    });
    // Auto-close after 8 seconds
    setTimeout(() => n.close(), 8000);
  } catch {
    // Notification API may fail in some contexts
  }
}

/**
 * Compute the "most urgent" status across a set of panes.
 * Priority: asking > error > done > working > idle > unknown
 * @param {Array<{host: string, session: string}>} panes
 * @returns {string|null} The most urgent status, or null if no panes are tracked
 */
export function getWorstStatus(panes, statusSnapshot) {
  const priority = { asking: 5, error: 4, done: 3, working: 2, idle: 1, unknown: 0 };
  const source = statusSnapshot || _paneStatus;
  let worst = null;
  let worstPriority = -1;

  for (const { host, session } of panes) {
    const key = `${host || 'reliant'}:${session}`;
    const entry = source[key];
    if (!entry) continue;
    const p = priority[entry.status] ?? 0;
    if (p > worstPriority) {
      worstPriority = p;
      worst = entry.status;
    }
  }

  return worst;
}
