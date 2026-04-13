# M005: Mobile Experience + Activity Intelligence

**Vision:** Intelligent pane status awareness across all devices — desktop badges and notifications, phone minimap with tap-to-interact, and an event bus architecture that future consumers (ClawDeck, push notifications) can subscribe to.

## Success Criteria

- User can see at a glance which panes are working, asking, idle, done, or errored — on any device
- Phone user sees a minimap of workspace panes with status colors and can tap to interact
- Desktop user receives browser notification when a background pane transitions to "asking"
- Status transitions appear within 2 seconds of the underlying terminal output change
- No measurable regression in terminal typing latency

## Key Risks / Unknowns

- Terminal output classification accuracy — regex heuristics may produce false positives for "asking" on non-Claude-Code sessions, or miss prompts with unusual formatting
- Touch scroll vs xterm mouse capture — iOS Safari may not allow scroll-back if xterm captures touch events for mouse protocol
- Server-side output scanning overhead — analyzing every PTY output chunk adds per-character CPU cost

## Proof Strategy

- Output classification accuracy → retire in S01 by testing against real Claude Code, shell, and TUI output samples on Reliant
- Touch scroll conflict → retire in S04 by verifying scroll-back on real iOS Safari with xterm mouse protocol disabled
- Output scanning overhead → retire in S01 by benchmarking terminal relay latency before and after status engine

## Verification Classes

- Contract verification: status detection unit tests against captured output samples; API response schema validation
- Integration verification: live terminal output triggers status change visible in desktop UI and phone minimap simultaneously
- Operational verification: status engine runs for 1+ hours without memory leak or CPU drift; reconnect after network drop preserves status
- UAT / human verification: phone minimap usability on real iPhone; desktop notification timing feels responsive

## Milestone Definition of Done

This milestone is complete only when all are true:

- All four slices delivered and verified
- Status engine, desktop indicators, and phone minimap all consume the same event bus
- Real Claude Code session triggers "asking" status → desktop badge + notification + phone minimap color change
- Phone user can tap minimap card → interact with terminal → return to minimap
- Typing latency on desktop has not regressed (< 50ms p99)

## Requirement Coverage

- Covers: R011, R012, R013, R014, R024
- Partially covers: none
- Leaves for later: ClawDeck integration, multi-user, session recording
- Orphan risks: none

## Slices

- [ ] **S01: Pane Status Engine** `risk:high` `depends:[]`
  > After this: server classifies each active PTY as idle/working/asking/done/error; GET /api/status returns structured pane states; WebSocket status channel pushes transitions in real time; verified against live Claude Code and shell sessions on Reliant
- [ ] **S02: Desktop Activity Indicators** `risk:medium` `depends:[S01]`
  > After this: workspace tabs show colored badge/pulse when a background pane is "asking" or "done"; pane headers display status badge alongside LIVE indicator; browser notification fires on "asking" transition; badge clears when user switches to that workspace
- [ ] **S03: Phone Minimap View** `risk:medium` `depends:[S01]`
  > After this: phone (< 480px) shows workspace as a grid of tappable status cards matching actual layout proportions; each card shows session name, host, type, and color-coded status; tap zooms to full-screen terminal; back gesture returns to minimap
- [ ] **S04: Touch Interaction + Polish** `risk:low` `depends:[S02,S03]`
  > After this: full terminal interaction works on phone (keyboard, scroll-back, paste); swipe between panes in full-screen mode; landscape phone shows zoomed-out activity overview; touch scroll-back confirmed working on iOS Safari

## Horizontal Checklist

- [ ] Every active R### re-read against new code — still fully satisfied?
- [ ] Every D### from prior milestones re-evaluated — still valid at new scope?
- [ ] Graceful shutdown / cleanup on termination verified
- [ ] Revenue / billing path impact assessed (or N/A)
- [ ] Auth boundary documented — what's protected vs public
- [ ] Shared resource budget confirmed — connection pools, caches, rate limits hold under peak
- [ ] Reconnection / retry strategy verified for every external dependency

## Boundary Map

### S01 → S02

Produces:
- `GET /api/status` returning `{ panes: [{ host, session, status, lastTransition, ptyId }] }` where status is one of `idle|working|asking|done|error`
- WebSocket channel `ws/status` pushing `{ type: 'status', host, session, status, prevStatus, timestamp }` events
- Server-side `StatusEngine` class with `subscribe(callback)` method for in-process consumers

Consumes:
- nothing (first slice)

### S01 → S03

Produces:
- Same `GET /api/status` endpoint (phone minimap polls this instead of establishing per-pane WebSockets)
- Same WebSocket status channel (for real-time minimap updates when phone is active)

Consumes:
- nothing (first slice)

### S02 → S04

Produces:
- Desktop notification permission flow (reused for any future notification triggers)
- Activity badge component with color-coding logic (reused in phone minimap cards)

Consumes:
- S01 status API and WebSocket channel

### S03 → S04

Produces:
- Phone minimap layout component with tap-to-zoom navigation
- Full-screen terminal wrapper with back navigation

Consumes:
- S01 status API and WebSocket channel
