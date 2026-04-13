# M005: Mobile Experience + Activity Intelligence

**Gathered:** 2026-04-13
**Status:** Ready for planning

## Project Description

Add intelligent pane status detection (working/asking/idle/done/error), wire status events into desktop UI indicators, build a phone-optimized minimap view showing workspace layout as tappable status cards, and ensure full tablet/phone interaction when zoomed into a pane. Architect the status event system as a bus that future consumers (ClawDeck, mobile push notifications, external integrations) can subscribe to.

## Why This Milestone

Session Deck is already usable on iPad but has no awareness of *what's happening* in each pane. Users monitoring multiple Claude Code sessions, builds, or long-running tasks need at-a-glance status without reading terminal output. Phone users need an even more compact view — the current mobile single-pane layout wastes the phone form factor on a terminal that's too small to read. The activity intelligence layer also unblocks future ClawDeck integration (Stream Deck buttons reflecting pane state) and desktop notifications.

## User-Visible Outcome

### When this milestone is complete, the user can:

- See at a glance which panes are working, waiting for input, idle, done, or errored — on desktop, phone, and tablet
- View their phone and see a minimap of all workspace panes with color-coded status indicators
- Tap any pane card on phone to zoom into full-screen interactive terminal
- Receive browser notifications on desktop when a pane transitions to "asking" state
- See workspace tabs pulse/badge when panes in that workspace need attention

### Entry point / environment

- Entry point: https://deck.hha.sh (existing web app)
- Environment: browser — desktop, tablet (iPad), phone (iPhone/Android)
- Live dependencies involved: tmux PTY output streams (existing), WebSocket connections (existing)

## Completion Class

- Contract complete means: status detection correctly classifies known output patterns; API returns structured status; phone minimap renders workspace layout as cards
- Integration complete means: live terminal output triggers status transitions visible in desktop UI and phone minimap simultaneously
- Operational complete means: status engine runs continuously without degrading terminal performance; phone view works on real iPhone/Android browsers

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Desktop user sees a workspace tab badge appear when a background pane transitions to "asking" and receives a browser notification
- Phone user sees minimap with correct status colors, taps a pane, interacts with the terminal, and returns to minimap
- Status transitions are visible within 2 seconds of the underlying terminal output change
- No performance regression on terminal typing latency

## Architectural Decisions

### Pane Status as Event Bus

**Decision:** Status engine emits events on a typed event bus (server-side EventEmitter + WebSocket channel), not just HTTP polling. States are a defined enum: `idle`, `working`, `asking`, `done`, `error`.

**Rationale:** Multiple consumers need real-time status: desktop UI badges, phone minimap, browser notifications, and eventually ClawDeck bridge. A bus lets any consumer subscribe without coupling to the activity polling endpoint. The enum ensures consistent semantics across all consumers.

**Alternatives Considered:**
- Polling-only (extend existing /api/activity) — too slow for "asking" notifications, adds latency
- Per-consumer WebSocket channels — over-engineered for v1, bus is simpler

### Phone Layout: Minimap + Zoom

**Decision:** Phone (< 480px) shows workspace as a grid of status cards matching actual layout proportions. Tap to zoom into full-screen interactive terminal. Landscape shows zoomed-out activity view.

**Rationale:** Terminal text is unreadable on phone screens. The minimap gives at-a-glance status awareness — the primary phone use case. Full interaction is available on tap for when you need to respond to a question or check output.

**Alternatives Considered:**
- Read-only phone — too limiting, user explicitly wants interaction capability
- Scrollable terminal list — loses spatial awareness of workspace layout

---

## Error Handling Strategy

- Status detection failures (regex miss, unexpected output) default to `idle` — never surface false positives for `asking` or `error`
- WebSocket status channel uses same reconnect logic as terminal WebSocket
- Phone minimap gracefully degrades to session list if layout data is unavailable
- Browser notification permission denial is handled silently (UI badges still work)

## Risks and Unknowns

- **Terminal output classification accuracy** — regex-based detection of "asking a question" vs normal prompt output may have false positives/negatives, especially across different tools (Claude Code, vim, htop)
- **Touch scroll vs xterm mouse capture** — xterm.js may capture touch events for mouse protocol, preventing scroll-back on phone
- **Performance of server-side output scanning** — reading PTY output for status classification adds CPU overhead per connection

## Existing Codebase / Prior Art

- `src/services/terminal.js` — PTY lifecycle, `activePTYs` map with per-connection state
- `src/routes/terminal-ws.js` — WebSocket handler, PTY output → socket relay (status tap point)
- `src/routes/activity.js` — polls tmux `session_activity` timestamps, no output analysis
- `src/services/tmux.js` — `listAllActivity()` using `session_activity` format string
- `frontend/src/lib/stores/activity.js` — client-side polling, workspace badge computation
- `frontend/src/lib/Terminal.svelte` — xterm.js setup, connect/disconnect, resize handling
- `frontend/src/App.svelte` — mobile detection (`isMobile` at 768px), `mobileActivePane` tab switching

## Relevant Requirements

- R011 — Live terminal rendering (status engine must not interfere)
- R012 — Lazy connect (phone minimap should not require WebSocket per pane)
- R013 — Automatic reconnection (status channel needs same resilience)
- R014 — Keyboard shortcuts for workspace switching (phone equivalent via minimap taps)
- R024 — Web-based UI accessible from any browser (now including phone browsers)

## Scope

### In Scope

- Server-side pane status detection engine with typed event bus
- WebSocket channel for real-time status push
- Desktop UI: workspace tab badges, pane header status indicators
- Browser notifications for "asking" state transitions
- Phone minimap view with status cards matching workspace layout
- Tap-to-zoom full-screen terminal interaction on phone
- Touch scroll-back in terminal panes
- Landscape phone zoomed-out activity overview

### Out of Scope / Non-Goals

- ClawDeck/Stream Deck integration (future milestone, but architecture supports it)
- Push notifications (PWA/native) — browser notifications only for now
- Multi-user awareness (who is viewing which pane)
- Session recording/playback
- Custom notification sounds or per-pane notification rules

## Technical Constraints

- No additional server dependencies — status detection runs in-process alongside existing PTY management
- Phone minimap must work without establishing WebSocket connections to every pane (use status API)
- Status detection must add < 5ms latency to terminal output relay
- Must work on Safari iOS (no Web Worker SharedArrayBuffer, limited notification API)

## Integration Points

- tmux PTY output stream — tap into existing `term.onData()` in terminal-ws.js for status classification
- Activity polling endpoint — extend or replace with structured status data
- WebSocket infrastructure — new status channel alongside terminal data channel
- Browser Notification API — permission request flow, notification display
- Future: ClawDeck bridge HTTP API — will consume the same status bus events

## Testing Requirements

- Status detection: test against known output samples (Claude Code prompts, shell prompts, error output, continuous build output)
- Phone minimap: visual verification on real phone viewport (375px width)
- Desktop badges: verify badge appears/clears on workspace switch
- Performance: terminal typing latency benchmark before/after status engine
- Touch interaction: verify scroll-back works on iOS Safari

## Acceptance Criteria

- S01: Status engine correctly classifies idle/working/asking/done/error for Claude Code sessions and plain shell sessions; API returns structured status per pane
- S02: Desktop workspace tabs show colored badge when background pane is "asking"; browser notification fires; badge clears on workspace switch
- S03: Phone minimap shows workspace layout as status cards; tap zooms to full-screen terminal; back returns to minimap
- S04: Full terminal interaction works on phone (type, scroll-back, paste); swipe between panes in full-screen mode

## Open Questions

- Exact heuristics for "asking" detection — what patterns does Claude Code use for user prompts? Will need to sample real output and iterate.
- Should landscape phone show the minimap with smaller cards, or a horizontal scrolling pane list?
