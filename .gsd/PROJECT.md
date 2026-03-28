# Session Deck — Web-Based tmux Workspace Manager

## Vision
A web-based terminal workspace manager that connects directly to tmux sessions across multiple hosts. Open a browser, see your workspaces with live terminal panes, manage sessions, and work. No WezTerm, no config files — the browser IS the terminal interface.

## Core Architecture

```
Browser (any device on LAN)
    ↓ WebSocket per terminal pane
Session Deck Server (Reliant, port 7890)
    ├── Svelte frontend
    │   ├── Workspace tabs (deck, claude-focus, infra...)
    │   ├── Configurable grid layout per workspace
    │   ├── xterm.js terminal instances per pane
    │   ├── Session management panel (create/rename/delete/assign)
    │   └── Keyboard shortcuts for workspace/pane navigation
    ├── WebSocket → tmux attach (per pane)
    │   ├── Local: tmux attach -t <session>
    │   └── Remote: ssh host -t tmux attach -t <session>
    ├── Session inventory API (REST)
    │   ├── tmux CLI (local) → Reliant sessions
    │   ├── SSH → remote tmux CLI → other hosts
    │   └── SSH config parser → host list
    └── SQLite → workspace layouts, session assignments
```

## Key Design Principles

- **Lazy connect**: only the visible workspace has active WebSocket/terminal connections. Switch workspace → connect new panes, disconnect old ones. tmux keeps running regardless.
- **Keyboard-first**: all navigation (switch workspace, focus pane, zoom pane, cycle panes) available via keyboard shortcuts. Mouse works too.
- **Session management**: dedicated UI for creating, renaming, deleting, and assigning tmux sessions to workspace panes. Not just a terminal — a session orchestrator.
- **Reconnect-safe**: since tmux is persistent, reconnecting on workspace switch is instant. Network drops reconnect automatically.

## Stack
- **Runtime:** Node.js 24 on Reliant (LXC 102, 192.168.150.120)
- **Service:** systemd service, always running
- **Frontend:** Svelte + Vite, xterm.js for terminal rendering
- **Backend:** Fastify, WebSocket (ws or @fastify/websocket)
- **Terminal:** node-pty or SSH child process → tmux attach
- **Storage:** SQLite via better-sqlite3

## Scale
- 3-4 workspaces, each with 2-10 panes
- Only active workspace has live connections (2-10 concurrent)
- All hosts on LAN or VPN — low latency

## Hosts
- **Reliant** (localhost) — primary tmux host, runs this server
- **Agamemnon** (192.168.12.200) — QNAP NAS
- **Manticore** (192.168.11.100) — Proxmox VE
- **Hexapuma** (192.168.150.140) — Docker VM
- **Wayfarer** (31.220.57.14) — VPS
- **Sirius** (76.13.103.90) — VPS

## Future
- ClawDeck refactor: Stream Deck sends HTTP to Session Deck to switch workspaces/panes
- Mobile-friendly view for monitoring on phone
