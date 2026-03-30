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

### Infrastructure
- Traefik on hexapuma handles *.hha.sh routing (Cloudflare DNS challenge for certs)
- AdGuard on 192.168.150.110 handles local DNS rewrites
- Traefik dynamic config: /opt/management/traefik-config/internal-routes-hha.yml on hexapuma
- All *.hha.sh services use the same pattern: Traefik file provider route → backend service URL
- UniFi gateway (192.168.4.1) runs dnsmasq but config is auto-managed — don't edit /run/ directly

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

### Scroll loop (resize/redraw feedback)
- Root cause: ResizeObserver → fit() → sendResize → tmux redraw → content change → ResizeObserver
- Especially bad with narrow panes and TUI apps (Claude Code, vim, htop)
- Mitigations applied (cumulative):
  1. Debounce ResizeObserver to 250ms
  2. Skip resize when cols/rows unchanged
  3. Suppress resize during WebSocket output (200ms cooldown)
  4. Minimum container size threshold (80x40 px)
  5. Server-side debounce (100ms) and dedup on PTY resize
  6. Rate limit resize to max 1 per second per terminal
- Still not 100% eliminated — some TUI apps in small panes can trigger it

### Browser keyboard conflicts
- Ctrl+P → browser print. Cannot reliably preventDefault.
- Ctrl+Shift+P → also print on some systems. Unreliable.
- Safe shortcuts: plain letters (N, I), Ctrl+Shift+F, 1-9, Escape
- Status bar hints must be clickable as fallback for keyboard-shy users

### Font/icon rendering in terminals
- Unicode icons (☰, ⊟, ⊞) render inconsistently across systems and fonts
- Box-drawing characters (┃, ━) may collapse to single pixel width
- Solution: use pure CSS shapes for icons, plain text for labels
- Always test with JetBrains Mono / system fallback, never assume emoji support

## Project Pivot (2026-03-27)
- Originally: config generator for WezTerm + ClawDeck integration
- Now: web-native terminal workspace manager with xterm.js
- WezTerm config generation dropped entirely
- ClawDeck integration deferred to future milestone
- M001 API work (sessions, hosts) fully reusable
- M003 roadmap (WezTerm/ClawDeck config gen) is OBSOLETE — needs replanning

## User Feedback (2026-03-29)

### UX Principles Observed
- If a button exists, it must do something. No placeholder/dead buttons.
- Icons must render correctly or use CSS/text. No broken glyphs.
- Right-click context menus should be consistent across all right-clickable surfaces.
- Status bar hints should be clickable AND have keyboard shortcuts.
- Properties panel should show information relevant to the USER's mental model (workspace cross-references), not system internals (tmux window count).
- Don't hijack browser shortcuts (Ctrl+P, Ctrl+Shift+P).
- Session switching should only reconnect the changed pane, not all panes.
- Drag-and-drop preview should distinguish "swap" (green, full-pane) from "split" (blue, half-pane).

### Confirmed Working Well
- Performance: no lag on typing
- Drag-and-drop rearrangement (swap + directional)
- Session assignment speed (after fix — single pane reconnect)
- Workspace management (create/rename/duplicate/delete)
- Right-click consistency (workspace tabs + pane headers)
- Keyboard shortcuts (1-9 workspace, N new, I properties, Ctrl+Shift+F zoom)

### Outstanding User Requests
1. tmux session management UI — create/rename/delete sessions across all hosts from within Session Deck
2. Full workspace management modal (drag panes, performance data, latency metrics) — "next version"
3. ClawDeck integration — Stream Deck buttons trigger workspace/pane actions via HTTP
4. Copy/paste optimization — clean clipboard content without line-break artifacts (D008)
5. Command palette (Ctrl+K) — quick access to all actions
6. Mobile/responsive view for monitoring
