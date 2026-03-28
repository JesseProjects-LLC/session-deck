# Requirements

| ID | Description | Status | Validation | Primary Owner | Supporting |
|----|-------------|--------|------------|---------------|------------|
| R001 | List all tmux sessions on all configured remote hosts (name, attached count, window count) | active | tmux list-sessions output parsed correctly for each configured host | M001/S03 | — |
| R002 | List all SSH hosts from ~/.ssh/config with aliases and IPs | active | SSH config parsed, hosts enumerated with correct aliases | M001/S02 | — |
| R003 | Create new tmux sessions on any remote host (name, starting directory) | active | New session appears in tmux list-sessions after creation | M001/S04 | — |
| R004 | Rename/delete tmux sessions on any host | active | Session renamed/removed, verified via tmux list-sessions | M001/S04 | — |
| R005 | Show which tmux sessions are currently attached and from where | active | Attached sessions show client count and source | M001/S03 | — |
| R006 | Detect session type: Claude Code, GSD, plain terminal (from running command) | active | Session type correctly identified from process inspection | M001/S03 | — |
| R007 | Multi-host session management across all configured hosts | active | Sessions from Reliant, Agamemnon, VPSs, Proxmox all listed | M001/S03 | — |
| R008 | Per-host connection status: show which hosts are reachable vs down | active | Unreachable hosts shown with error state, reachable hosts show sessions | M001/S03 | — |
| R009 | Host grouping: organize hosts by category (HomeLab, VPS, NAS) | active | Hosts grouped in UI matching configured categories | M001/S02 | — |
| R010 | Define workspace layouts: name, grid dimensions, which session goes in each cell | active | Workspace editor allows grid config and session assignment | — | — |
| R011 | Live terminal rendering via xterm.js in each grid cell | active | Terminal pane shows live tmux session output, accepts input | — | — |
| R012 | Lazy connect: only active workspace has live WebSocket connections | active | Switching workspace disconnects old panes, connects new ones | — | — |
| R013 | Automatic reconnection on network drop or workspace switch | active | Terminal reconnects to tmux session without losing state | — | — |
| R014 | Keyboard shortcut: switch between workspaces | active | Keyboard shortcut cycles or jumps to workspace by number | — | — |
| R015 | Keyboard shortcut: navigate between panes within a workspace | active | Arrow keys or vim-style keys move focus between panes | — | — |
| R016 | Keyboard shortcut: zoom/maximize a single pane (and restore) | active | Shortcut toggles pane between grid cell and full-screen | — | — |
| R017 | Keyboard shortcut: open session management panel | active | Shortcut toggles session management overlay | — | — |
| R018 | Save/load workspace layouts (presets) | active | Presets persist across server restarts | — | — |
| R019 | Session management UI: create, rename, delete sessions from browser | active | UI panel for session CRUD without touching terminal | — | — |
| R020 | Session management UI: assign/unassign sessions to workspace panes | active | Drag or select to place sessions into grid cells | — | — |
| R021 | Session management UI: show session inventory grouped by host | active | All sessions visible, grouped by host, with type indicators | — | — |
| R022 | Visual indicators: session type (Claude Code, GSD, terminal) shown in UI | active | Color-coded dots or labels per session type | — | — |
| R023 | Visual indicators: host reachability status | active | Online/offline/error shown per host | — | — |
| R024 | Web-based UI accessible from any browser on local network | active | UI loads and is functional from browser on different device | — | — |
| R025 | Resizable panes within workspace grid | active | Drag borders to resize panes within the grid | — | — |
| R026 | Runs on Reliant with direct tmux access | active | Server starts, connects to local tmux, serves UI | M001/S01 | — |
| R027 | Lightweight Node.js server | active | Server starts in <2s, memory <100MB | M001/S01 | — |
| R028 | REST + WebSocket API | active | REST for session management, WebSocket for terminal I/O | — | — |
| R029 | Persistent storage for workspace layouts (SQLite) | active | Data survives server restart | M001/S05 | — |
| R030 | systemd service on Reliant | active | Service starts/stops/restarts cleanly via systemctl | M001/S05 | — |
| R031 | Clean copy/paste from terminal panes — no extra line breaks, no indentation artifacts, no visual decoration in clipboard | active | Select text in xterm.js pane, paste into external editor, output matches original terminal content exactly | — | — |
