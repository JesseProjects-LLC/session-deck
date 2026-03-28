# S02: Session inventory panel

**Goal:** Prove the core terminal I/O pipeline: browser xterm.js <-> WebSocket <-> server <-> tmux attach
**Demo:** After this: Left panel shows live tmux sessions grouped by host with status indicators

## Tasks
- [x] **T01: WebSocket + node-pty terminal bridge — PTY spawns tmux attach, relays I/O bidirectionally** — 1. Install node-pty on server side for local PTY spawning
2. Install @fastify/websocket for WebSocket upgrade handling
3. Create src/services/terminal.js — manages PTY instances
4. For local sessions: spawn pty with tmux attach -t <session>
5. For remote sessions: spawn pty with ssh host -t tmux attach -t <session>
6. Wire PTY data event to WebSocket send, WebSocket message to PTY write
7. Handle resize messages (cols/rows) from client
8. Handle disconnect/cleanup — kill PTY on WebSocket close
9. Create WebSocket route: /ws/terminal?session=<name>&host=<host>
10. Register in server.js
  - Estimate: 25min
  - Files: src/services/terminal.js, src/routes/terminal-ws.js, src/server.js
  - Verify: wscat -c ws://localhost:7890/ws/terminal?session=business sends/receives terminal data
- [x] **T02: xterm.js Svelte component with live WebSocket terminal — fully interactive with session switching** — 1. Install xterm and @xterm/addon-fit in frontend
2. Create frontend/src/lib/Terminal.svelte component
3. Initialize xterm.js Terminal instance in onMount
4. Connect WebSocket to /ws/terminal?session=<name>&host=<host>
5. Wire xterm onData to WebSocket send, WebSocket onmessage to xterm write
6. Handle resize: use FitAddon to auto-size, send resize message to server
7. Handle reconnection on WebSocket close
8. Style terminal container to fill parent
9. Update App.svelte to render a Terminal component connected to a real session
10. Verify clean copy/paste via xterm.js selection model
  - Estimate: 25min
  - Files: frontend/src/lib/Terminal.svelte, frontend/src/App.svelte, frontend/package.json
  - Verify: Open browser, see live terminal connected to tmux session, type ls and see output, select text and paste into another app — verify clean text
