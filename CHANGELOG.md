# Changelog

All notable changes to Session Deck will be documented in this file.

## [0.1.0] — 2026-03-30

### Added
- **Settings menu** — Click the SESSION DECK logo to access all configuration
  - Servers: manage SSH hosts with add/edit/remove, import from ~/.ssh/config
  - Sessions: tmux session management with per-host filtering
  - Appearance: session type color preview
  - Help: keyboard shortcuts reference, copy/paste docs, version info
- **Host management** — Hosts persisted in SQLite (not just parsed from SSH config)
  - Full CRUD: add, edit, remove hosts from the UI
  - Import from ~/.ssh/config with one click
  - Auto-import on first visit if no hosts configured
- **Host connectivity testing** — Test SSH reachability per host or all at once
  - tmux detection: shows if tmux is installed on each host
  - OS detection: identifies the remote OS (Ubuntu, Debian, Alpine, etc.)
  - Install guidance: suggests the correct `apt/apk/dnf/yum` command if tmux is missing
  - Copy-to-clipboard for install commands
- **Session management in settings** — Per-host session filtering with host tabs
  - Cross-navigation: click a server → see its sessions
  - Create sessions with host selector
  - Both entry points work: settings menu and status bar link
- **Copy/paste** — Clean clipboard output from terminal panes (no line-break artifacts)
  - Uses xterm.js native selection + browser Clipboard API
  - Select with mouse, Ctrl+C to copy, Ctrl+V to paste

### Previous (unversioned)
- Live xterm.js terminals connected to tmux sessions via WebSocket
- Split-tree workspace layouts with 6 presets (dual, claude-focus, quad, infra, deck, mixed)
- Drag-to-resize pane borders
- Drag-and-drop pane rearrangement (swap and directional split)
- Workspace CRUD: create, rename, duplicate, delete (persisted in SQLite)
- Session picker: assign any tmux session to any pane
- Properties panel with session details and workspace cross-references
- Right-click context menus on workspace tabs and pane headers
- Keyboard shortcuts: 1-9 workspace switch, N new, I properties, Ctrl+Shift+F zoom
- Multi-host tmux session inventory (local + remote via SSH)
- Session type detection: Claude Code, GSD, terminal
- Lazy connect: only active workspace has live WebSocket connections
- Toast notifications for all actions
- systemd service on Reliant (192.168.150.120)
- Accessible at deck.hha.sh via local DNS
