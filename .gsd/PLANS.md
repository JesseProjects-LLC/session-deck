# Session Deck — Future Plans

## Context

Session Deck started as a WezTerm config generator companion to ClawDeck (Stream Deck controller). It pivoted to a web-native terminal workspace manager when Jesse realized WezTerm was just a means to the real goal: managing and viewing tmux sessions across multiple hosts from a single browser tab.

In 48 hours it went from zero to a fully functional daily-driver app with live terminals, drag-and-drop layouts, workspace management, and properties panel. It's running in production at `deck.hha.sh`.

## Tier 1: Immediate (next sessions)

### 1A. tmux Session Management UI
The biggest gap. Right now you manage tmux sessions from the terminal — `tmux new -s name`, `tmux kill-session -t name`. Session Deck should own this entirely.

**Within the app (no agent deployment needed):**
- Create session: `ssh host "tmux new-session -d -s name"` via API endpoint
- Rename session: `ssh host "tmux rename-session -t old new"`
- Kill session: `ssh host "tmux kill-session -t name"` with confirmation dialog
- UI: button in session picker, context menu on sessions in properties panel

**With lightweight agent (greatly improved experience):**
- Deploy a ~50-line Node script to each remote host that provides:
  - Session create/rename/kill without SSH round-trip latency
  - Session event stream (WebSocket) — push notifications when sessions are created/destroyed/attached/detached
  - Process detection (what's running in each pane) without polling
- This eliminates the 30s polling interval and makes the session list truly real-time.
- Worth doing for hosts Jesse uses daily (reliant, hexapuma). Overkill for rarely-used VPS hosts.

### 1B. Scroll Loop Nuclear Fix
Current mitigations (debounce, rate limit, suppress-during-output) reduce but don't eliminate the problem. The root cause is that xterm.js fit() and tmux resize fight over dimensions.

**Proper fix:** Don't send resize to tmux on every fit. Instead:
1. On workspace switch: send initial resize once after connection is established and first output rendered
2. On manual drag-resize: send resize on mouseup only (already works)
3. On window resize: debounce 500ms, send once
4. NEVER resize in response to output — output doesn't change terminal dimensions

This requires restructuring the resize flow in Terminal.svelte to separate "user-initiated resize" from "output-triggered reflow."

### 1C. Copy/Paste (D008)
Jesse flagged this as a hard requirement. xterm.js selection → clipboard must produce clean text.
- xterm.js has a `selectionManager` that handles this, but may need tuning for wide characters, wrapped lines
- Test with Claude Code output (ANSI art, progress bars, indented code)

## Tier 2: Near-term (next 1-2 weeks)

### 2A. Command Palette (Ctrl+K)
Fuzzy-search command palette like VS Code. All actions available:
- Switch workspace, create workspace, rename workspace
- Focus pane, zoom pane, close pane, split pane
- Change session, create session, kill session
- Toggle properties, zoom/unzoom
- Jump to host
Low effort, high impact. Every action already has a handler — just need the search UI.

### 2B. Workspace Editor Modal
Full-fledged workspace configuration view:
- Visual layout editor (drag panes to rearrange, resize by dragging borders)
- Session assignment for each pane
- Preset selection (apply a preset, keeping sessions)
- Performance/latency info per pane (ping to host, WebSocket roundtrip)
Triggered from properties panel "Current workspace" section or right-click workspace tab.

### 2C. ClawDeck Integration
Session Deck exposes HTTP endpoints. ClawDeck sends requests on button press:
- `POST /api/actions/switch-workspace` → switch active workspace
- `POST /api/actions/focus-pane` → focus a specific pane
- `POST /api/actions/zoom-pane` → zoom/unzoom
- `POST /api/actions/toggle-props` → toggle properties
Stream Deck becomes a hardware workspace switcher. Physical buttons for "claude-focus", "quad", "deck" workspaces.

### 2D. Multi-host Terminal Testing
Verify SSH terminal connections to all hosts work end-to-end:
- Agamemnon (QNAP — may have different tmux path)
- Hexapuma (Docker VM — should work)
- Wayfarer/Sirius (VPS — higher latency, test reconnect)
- Manticore (Proxmox — may not have tmux)

## Tier 3: Medium-term (1-2 months)

### 3A. Mobile View
Responsive layout for phone/tablet. Key use case: monitoring sessions while away from desk.
- Single-pane view with session switcher drawer
- Read-only by default (prevent accidental input on phone)
- Touch-friendly session picker
- Swipe between workspaces

### 3B. Session Recording/Replay
Record terminal output for a session, replay later. Useful for:
- Reviewing Claude Code sessions that ran overnight
- Auditing GSD auto-mode decisions
- Sharing terminal sessions with others
Uses asciinema format or raw terminal output with timestamps.

### 3C. Notifications/Alerts
Watch for specific patterns in session output:
- Build completion ("✓ built in")
- Test failures ("FAIL")
- Error patterns
- Process exit
Push notification to browser or phone when pattern matches.

### 3D. Session Templates
Pre-configured session recipes:
- "Claude Code" → creates tmux session, cd to project, launches claude
- "GSD Auto" → creates session, cd to project, launches pi auto
- "Dev Server" → creates session, cd to project, runs `npm run dev`
One-click session creation with the right setup.

---

## Blue Sky: What if we dropped all constraints?

Everything above assumes: single user (Jesse), LAN-only, personal tool, no auth, no multi-tenancy.

### Open Source Terminal Workspace Manager
Session Deck is solving a real problem that no existing tool handles well:
- **tmux** — powerful but CLI-only, no web UI, no multi-host
- **Wetty/ttyd** — single terminal in browser, no workspaces
- **Apache Guacamole** — enterprise remote desktop, massive overhead
- **Teleport** — enterprise SSH gateway, way overbuilt
- **VS Code Remote** — IDE-first, not terminal-first

**Session Deck fills the gap: lightweight, web-native, terminal-first workspace manager for tmux.**

If open-sourced:
- Add authentication (OAuth, API keys)
- Docker Compose deployment (one command to start)
- Multi-user support (each user has their own workspaces)
- Plugin system for session templates
- Theme support (already has a clean dark theme as starting point)

**Worth abandoning the "personal tool" constraint?** Yes, if:
- Jesse wants to build reputation in the DevOps/terminal tooling space
- The tool gets traction with the tmux/homelab community (strong Reddit/HN audience for this)
- It becomes a portfolio piece demonstrating full-stack + infrastructure skills
- Revenue potential: hosted version for teams, premium features

The codebase is already clean enough to open-source. The main work would be auth, Docker packaging, and documentation.

### AI Terminal Orchestrator
Session Deck already manages Claude Code and GSD sessions. Push this further:
- **AI-aware workspace layouts** — auto-arrange panes based on what's running (Claude sessions get bigger panes)
- **Cross-session awareness** — know what each AI agent is working on, show status badges
- **Orchestration** — launch multiple Claude Code sessions on different projects from Session Deck
- **Cost tracking** — aggregate Claude API costs across all sessions (parse pi status bars)
- **Session health monitoring** — detect stuck/idle AI sessions, offer restart

This positions Session Deck as the control plane for multi-agent development workflows. Not just a terminal manager — an AI development cockpit.

**Worth abandoning the "terminal manager" constraint?** Possibly, if:
- Multi-agent workflows become Jesse's primary development pattern
- The overhead of managing multiple Claude/GSD sessions becomes a bottleneck
- This becomes a differentiator for consulting work ("I run 6 AI agents simultaneously and orchestrate them from a web dashboard")

### Cloud Terminal Platform
Take Session Deck to the cloud:
- Users connect to their own servers via SSH (keys stored encrypted, or agent forwarding)
- Session Deck runs as a SaaS, proxying terminal connections
- Workspaces sync across devices (laptop at home, phone on the go, desktop at office)
- Team workspaces: shared terminal views for pair programming or incident response
- Integration with cloud providers: spin up temporary VMs with pre-configured tmux sessions

**Worth abandoning the "self-hosted" constraint?** Only if:
- There's clear market demand (validate with the tmux community first)
- Security story is airtight (people won't trust a SaaS with SSH access to their servers without it)
- Revenue model is clear (B2B teams managing infrastructure)

This is the highest-risk, highest-reward path. The open-source path is a better first step.

---

## Recommendation

**Next session:** 1A (tmux session management — no agent needed, just API endpoints + UI) + 1B (scroll loop nuclear fix). These are the two things that most improve daily use.

**Next week:** 1C (copy/paste) + 2A (command palette). High impact, low effort.

**Decision point:** After those are done, Jesse should decide whether to keep this as a personal tool or open-source it. The codebase quality supports either path. Open-sourcing would mean adding auth and Docker packaging, but the payoff in community feedback and reputation is significant.
