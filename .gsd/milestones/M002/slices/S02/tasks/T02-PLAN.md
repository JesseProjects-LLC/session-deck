---
estimated_steps: 10
estimated_files: 3
skills_used: []
---

# T02: xterm.js Svelte component with WebSocket connection

1. Install xterm and @xterm/addon-fit in frontend
2. Create frontend/src/lib/Terminal.svelte component
3. Initialize xterm.js Terminal instance in onMount
4. Connect WebSocket to /ws/terminal?session=<name>&host=<host>
5. Wire xterm onData to WebSocket send, WebSocket onmessage to xterm write
6. Handle resize: use FitAddon to auto-size, send resize message to server
7. Handle reconnection on WebSocket close
8. Style terminal container to fill parent
9. Update App.svelte to render a Terminal component connected to a real session
10. Verify clean copy/paste via xterm.js selection model

## Inputs

- ``src/routes/terminal-ws.js` — WebSocket endpoint from T01`

## Expected Output

- ``frontend/src/lib/Terminal.svelte` — xterm.js terminal component`
- ``frontend/src/App.svelte` — updated to show live terminal`

## Verification

Open browser, see live terminal connected to tmux session, type ls and see output, select text and paste into another app — verify clean text
