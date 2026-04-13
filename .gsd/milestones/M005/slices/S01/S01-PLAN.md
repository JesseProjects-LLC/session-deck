# S01: Pane Status Engine

**Goal:** Server-side classification of each active PTY as idle/working/asking/done/error, exposed via REST and WebSocket, with an in-process event bus for future consumers.
**Demo:** Open two terminals — one running Claude Code, one idle shell. GET /api/status returns correct states. WebSocket pushes transition when Claude asks a question.

## Must-Haves

- StatusEngine analyzes ANSI-stripped PTY output to classify state
- State machine: idle → working → asking/done/error, with defined transitions
- Classification runs on a sampling window (last N bytes), not full history
- GET /api/status returns structured pane states for all active PTYs
- WebSocket channel ws/status pushes state transitions in real time
- In-process subscribe(callback) for future consumers (S02, ClawDeck)
- No measurable regression in terminal typing latency

## Threat Surface

- **Abuse**: N/A — status is read-only, no user input to the classification engine
- **Data exposure**: Terminal output is analyzed server-side but status API returns only state labels, not content
- **Input trust**: None — engine reads from trusted PTY output, not user-supplied data

## Requirement Impact

- **Requirements touched**: R032 (status detection), R033 (real-time events)
- **Re-verify**: Terminal relay latency (existing live sessions must not lag)
- **Decisions revisited**: D011 (event bus architecture — implementing it here)

## Proof Level

- This slice proves: contract + integration
- Real runtime required: yes — must classify real Claude Code and shell output
- Human/UAT required: yes — verify status labels match human perception of pane activity

## Verification

- `curl -s http://localhost:3009/api/status | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(d); process.exit(d.panes && d.panes.length > 0 ? 0 : 1)"` — API returns pane status array
- Manual: open WebSocket to ws/status, confirm transition events fire when terminal state changes
- Latency: typing in an active terminal shows no perceptible delay vs current behavior

## Observability / Diagnostics

- Runtime signals: StatusEngine logs state transitions at info level with `{ptyId, host, session, prev, next, trigger}` structure
- Inspection surfaces: GET /api/status, ws/status channel, StatusEngine.getAll() in-process
- Failure visibility: If classification fails, pane falls back to 'unknown' state with lastError field
- Redaction constraints: Terminal output content never leaves the server — only state labels are exposed

## Integration Closure

- Upstream surfaces consumed: `src/services/terminal.js` (activePTYs map, spawnTerminal/killTerminal lifecycle), `src/routes/terminal-ws.js` (PTY output stream hook)
- New wiring introduced in this slice: StatusEngine service, /api/status route, ws/status WebSocket channel, PTY output tap in terminal-ws.js
- What remains before the milestone is truly usable end-to-end: S02 (desktop badges), S03 (phone minimap), S04 (touch polish)

## Tasks

- [ ] **T01: Build StatusEngine core — output classifier + state machine** `est:1h`
  - Why: The central service that everything depends on. Analyzes terminal output, maintains per-PTY state, emits transitions.
  - Files: `src/services/status-engine.js`
  - Do: Create StatusEngine class with: ANSI strip function, pattern matchers for each state (shell prompt → idle, continuous output → working, `?`/`[y/N]`/Claude question patterns → asking, process exit/return-to-prompt → done, error patterns → error), rolling buffer per PTY (last 4KB), state machine with transition rules and cooldowns, subscribe/unsubscribe for event listeners, getAll() for snapshot. Export singleton.
  - Verify: `node -e "import('./src/services/status-engine.js').then(m => { const e = m.default; console.log(typeof e.feed, typeof e.getAll, typeof e.subscribe); })"` — all functions exist
  - Done when: StatusEngine can be imported, fed raw terminal output, and returns correct state classifications

- [ ] **T02: Wire StatusEngine into terminal PTY lifecycle** `est:30m`
  - Why: StatusEngine needs to see every byte of PTY output to classify state. Must hook into the existing data flow without disrupting it.
  - Files: `src/services/terminal.js`, `src/routes/terminal-ws.js`
  - Do: In terminal-ws.js, add parallel `term.onData()` listener that feeds output to StatusEngine.feed(id, host, session, data). On PTY exit, call StatusEngine.remove(id). On spawn, call StatusEngine.register(id, host, session). Ensure the status feed is non-blocking (fire-and-forget, no await).
  - Verify: Start a terminal session, check StatusEngine.getAll() returns an entry for it
  - Done when: Every active PTY's output flows through StatusEngine without affecting terminal relay speed

- [ ] **T03: REST API endpoint GET /api/status** `est:30m`
  - Why: Provides the polling endpoint for phone minimap and any client that doesn't use WebSocket.
  - Files: `src/routes/status.js`, `src/server.js`
  - Do: Create status route returning `{ panes: [{ ptyId, host, session, status, prevStatus, lastTransition, confidence }] }`. Register in server.js. Status values: idle, working, asking, done, error, unknown.
  - Verify: `curl -s http://localhost:3009/api/status | python3 -m json.tool` returns valid JSON with panes array
  - Done when: API returns current pane states for all active terminal connections

- [ ] **T04: WebSocket status channel ws/status** `est:45m`
  - Why: Enables real-time status updates for desktop badges and phone minimap without polling.
  - Files: `src/routes/status-ws.js`, `src/server.js`
  - Do: Create WebSocket route at ws/status. On connection, send current snapshot. Subscribe to StatusEngine transitions, push `{ type: 'status', ptyId, host, session, status, prevStatus, timestamp }` to all connected clients. Handle auth same as terminal WS. Clean up subscription on disconnect.
  - Verify: Connect via wscat or browser DevTools to ws://localhost:3009/ws/status, observe messages
  - Done when: Status transitions appear on WebSocket within 2 seconds of terminal output change

- [ ] **T05: Integration verification against live sessions** `est:30m`
  - Why: Pattern matching against real terminal output is the riskiest part. Must verify against actual Claude Code, shell, and GSD sessions running on Reliant.
  - Files: (no new files — testing existing implementation)
  - Do: Test against live sessions: (1) idle bash prompt → should show 'idle', (2) run `ls -la /` → brief 'working' then 'idle', (3) Claude Code session waiting for input → 'asking', (4) active Claude Code generating output → 'working'. Tune patterns if needed. Check typing latency hasn't regressed.
  - Verify: GET /api/status with at least 2 active sessions returns plausible states; no observable typing lag
  - Done when: Status engine correctly classifies at least 3 different session states from live Reliant sessions

## Files Likely Touched

- `src/services/status-engine.js` (new)
- `src/routes/status.js` (new)
- `src/routes/status-ws.js` (new)
- `src/routes/terminal-ws.js` (modified — add output tap)
- `src/server.js` (modified — register new routes)
