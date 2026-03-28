# Knowledge Base

## Architecture Patterns

### SSH Command Execution
- Use `ssh <host> "tmux list-sessions -F '#{session_name}:#{session_windows}:#{session_attached}'"` for remote tmux queries
- Connection timeout: 5s to prevent UI blocking on unreachable hosts
- Use SSH multiplexing (`ControlMaster`) for performance

### tmux Session Detection
- Claude Code sessions: look for `claude` process in session panes
- GSD sessions: look for `gsd` or `pi` process in session panes
- Plain terminal: fallback when no special process detected
- Command: `tmux list-panes -t <session> -F '#{pane_current_command}'`

### Network Topology
- Reliant (192.168.150.120) — LXC on Proxmox, primary host
- Desktop (192.168.6.142) — Windows 11, Stream Deck
- Agamemnon (192.168.12.200) — QNAP NAS, different subnet
- Manticore (192.168.11.100) — Proxmox host
- Hexapuma (192.168.150.140) — Docker VM on Proxmox
- Wayfarer (31.220.57.14) — external VPS
- Sirius (76.13.103.90) — external VPS

## Gotchas

### systemd PrivateTmp blocks tmux
- `PrivateTmp=true` in systemd gives the service its own `/tmp` namespace
- tmux socket lives at `/tmp/tmux-1002/default` — invisible to the service with PrivateTmp
- Solution: remove PrivateTmp (and ProtectSystem/ProtectHome which also interfere)
- Only `NoNewPrivileges=true` is safe to keep

### SSH execFileAsync stderr
- Node's `promisify(execFile)` error objects have a `.stderr` property
- Must include `err.stderr` in error classification, not just `err.message`
- tmux "command not found" appears in stderr, not message

## Project Pivot (2026-03-27)
- Originally: config generator for WezTerm + ClawDeck integration
- Now: web-native terminal workspace manager with xterm.js
- WezTerm config generation dropped entirely
- ClawDeck integration deferred to future milestone
- M001 API work (sessions, hosts) fully reusable
