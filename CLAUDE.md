# Session Deck — tmux + WezTerm Layout Manager

## What this is
A web-based management tool for tmux sessions across multiple remote hosts, with WezTerm workspace layout generation. Companion tool to [ClawDeck](/opt/projects/clawdeck).

**Runtime:** Node.js on Reliant (LXC 102, 192.168.150.120), systemd service
**UI:** Web app accessible from any browser on local network
**Purpose:** Visual drag-drop management of tmux sessions → WezTerm workspace layouts → config generation

## Architecture

```
Browser (any device)
    ↓ HTTP/WebSocket
Session Deck Server (on Reliant, port TBD)
    ├── tmux CLI (local) → Reliant session inventory
    ├── SSH → remote tmux CLI → sessions on other hosts
    ├── SSH config parser (~/.ssh/config) → host list
    ├── Layout engine → workspace grid definitions
    ├── wezterm.lua generator → config output
    ├── ClawDeck config generator → paneLabels, defaultWorkspace
    ├── SCP to Windows → deploy configs
    ├── Bridge lifecycle → start/stop ClawDeck bridge on Windows
    └── SQLite → layout presets, host groups
```

## Key Relationships

- **ClawDeck** (/opt/projects/clawdeck) — the Stream Deck runtime controller
  - Session Deck writes `clawdeck.config.json` (paneLabels, defaultWorkspace)
  - Session Deck writes `wezterm.lua` workspace sections
  - Session Deck manages the ClawDeck bridge process lifecycle
- **WezTerm** — terminal emulator on Jesse's Windows desktop
  - Config at `C:\Users\jesse\.config\wezterm\wezterm.lua`
  - Bridge at `C:\projects\clawdeck\scripts\wezterm-bridge.mjs`
- **tmux** — session multiplexer on remote hosts
  - Primary host: Reliant (this machine) — `claude@reliant`
  - Additional hosts: Agamemnon (QNAP), wayfarer/sirius (VPS), manticore/hexapuma (Proxmox)

## Decisions from ClawDeck project

- Separate repo from ClawDeck
- Permanent systemd service on Reliant
- Manages ClawDeck bridge lifecycle
- WezTerm-only (no kitty/alacritty support for v1)
- Multi-host tmux management

## SSH Access

SSH config at `~/.ssh/config`. Key hosts for tmux:
- `reliant` (localhost) — primary tmux host, Claude Code + GSD sessions
- `agamemnon` (192.168.12.200) — QNAP NAS
- `manticore` (192.168.11.100) — Proxmox VE
- `hexapuma` (192.168.150.140) — Docker VM
- `wayfarer` (31.220.57.14) — jesseprojects.com VPS
- `sirius` (76.13.103.90) — jesseclaw.cloud VPS

Windows desktop: `desktop` (192.168.6.142) — WezTerm config deployment target

## Current tmux sessions (on Reliant)

| Session | Type | Purpose |
|---------|------|---------|
| main | Claude Code | Primary Claude session |
| homelab | Claude Code | HomeLab infrastructure work |
| onsite | terminal | OnSite project |
| business | terminal | Business tasks |
| openclaw | terminal | OpenClaw/Nova |
| social | terminal | Social/community |
| placer | terminal | Placer Solutions client |
| other | terminal | Misc |
| gsd-homelab | GSD | GSD session for HomeLab |
| gsd-placer | GSD | GSD session for Placer |
| gsd-onsite | GSD | GSD session for OnSite |
| gsd-clawdeck | GSD | GSD session for ClawDeck |

## Development Context

- GSD v2 project
- Full requirements in REQUIREMENTS-INPUT.md (copied from ClawDeck repo)
- Jesse's machine: Windows 11 desktop, Stream Deck Original (15-key)
- This server runs on Reliant (the same LXC where Claude Code sessions run)
