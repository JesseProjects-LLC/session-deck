// src/services/status-engine.js — Pane status classification engine
//
// Analyzes terminal PTY output to classify each pane's state:
//   idle     — sitting at a shell prompt, no recent output
//   working  — continuous output, process running
//   asking   — detected a question/prompt pattern (Claude ?, [y/N], etc.)
//   done     — process completed (returned to shell prompt after work)
//   error    — error patterns detected in output
//   unknown  — just registered, not enough data yet
//
// Architecture: singleton event bus with subscribe()/unsubscribe().
// Consumers: REST /api/status, WebSocket ws/status, future ClawDeck bridge.

// --- ANSI stripping ---

// Matches ANSI escape sequences: CSI (ESC[), OSC (ESC]), and simple ESC codes
const ANSI_RE = /\x1b(?:\[[0-9;?]*[A-Za-z]|\][^\x07\x1b]*(?:\x07|\x1b\\)?|[()][AB012]|[78DEHM=>])/g;

function stripAnsi(str) {
  return str.replace(ANSI_RE, '');
}

// --- tmux status bar filter ---
// tmux redraws its status bar every 15-30s. These lines look like:
//   [session_name] 0:bash* 1:vim  ...  "hostname" HH:MM DD-Mon-YY
// Filter them out before classification to avoid false "working" blips.
const TMUX_STATUS_RE = /^\[[\w-]+\]\s+\d+:/m;

function stripTmuxStatusLines(str) {
  return str.split('\n').filter(line => !TMUX_STATUS_RE.test(line.trim())).join('\n');
}

// --- Pattern definitions ---

// Shell prompt patterns — indicates idle state (returned to prompt)
const PROMPT_PATTERNS = [
  /[$#%>]\s*$/m,                           // Common shell prompts: $, #, %, >
  /\w+@[\w.-]+[:\s~][^$#%]*[$#%]\s*$/m,   // user@host:~ $
  /^\s*\(.*\)\s*[$#%>]\s*$/m,             // (venv) $
  /❯\s*$/m,                                // Starship/custom prompts
  /➜\s+/m,                                 // Oh My Zsh arrow
  /^\s*>>>\s*$/m,                           // Python REPL
];

// Question/asking patterns — something is waiting for user input
const ASKING_PATTERNS = [
  /\?\s*$/m,                                      // Ends with ?
  /\[y\/n\]/i,                                     // [y/N] or [Y/n]
  /\[yes\/no\]/i,                                  // [yes/no]
  /\(y\/n\)/i,                                     // (y/n)
  /press (?:enter|return|any key)/i,               // Press enter to continue
  /continue\?\s*\[/i,                              // Continue? [
  /confirm/i,                                      // Confirm ...
  /enter (?:your|a|the) /i,                        // Enter your password:
  /password[:\s]*$/im,                             // Password:
  /passphrase[:\s]*$/im,                           // Passphrase:
  /\(default[:\s]/i,                               // (default: ...)
  // Claude Code specific
  /Do you want to proceed/i,
  /Would you like/i,
  /Shall I/i,
  /waiting for (?:your|user) (?:input|response)/i,
  // Claude Code input prompt (❯ character at start of line)
  /^❯\s*$/m,
  // GSD/pi input prompt
  /^>\s*$/m,
];

// Error patterns — something went wrong
const ERROR_PATTERNS = [
  /^error[:\s]/im,
  /^fatal[:\s]/im,
  /^ERR!/m,
  /panic:/i,
  /traceback \(most recent call last\)/i,
  /segmentation fault/i,
  /core dumped/i,
  /unhandled (?:promise )?rejection/i,
  /ECONNREFUSED/,
  /ENOENT/,
  /EPERM/,
  /permission denied/i,
  /command not found/,
  /No such file or directory/,
  /exit code [1-9]/i,
  /exited with (?:code|status) [1-9]/i,
];

// --- State machine ---

const VALID_STATES = ['unknown', 'idle', 'working', 'asking', 'done', 'error'];

// Minimum time (ms) in a state before allowing transition — prevents flicker
const STATE_COOLDOWNS = {
  idle: 500,
  working: 300,
  asking: 1000,    // Asking is sticky — don't leave until clear evidence of change
  done: 2000,      // Done is sticky — let user notice it
  error: 2000,     // Error is sticky too
  unknown: 0,
};

// How long (ms) without output before transitioning working → idle
const IDLE_TIMEOUT = 3000;

// Rolling buffer size per PTY (bytes of stripped text to keep for analysis)
const BUFFER_SIZE = 4096;

class StatusEngine {
  constructor() {
    /** @type {Map<string, PaneState>} */
    this._panes = new Map();
    /** @type {Set<function>} */
    this._listeners = new Set();
    /** @type {Map<string, NodeJS.Timeout>} */
    this._idleTimers = new Map();
  }

  /**
   * Register a new PTY for tracking.
   * @param {string} id — PTY identifier (host:session:timestamp)
   * @param {string} host
   * @param {string} session
   */
  register(id, host, session) {
    this._panes.set(id, {
      id,
      host,
      session,
      status: 'unknown',
      prevStatus: null,
      lastTransition: Date.now(),
      lastOutput: null,
      confidence: 0,
      buffer: '',
      lastError: null,
    });
  }

  /**
   * Feed raw PTY output into the classifier.
   * Called on every term.onData() — must be fast.
   * @param {string} id
   * @param {string} rawData — raw terminal output (may contain ANSI)
   */
  feed(id, rawData) {
    const pane = this._panes.get(id);
    if (!pane) return;

    const stripped = stripTmuxStatusLines(stripAnsi(rawData));
    const meaningful = stripped.replace(/[\s\x00-\x1f]/g, '');
    if (meaningful.length < 2) return; // Skip cursor repositioning, single-char screen updates

    // Append to rolling buffer, trim to BUFFER_SIZE
    pane.buffer = (pane.buffer + stripped).slice(-BUFFER_SIZE);

    const now = Date.now();

    // Track output rate — distinguish real activity from periodic status bar refreshes.
    // Count meaningful output events in the last 2 seconds.
    if (!pane.outputTimestamps) pane.outputTimestamps = [];
    pane.outputTimestamps.push(now);
    // Keep only last 2 seconds of timestamps
    pane.outputTimestamps = pane.outputTimestamps.filter(t => now - t < 2000);

    const isSignificantOutput = meaningful.length > 20 || pane.outputTimestamps.length >= 3;

    if (isSignificantOutput) {
      pane.lastOutput = now;
      // Reset idle timer only on significant output
      this._resetIdleTimer(id);
    }

    // Run classifier with both the recent chunk and accumulated buffer
    const newState = this._classify(pane, stripped);
    if (newState && newState !== pane.status) {
      this._transition(pane, newState);
    }
  }

  /**
   * Remove a PTY from tracking (on disconnect/exit).
   * @param {string} id
   */
  remove(id) {
    const timer = this._idleTimers.get(id);
    if (timer) clearTimeout(timer);
    this._idleTimers.delete(id);
    this._panes.delete(id);
  }

  /**
   * Get current status snapshot for all tracked panes.
   * @returns {Array<{ptyId, host, session, status, prevStatus, lastTransition, confidence}>}
   */
  getAll() {
    const result = [];
    for (const pane of this._panes.values()) {
      result.push({
        ptyId: pane.id,
        host: pane.host,
        session: pane.session,
        status: pane.status,
        prevStatus: pane.prevStatus,
        lastTransition: pane.lastTransition,
        confidence: pane.confidence,
      });
    }
    return result;
  }

  /**
   * Get status for a single PTY.
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    const pane = this._panes.get(id);
    if (!pane) return null;
    return {
      ptyId: pane.id,
      host: pane.host,
      session: pane.session,
      status: pane.status,
      prevStatus: pane.prevStatus,
      lastTransition: pane.lastTransition,
      confidence: pane.confidence,
    };
  }

  /**
   * Subscribe to state transitions.
   * Callback receives: { ptyId, host, session, status, prevStatus, timestamp }
   * @param {function} callback
   * @returns {function} unsubscribe function
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  // --- Internal ---

  _classify(pane, incomingChunk) {
    // Check both the incoming chunk (point-in-time) and the accumulated buffer (context)
    const recent = pane.buffer.slice(-512);
    const chunk = incomingChunk || '';
    const recentLastLine = recent.split('\n').filter(l => l.trim()).pop() || '';
    const chunkLastLine = chunk.split('\n').filter(l => l.trim()).pop() || '';

    // Priority order: asking > error > working > done > idle
    // Check asking patterns against BOTH the incoming chunk and recent buffer
    for (const pat of ASKING_PATTERNS) {
      if (pat.test(chunk) || pat.test(recent)) {
        return 'asking';
      }
    }

    // Check error patterns against both
    for (const pat of ERROR_PATTERNS) {
      if (pat.test(chunk) || pat.test(recent)) {
        return 'error';
      }
    }

    // Check if we just returned to a prompt after doing work
    if (pane.status === 'working' || pane.status === 'asking' || pane.status === 'error') {
      for (const pat of PROMPT_PATTERNS) {
        if (pat.test(chunkLastLine) || pat.test(recentLastLine)) {
          return 'done';
        }
      }
    }

    // If we're receiving output and not at a prompt, we're working
    if (pane.status === 'idle' || pane.status === 'unknown' || pane.status === 'done') {
      for (const pat of PROMPT_PATTERNS) {
        if (pat.test(chunkLastLine) || pat.test(recentLastLine)) {
          return 'idle';
        }
      }
      return 'working';
    }

    return null; // No state change
  }

  _transition(pane, newState) {
    // High-priority states bypass cooldown on lower-priority states
    const PRIORITY = { unknown: 0, idle: 1, working: 2, done: 3, error: 4, asking: 5 };
    const isUpgrade = (PRIORITY[newState] || 0) > (PRIORITY[pane.status] || 0);

    if (!isUpgrade) {
      // Enforce cooldown — don't flicker between states
      const cooldown = STATE_COOLDOWNS[pane.status] || 0;
      const elapsed = Date.now() - pane.lastTransition;
      if (elapsed < cooldown) return;
    }

    const prev = pane.status;
    pane.prevStatus = prev;
    pane.status = newState;
    pane.lastTransition = Date.now();
    pane.confidence = this._computeConfidence(pane, newState);

    // Emit transition event
    const event = {
      ptyId: pane.id,
      host: pane.host,
      session: pane.session,
      status: newState,
      prevStatus: prev,
      timestamp: pane.lastTransition,
    };

    for (const listener of this._listeners) {
      try {
        listener(event);
      } catch {
        // Don't let a bad listener break the engine
      }
    }
  }

  _computeConfidence(pane, state) {
    // Simple confidence heuristic based on pattern match strength
    const recent = pane.buffer.slice(-512);

    if (state === 'asking') {
      // Count how many asking patterns match
      const matches = ASKING_PATTERNS.filter(p => p.test(recent)).length;
      return Math.min(1, 0.5 + matches * 0.15);
    }
    if (state === 'error') {
      const matches = ERROR_PATTERNS.filter(p => p.test(recent)).length;
      return Math.min(1, 0.5 + matches * 0.2);
    }
    if (state === 'idle') {
      return 0.8; // Prompt detection is fairly reliable
    }
    if (state === 'working') {
      return 0.7; // Default — "something is happening"
    }
    if (state === 'done') {
      return 0.6; // Transition from working to prompt
    }
    return 0.5;
  }

  _resetIdleTimer(id) {
    const existing = this._idleTimers.get(id);
    if (existing) clearTimeout(existing);

    this._idleTimers.set(id, setTimeout(() => {
      this._idleTimers.delete(id);
      const pane = this._panes.get(id);
      if (!pane) return;
      // No output for IDLE_TIMEOUT — transition to idle from transient states
      if (pane.status === 'working' || pane.status === 'unknown' || pane.status === 'done') {
        this._transition(pane, 'idle');
      }
    }, IDLE_TIMEOUT));
  }
}

// Singleton — all consumers share the same engine instance
const statusEngine = new StatusEngine();
export default statusEngine;
