# Session Deck — Web-Based tmux Workspace Manager

## Vision
A web-based terminal workspace manager that connects directly to tmux sessions across multiple hosts. Open a browser, see your workspaces with live terminal panes, manage sessions, and work. No WezTerm, no config files — the browser IS the terminal interface.

## Current State (as of 2026-03-29)

**Live at `https://deck.hha.sh`** — systemd service on Reliant, Traefik reverse proxy on hexapuma, AdGuard DNS.

### What works today
- 3 workspace presets (claude-focus, quad, 4×3 deck) with custom workspaces
- Live xterm.js terminals connected to tmux sessions via WebSocket
- Drag-and-drop pane rearrangement with swap detection
- Split/close/zoom pane operations
- Session assignment picker (click session name → choose from list)
- Right-click context menus on workspace tabs AND pane headers
- Properties panel with workspace cross-references
- Keyboard shortcuts: 1-9 workspace, Shift+1-9 pane focus, N new, I properties, Ctrl+Shift+F zoom, Esc unzoom
- Clickable status bar shortcut hints
- SQLite persistence — survives page reload
- Auto-refresh session list every 30s
- Multi-host session loading (local fast, remote background)

### Known issues
- Scroll loop still occurs occasionally in narrow panes with TUI apps (mitigated but not eliminated)
- Copy/paste from terminal panes not yet optimized (D008 — first-class requirement)
- No tmux session create/rename/delete from the UI
- No command palette (Ctrl+K)
- Mobile/responsive view not started
- Remote host connections (hexapuma, agamemnon etc.) not tested end-to-end

## Core Architecture

```
Browser (any device on LAN)
    ↓ WebSocket per terminal pane
Session Deck Server (Reliant, port 7890)
    ├── Svelte frontend
    │   ├── Workspace tabs with keyboard switching
    │   ├── Recursive split-tree layout with drag-to-resize
    │   ├── xterm.js terminal instances per pane
    │   ├── Drag-and-drop pane rearrangement
    │   ├── Session picker + properties panel
    │   └── Keyboard shortcuts for all operations
    ├── WebSocket → tmux attach (per pane via node-pty)
    │   ├── Local: tmux attach -t <session>
    │   └── Remote: ssh host -t tmux attach -t <session>
    ├── Session inventory API (REST)
    │   ├── tmux CLI (local) → Reliant sessions
    │   ├── SSH → remote tmux CLI → other hosts
    │   └── SSH config parser → host list
    └── SQLite → workspace layouts, session assignments
```

## Hosting
- **Service:** systemd `session-deck.service` on Reliant (LXC 102, 192.168.150.120)
- **Reverse proxy:** Traefik on hexapuma (192.168.150.140) — `deck.hha.sh` → Reliant:7890
- **Certificate:** `*.hha.sh` wildcard via Cloudflare DNS challenge
- **DNS:** AdGuard rewrite `deck.hha.sh` → 192.168.150.140

## Stack
- **Runtime:** Node.js 24 on Reliant
- **Frontend:** Svelte 5 (runes) + Vite, xterm.js + FitAddon + WebLinksAddon
- **Backend:** Fastify 5, @fastify/websocket, @fastify/static, @fastify/cors
- **Terminal:** node-pty → tmux attach (local) or ssh -t (remote)
- **Storage:** SQLite via better-sqlite3

## Hosts
- **Reliant** (localhost) — primary tmux host, runs this server
- **Agamemnon** (192.168.12.200) — QNAP NAS
- **Manticore** (192.168.11.100) — Proxmox VE
- **Hexapuma** (192.168.150.140) — Docker VM
- **Wayfarer** (31.220.57.14) — VPS
- **Sirius** (76.13.103.90) — VPS

## Future
- tmux session management UI (create/rename/delete across hosts)
- ClawDeck integration: Stream Deck HTTP → Session Deck → workspace switch
- Mobile-friendly view for monitoring on phone
- Command palette (Ctrl+K)
- Workspace editor/management modal
