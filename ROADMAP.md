# Session Deck — Product Roadmap

> This roadmap reflects planned features, priorities, and community input. Items marked with ✅ are shipped. Feedback welcome via [GitHub Issues](https://github.com/JesseProjects-LLC/session-deck/issues).

## v1.0 — Shipped ✅

### Core Features
- [x] Live terminal panes via xterm.js connected to real tmux sessions
- [x] Split-tree workspace layouts with drag-to-resize and drag-to-rearrange
- [x] 6 built-in layout presets (dual, claude-focus, quad, infra, deck, mixed)
- [x] Multiple workspaces with keyboard switching (Alt+1-9)
- [x] Multi-host tmux management via SSH
- [x] Session management: create, rename, kill sessions from the browser
- [x] Lazy connect: only active workspace has live WebSocket connections
- [x] Clean copy/paste from terminal panes
- [x] SQLite persistence for workspaces, hosts, and settings
- [x] systemd service support
- [x] URL hash permalinks (workspace + focused pane survive refresh)

### Settings & Configuration
- [x] Settings menu (click SESSION DECK logo)
- [x] Host management: add/edit/remove SSH hosts, import from ~/.ssh/config
- [x] SSH connectivity testing with tmux detection
- [x] OS-aware tmux install guidance (10 OS families)
- [x] Session management with per-host filtering
- [x] Cross-navigation between servers and sessions

### Theming & Appearance
- [x] Accent color picker (7 presets + custom hex, persisted)
- [x] Data-driven session type colors (19 pre-seeded process types)
- [x] Scan Sessions to auto-discover running processes
- [x] Editable display names and colors per process type
- [x] CSS custom properties for full theme customization

### Authentication & Security
- [x] Basic auth (username/password from environment config)
- [x] Microsoft Entra ID (Azure AD) SSO via OpenID Connect with PKCE
- [x] Generic OIDC provider support (Authentik, Keycloak, etc.)
- [x] Session cookies with secure defaults
- [x] Auth bypass for trusted networks (configurable CIDRs)
- [x] WebSocket auth enforcement
- [x] Rate-limited login endpoint (brute-force protection)
- [x] Security headers (helmet: X-Frame-Options, HSTS, etc.)
- [x] Input validation on session names (command injection prevention)

### UX
- [x] Command palette (Ctrl+K) with fuzzy search
- [x] Keyboard shortcuts for all major actions
- [x] Right-click context menus on workspace tabs and pane headers
- [x] Properties panel with session details and workspace cross-references
- [x] Toast notifications
- [x] First-run setup wizard
- [x] Help documentation in settings panel
- [x] Auto-naming: detect git repo or working directory, shown in pane headers
- [x] Session rename auto-updates all workspace panes

---

## v1.5 — In Progress

### Session Intelligence
- [x] Manual pane title override (rename what shows in the pane header)
- [x] Connection status indicators per pane (connected/reconnecting/disconnected visual)

### Workspace Management
- [x] Workspace templates: save any layout as a reusable template
- [x] Activity notifications: badge when background workspace has new output

### Mobile / Responsive
- [ ] Responsive view for monitoring from phone/tablet
- [ ] Vertical tiling for narrow viewports
- [ ] Read-only mode for mobile (view output, no input)

---

## v2.0 — Planned

### Multi-User Support
- [ ] Multiple users viewing the same Session Deck instance
- [ ] Per-user workspace preferences
- [ ] Pair programming: shared terminal view

### Terminal Enhancements
- [ ] Session recording / playback (asciinema format)
- [ ] Saved snippets / command library (macros you can send to any pane)
- [ ] Host health dashboard (CPU/memory/disk per host, lightweight, no agent)

### Mixed Content Panes
- [ ] Embed non-terminal widgets in pane slots (iframes, log viewers, dashboards)
- [ ] File browser pane type
- [ ] JSON/log viewer with search and filter

---

## v3.0+ / Future

### Plugin / Extension System
- [ ] Plugin loader: scan plugins/ directory, import modules
- [ ] Plugin API: register pane types, settings sections, palette commands
- [ ] Frontend dynamic component loading for custom pane types
- [ ] Plugin manifest format (name, version, capabilities)

### Potential Plugins (community or first-party)
- [ ] AI session assistant — LLM sidebar that can read terminal output
- [ ] Runbook engine — multi-step procedures across panes/hosts
- [ ] Git-aware workspace switching — auto-switch workspace by branch
- [ ] Automation triggers — react to terminal output patterns (webhooks, commands)
- [ ] SSH tunnel management — visualize and manage port forwards
- [ ] Session sharing via URL — shareable read-only/read-write links

### Integration
- [ ] ClawDeck / Stream Deck integration — physical buttons for workspace actions
- [ ] Webhook API for external automation
- [ ] REST API for headless workspace management

---

## Deferred / Evaluating
- Okta SSO (need test environment)
- Session sharing via URL (security implications for internet-exposed instances)

---

## Contributing

Feature requests and feedback welcome via [GitHub Issues](https://github.com/JesseProjects-LLC/session-deck/issues). If you're interested in building a plugin or contributing a feature, open an issue to discuss the approach first.
