# Session Deck

A web-based tmux workspace manager with live terminal panes. View and manage your tmux sessions across multiple hosts from any browser on your network.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D20-green)

## What It Does

Session Deck gives you a browser-based dashboard for your tmux sessions. Each pane is a live terminal connected to a real tmux session — you can type, run commands, and see output in real time. Organize panes into workspaces with drag-and-drop layouts.

**Key features:**
- 🖥️ Live terminal panes via xterm.js connected to tmux sessions over WebSocket
- 📐 Split-tree workspace layouts with drag-to-resize borders
- 🔀 Drag-and-drop pane rearrangement (swap or directional split)
- 🗂️ Multiple workspaces with 6 built-in presets (or build your own)
- 🌐 Multi-host support — manage tmux on any SSH-accessible machine
- 🔍 SSH connectivity testing with tmux detection and setup guidance
- ⌨️ Keyboard shortcuts for everything
- 📋 Clean copy/paste from terminal panes
- 💾 Persistent workspaces and host configuration (SQLite)
- 🚀 First-run setup wizard for new installations

## Quick Start

### Prerequisites

- **Node.js 20+** on the host machine
- **tmux** installed on at least one host
- **SSH access** to any remote hosts you want to manage (key-based auth recommended)

### Install

```bash
git clone https://github.com/jesseprojects/session-deck.git
cd session-deck
npm install
npm run build
```

### Run

```bash
# Start the server (default: port 7890)
npm start

# Or with custom port
SESSION_DECK_PORT=3000 npm start
```

Open `http://<your-host>:7890` in a browser. On first launch, the setup wizard walks you through:

1. **Import hosts** from your `~/.ssh/config` (or add them manually)
2. **Test connectivity** — verify SSH access and tmux availability
3. **Create your first workspace** with a layout preset

### Development Mode

```bash
# Start backend with auto-reload + Vite dev server with HMR
npm run dev
```

Backend runs on `:7890`, frontend dev server on `:5173` with API proxy.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_DECK_PORT` | `7890` | Server port |
| `SESSION_DECK_HOST` | `0.0.0.0` | Bind address |
| `SESSION_DECK_LOG_LEVEL` | `info` | Log level (fatal/error/warn/info/debug/trace) |
| `SESSION_DECK_DB_PATH` | `./data/session-deck.db` | SQLite database path |
| `SESSION_DECK_AUTH` | `none` | Auth method: `none`, `basic`, or `oidc` |
| `SESSION_DECK_AUTH_USER` | — | Username (basic auth) |
| `SESSION_DECK_AUTH_PASS` | — | Password (basic auth) |
| `SESSION_DECK_OIDC_ISSUER` | — | OIDC issuer URL (e.g. Entra, Authentik) |
| `SESSION_DECK_OIDC_CLIENT_ID` | — | OIDC client ID |
| `SESSION_DECK_OIDC_CLIENT_SECRET` | — | OIDC client secret |
| `SESSION_DECK_OIDC_REDIRECT_URI` | — | OIDC callback URL |
| `SESSION_DECK_OIDC_SCOPES` | `openid profile email` | OIDC scopes |
| `SESSION_DECK_TRUSTED_NETWORKS` | — | CIDRs to bypass auth (e.g. `192.168.0.0/16`) |
| `SESSION_DECK_SESSION_SECRET` | — | Session cookie secret (set in production!) |
| `SESSION_DECK_SESSION_MAX_AGE` | `86400` | Session cookie max age in seconds |

### Authentication

Session Deck supports three auth modes:

#### No Auth (default)
```bash
SESSION_DECK_AUTH=none  # or just don't set it
```

#### Basic Auth
```bash
SESSION_DECK_AUTH=basic
SESSION_DECK_AUTH_USER=admin
SESSION_DECK_AUTH_PASS=your-secure-password
SESSION_DECK_SESSION_SECRET=random-32-char-string
```

#### OpenID Connect (Entra ID, Authentik, Keycloak, etc.)

**Microsoft Entra ID example:**

1. In Azure Portal → App registrations → New registration
2. Set redirect URI to `https://your-host/auth/callback` (Web platform)
3. Create a client secret under Certificates & Secrets
4. Note your tenant ID from the Overview page

```bash
SESSION_DECK_AUTH=oidc
SESSION_DECK_OIDC_ISSUER=https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0
SESSION_DECK_OIDC_CLIENT_ID=your-client-id
SESSION_DECK_OIDC_CLIENT_SECRET=your-client-secret
SESSION_DECK_OIDC_REDIRECT_URI=https://deck.hha.sh/auth/callback
SESSION_DECK_SESSION_SECRET=random-32-char-string
```

**Authentik / Keycloak example:**
```bash
SESSION_DECK_AUTH=oidc
SESSION_DECK_OIDC_ISSUER=https://auth.example.com/application/o/session-deck/
SESSION_DECK_OIDC_CLIENT_ID=your-client-id
SESSION_DECK_OIDC_CLIENT_SECRET=your-client-secret
SESSION_DECK_OIDC_REDIRECT_URI=https://deck.example.com/auth/callback
SESSION_DECK_SESSION_SECRET=random-32-char-string
```

#### Trusted Networks (bypass auth)

Allow unauthenticated access from specific networks:
```bash
SESSION_DECK_TRUSTED_NETWORKS=192.168.0.0/16,10.0.0.0/8
```

This is useful when running behind a VPN or on a trusted LAN — users from those networks skip the login page entirely.

### Run as a systemd Service

Create `/etc/systemd/system/session-deck.service`:

```ini
[Unit]
Description=Session Deck — Web-Based tmux Workspace Manager
After=network.target

[Service]
Type=simple
User=your-user
Group=your-user
WorkingDirectory=/path/to/session-deck
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=session-deck

Environment=NODE_ENV=production
Environment=SESSION_DECK_PORT=7890
Environment=SESSION_DECK_LOG_LEVEL=info
Environment=LANG=C.UTF-8
Environment=LC_ALL=C.UTF-8

# Security — must NOT use PrivateTmp (tmux socket lives in /tmp)
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now session-deck
```

> ⚠️ **Do not enable `PrivateTmp=true`** — it isolates `/tmp`, making the tmux socket invisible to the service. `ProtectSystem` and `ProtectHome` also interfere with SSH access to remote hosts.

### SSH Setup for Remote Hosts

Session Deck connects to remote hosts via SSH to manage tmux sessions. For each remote host:

1. **Generate an SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "session-deck"
   ```

2. **Copy the key to the remote host:**
   ```bash
   ssh-copy-id user@remote-host
   ```

3. **Verify passwordless access:**
   ```bash
   ssh user@remote-host "echo ok"
   ```

4. **Add to Session Deck** via Settings → Servers → Add Host (or import from SSH config).

Session Deck reads `~/.ssh/config` for the user running the service. Hosts defined there can be imported with one click.

### Installing tmux on Remote Hosts

When you test a host's connectivity, Session Deck detects whether tmux is installed. If it's missing, it shows the correct install command for the host's OS:

| OS | Command |
|----|---------|
| Ubuntu/Debian | `sudo apt install -y tmux` |
| Fedora | `sudo dnf install -y tmux` |
| CentOS/RHEL | `sudo yum install -y tmux` |
| Alpine | `sudo apk add tmux` |
| Arch | `sudo pacman -S tmux` |
| macOS | `brew install tmux` |

## Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9` | Switch workspace |
| `N` | New workspace |
| `I` | Toggle properties panel |
| `Shift+1`–`9` | Focus pane by index |
| `Ctrl+Shift+F` | Zoom / unzoom pane |
| `Esc` | Unzoom / close menu |

### Mouse Actions

- **Click** a pane to focus it
- **Right-click** a pane header for context menu (change session, split, close, zoom)
- **Right-click** a workspace tab for context menu (rename, duplicate, delete)
- **Drag** a pane header to another pane to swap or split
- **Drag** the border between panes to resize

### Copy/Paste

Select text with the mouse in any terminal pane, then:
- `Ctrl+C` — copy selection (when text is selected and no process captures it)
- `Ctrl+V` — paste from clipboard
- Right-click also provides copy/paste options

### Settings Menu

Click the **SESSION DECK** logo in the top-left to access:
- **Servers** — Add, edit, remove, and test SSH hosts
- **Sessions** — Create, rename, and kill tmux sessions (with per-host filtering)
- **Appearance** — Session type color reference
- **Help** — Keyboard shortcuts and documentation

## Architecture

```
Browser (any device on LAN)
    ↓ HTTP + WebSocket
Session Deck Server (Node.js)
    ├── Fastify — REST API + static file serving
    ├── WebSocket — terminal I/O via node-pty
    ├── tmux CLI — local session management
    ├── SSH → remote tmux CLI → sessions on other hosts
    ├── SSH config parser → host discovery
    └── SQLite — workspaces, hosts, layout presets
```

### Tech Stack

**Backend:** Node.js, Fastify, node-pty, better-sqlite3
**Frontend:** Svelte 5, xterm.js, Vite
**Terminal:** xterm.js with fit, web-links, and clipboard addons

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/hosts` | List configured hosts |
| GET | `/api/sessions/:host` | List tmux sessions on a host |
| POST | `/api/sessions/:host` | Create a tmux session |
| PUT | `/api/sessions/:host/:name` | Rename a session |
| DELETE | `/api/sessions/:host/:name` | Kill a session |
| GET | `/api/workspaces` | List workspaces |
| POST | `/api/workspaces` | Create workspace |
| PUT | `/api/workspaces/:id` | Update workspace |
| DELETE | `/api/workspaces/:id` | Delete workspace |
| GET | `/api/managed-hosts` | List managed hosts |
| POST | `/api/managed-hosts` | Add a host |
| PUT | `/api/managed-hosts/:id` | Update a host |
| DELETE | `/api/managed-hosts/:id` | Delete a host |
| POST | `/api/managed-hosts/import-ssh-config` | Import hosts from SSH config |
| POST | `/api/managed-hosts/:id/test` | Test host connectivity |
| POST | `/api/managed-hosts/test-all` | Test all hosts |
| WS | `/ws/terminal/:host/:session` | Terminal WebSocket |

## License

MIT
