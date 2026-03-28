# S02: Single xterm.js pane with WebSocket terminal I/O — UAT

**Milestone:** M002
**Written:** 2026-03-28T17:54:51.246Z

## UAT: S02 \u2014 Single xterm.js pane with WebSocket terminal I/O\n\n### Test 1: Terminal renders\nOpen http://192.168.150.120:7890/ in browser\nExpect: Live terminal showing tmux session with colors and status bar\n\n### Test 2: Interactive input\nClick terminal, type `echo hello`, press Enter\nExpect: `hello` printed, new prompt appears\n\n### Test 3: Session switching\nSelect different session from dropdown\nExpect: Old terminal disconnects, new session renders with LIVE badge\n\n### Test 4: Copy/paste (R031)\nSelect text in terminal, paste into text editor\nExpect: Clean text without extra line breaks or formatting artifacts"
