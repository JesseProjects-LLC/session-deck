---
estimated_steps: 10
estimated_files: 3
skills_used: []
---

# T01: Server-side WebSocket + PTY terminal bridge

1. Install node-pty on server side for local PTY spawning
2. Install @fastify/websocket for WebSocket upgrade handling
3. Create src/services/terminal.js — manages PTY instances
4. For local sessions: spawn pty with tmux attach -t <session>
5. For remote sessions: spawn pty with ssh host -t tmux attach -t <session>
6. Wire PTY data event to WebSocket send, WebSocket message to PTY write
7. Handle resize messages (cols/rows) from client
8. Handle disconnect/cleanup — kill PTY on WebSocket close
9. Create WebSocket route: /ws/terminal?session=<name>&host=<host>
10. Register in server.js

## Inputs

- ``src/services/tmux.js` — existing tmux service for host resolution`
- ``src/server.js` — server to register WebSocket route`

## Expected Output

- ``src/services/terminal.js` — PTY lifecycle manager`
- ``src/routes/terminal-ws.js` — WebSocket route for terminal I/O`

## Verification

wscat -c ws://localhost:7890/ws/terminal?session=business sends/receives terminal data
