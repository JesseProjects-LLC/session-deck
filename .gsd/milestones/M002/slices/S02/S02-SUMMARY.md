---
id: S02
parent: M002
milestone: M002
provides:
  - Terminal.svelte component
  - WebSocket terminal bridge
  - PTY lifecycle manager
  - /ws/terminal endpoint
requires:
  - slice: S01
    provides: Svelte + Vite build pipeline
affects:
  - S03
  - S04
  - S05
key_files:
  - src/services/terminal.js
  - src/routes/terminal-ws.js
  - frontend/src/lib/Terminal.svelte
key_decisions:
  - node-pty for PTY spawning
  - @xterm/xterm over deprecated xterm
  - JSON control messages for resize, raw strings for I/O
  - Auto-reconnect on abnormal WebSocket close
patterns_established:
  - Terminal.svelte component for xterm.js + WebSocket
  - PTY lifecycle management in terminal.js service
  - JSON control messages for out-of-band terminal control
  - Svelte #key block for clean component remount on session switch
observability_surfaces:
  - WebSocket connection/disconnect logged with session and host
  - PTY spawn/exit logged with session ID
  - LIVE/CONNECTING/Disconnected badges in UI
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:54:51.246Z
blocker_discovered: false
---

# S02: Single xterm.js pane with WebSocket terminal I/O

**Core terminal pipeline proven — xterm.js in browser connected to tmux sessions via WebSocket + node-pty**

## What Happened

Proved the core terminal I/O pipeline end-to-end. Server side: @fastify/websocket handles upgrades, node-pty spawns PTY running tmux attach-session, bidirectional data relay with JSON resize control messages. Client side: Terminal.svelte wraps xterm.js with FitAddon, ResizeObserver, auto-reconnect, and connection status badges. Verified by typing echo hello in the business session and seeing output, then switching to the main Claude Code session and seeing full color rendering with tmux status bar.

## Verification

echo hello typed in browser terminal, output received. Session switch from business to main works with full color rendering. Core pipeline proven end-to-end.

## Requirements Advanced

- R011 — xterm.js renders terminal output in browser
- R028 — WebSocket relays terminal I/O
- R013 — Auto-reconnect on WebSocket close

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Used @xterm/xterm instead of deprecated xterm package.

## Known Limitations

Copy/paste not yet UAT-verified by user. Session type detection in Terminal.svelte uses name heuristic — should use API type data.

## Follow-ups

Copy/paste needs explicit verification with a real user selecting text. xterm.js selection model should produce clean text but needs R031 UAT.

## Files Created/Modified

- `src/services/terminal.js` — PTY lifecycle manager for terminal connections
- `src/routes/terminal-ws.js` — WebSocket route for terminal I/O
- `src/server.js` — Added WebSocket plugin and terminal route registration
- `frontend/src/lib/Terminal.svelte` — xterm.js terminal component with WebSocket connection
- `frontend/src/App.svelte` — Updated to show live terminal with session selector
- `frontend/src/main.js` — Added xterm.js CSS import
- `package.json` — Added @fastify/websocket and node-pty
- `frontend/package.json` — Added @xterm/xterm and addons
