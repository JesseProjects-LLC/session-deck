---
id: T01
parent: S02
milestone: M002
provides: []
requires: []
affects: []
key_files: ["src/services/terminal.js", "src/routes/terminal-ws.js", "src/server.js"]
key_decisions: ["node-pty for local PTY spawning (not raw child_process)", "tmux attach-session via PTY for local, ssh -t for remote", "JSON control messages for resize, raw strings for terminal I/O", "xterm-256color TERM for proper color support"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "node-pty directly spawns tmux attach and receives terminal escape sequences. WebSocket upgrade returns 101. PTY data flows through WebSocket."
completed_at: 2026-03-28T17:54:01.262Z
blocker_discovered: false
---

# T01: WebSocket + node-pty terminal bridge — PTY spawns tmux attach, relays I/O bidirectionally

> WebSocket + node-pty terminal bridge — PTY spawns tmux attach, relays I/O bidirectionally

## What Happened
---
id: T01
parent: S02
milestone: M002
key_files:
  - src/services/terminal.js
  - src/routes/terminal-ws.js
  - src/server.js
key_decisions:
  - node-pty for local PTY spawning (not raw child_process)
  - tmux attach-session via PTY for local, ssh -t for remote
  - JSON control messages for resize, raw strings for terminal I/O
  - xterm-256color TERM for proper color support
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:54:01.263Z
blocker_discovered: false
---

# T01: WebSocket + node-pty terminal bridge — PTY spawns tmux attach, relays I/O bidirectionally

**WebSocket + node-pty terminal bridge — PTY spawns tmux attach, relays I/O bidirectionally**

## What Happened

Built the server-side terminal bridge: @fastify/websocket handles WebSocket upgrades, node-pty spawns PTY processes running tmux attach-session (local) or ssh -t tmux attach (remote). PTY output streams to WebSocket, WebSocket input writes to PTY. JSON control messages handle resize. Proper cleanup on disconnect — kill PTY on WebSocket close and vice versa.

## Verification

node-pty directly spawns tmux attach and receives terminal escape sequences. WebSocket upgrade returns 101. PTY data flows through WebSocket.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `node -e 'pty.spawn tmux attach...' — received terminal data` | 0 | ✅ pass | 2000ms |
| 2 | `curl WebSocket upgrade — 101 Switching Protocols` | 0 | ✅ pass | 100ms |


## Deviations

Fixed WebSocket message parsing — used string-based JSON detection instead of byte-level check.

## Known Issues

None.

## Files Created/Modified

- `src/services/terminal.js`
- `src/routes/terminal-ws.js`
- `src/server.js`


## Deviations
Fixed WebSocket message parsing — used string-based JSON detection instead of byte-level check.

## Known Issues
None.
