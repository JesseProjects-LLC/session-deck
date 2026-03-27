# Session Deck — tmux + WezTerm Layout Manager

## Problem Statement

Managing the mapping between tmux sessions (on remote hosts) and WezTerm workspaces/panes (on Windows) requires manually editing Lua config. Adding, removing, or rearranging sessions means understanding WezTerm's split API, tmux attach semantics, and SSH host configuration. There's no visual way to see what's where or rearrange things.

## Target Users

- Jesse (primary) — power user with 13+ tmux sessions across 1 host, 3 workspace categories
- Open source — anyone using WezTerm + tmux who wants visual layout management

## Requirements

### Core — Session Inventory

| ID | Requirement | Priority |
|----|------------|----------|
| S01 | List all tmux sessions on all configured remote hosts (name, attached count, window count) | Must |
| S02 | List all SSH hosts from ~/.ssh/config with aliases and IPs | Must |
| S03 | Create new tmux sessions on any remote host (name, starting directory) | Must |
| S04 | Rename/delete tmux sessions on any host | Must |
| S05 | Show which tmux sessions are currently attached and from where | Should |
| S06 | Detect session type: Claude Code, GSD, plain terminal (from running command) | Should |
| S07 | Multi-host session management: Reliant, Agamemnon (QNAP), VPS hosts (wayfarer, sirius), Proxmox nodes | Must |
| S08 | Per-host connection status: show which hosts are reachable, which are down | Should |
| S09 | Host grouping: organize hosts by category (HomeLab, VPS, NAS, etc.) matching network.md topology | Should |

### Core — Workspace Layout

| ID | Requirement | Priority |
|----|------------|----------|
| W01 | Define workspace layouts visually: name, grid dimensions, which session goes in each cell | Must |
| W02 | Support multiple layout types: single-tab grid (like deck), multi-tab with splits (like old claude/gsd) | Must |
| W03 | Drag-drop sessions from inventory into workspace grid cells | Must |
| W04 | Preview layout before applying — show a visual grid with session names | Must |
| W05 | Generate wezterm.lua workspace definitions from the visual layout | Must |
| W06 | Apply layout changes without full WezTerm restart (via wezterm cli spawn/split) | Should |
| W07 | Save/load layout presets (e.g., "full deck", "claude focus", "infra only") | Should |
| W08 | Validate layout: warn if session appears in multiple cells, warn if host unreachable | Should |

### Core — Config Generation

| ID | Requirement | Priority |
|----|------------|----------|
| C01 | Generate the `gui-startup` section of wezterm.lua from workspace layouts | Must |
| C02 | Preserve existing wezterm.lua content (appearance, keybindings, etc.) — only modify workspace section | Must |
| C03 | Generate ClawDeck config (paneLabels, defaultWorkspace) matching the layout | Must |
| C04 | Detect and warn about conflicts with manually-edited wezterm.lua sections | Should |
| C05 | Backup wezterm.lua before modifying | Must |

### Core — Integration with ClawDeck

| ID | Requirement | Priority |
|----|------------|----------|
| D01 | Sync pane labels in clawdeck.config.json when workspace layout changes | Must |
| D02 | Show ClawDeck Stream Deck key mapping overlaid on the workspace grid | Should |
| D03 | Preview what the Stream Deck will look like for a given layout | Nice |

### UI — Web Application

| ID | Requirement | Priority |
|----|------------|----------|
| U01 | Web-based UI accessible from any browser on the local network | Must |
| U02 | Left panel: session inventory (tmux sessions grouped by host) | Must |
| U03 | Center panel: workspace grid editor (drag-drop cells) | Must |
| U04 | Right panel: properties (selected session details, workspace settings) | Should |
| U05 | Top bar: layout presets, apply button, status indicators | Must |
| U06 | Real-time status: show session state (idle/running/needs-input) in inventory | Should |
| U07 | Mobile-friendly: basic functionality on phone/tablet for emergency management | Nice |

### Infrastructure

| ID | Requirement | Priority |
|----|------------|----------|
| I01 | Runs on Reliant (same host as tmux sessions) for direct tmux access | Must |
| I02 | Lightweight: Node.js or Python, no heavy framework | Must |
| I03 | Communicates with Windows via SSH for wezterm.lua deployment | Must |
| I04 | API-first: REST/WebSocket API that the web UI consumes | Should |
| I05 | Persistent storage for layout presets (JSON files or SQLite) | Must |

## Architecture (Proposed)

```
Browser (any device)
    ↓ HTTP/WebSocket
Session Deck Server (on Reliant)
    ├── tmux CLI (local) → Reliant session inventory
    ├── SSH → remote tmux CLI → sessions on Agamemnon, VPSs, Proxmox nodes
    ├── SSH config parser → host list with groups
    ├── Layout engine → workspace definitions
    ├── wezterm.lua generator → config output
    ├── SCP to Windows → deploy config
    └── SQLite/JSON → layout presets, host groups
```

## Non-Goals (for v1)

- No direct tmux pane manipulation (splitting inside tmux)
- No WezTerm theme/appearance management
- No tmux clustering (sessions stay on individual hosts)
- No real-time pane content preview (too complex, too much bandwidth)

## Relationship to ClawDeck

Session Deck is a **companion tool** to ClawDeck, not part of it. ClawDeck is the runtime controller (Stream Deck → WezTerm). Session Deck is the configuration tool (manage layouts → generate configs). They share:
- `clawdeck.config.json` (Session Deck writes it, ClawDeck reads it)
- `wezterm.lua` workspace section (Session Deck generates it, WezTerm reads it)
- tmux session naming conventions

## Open Questions

1. Should this live in the ClawDeck repo as a subdirectory, or a separate repo?
2. Should the server run on Reliant permanently (systemd service) or on-demand?
3. Should it also manage the ClawDeck bridge process lifecycle?
4. Is there value in making this work for non-WezTerm terminals (kitty, alacritty)?
