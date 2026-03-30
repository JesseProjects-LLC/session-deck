# Documentation Notes

Backlog of topics to cover when writing user-facing docs (README, wiki, FAQ, deployment guide). Not documentation itself — just the list of what needs documenting and key details to include.

---

## Installation & Deployment

- [ ] **Prerequisites**: Node.js 20+, tmux, node-pty (needs build tools: `build-essential`, `python3`), better-sqlite3
- [ ] **systemd service setup**: provide example unit file; note that `PrivateTmp=true` breaks tmux socket access — only `NoNewPrivileges=true` is safe
- [ ] **Reverse proxy (optional)**: Traefik/nginx/Caddy example for HTTPS; note WebSocket upgrade headers required
- [ ] **Multi-host SSH**: requires SSH key auth (no password prompts in PTY), recommend `ControlMaster` for performance
- [ ] **Port configuration**: `SESSION_DECK_PORT` env var, default 7890

## Locale & Unicode

- [ ] **UTF-8 locale required**: Session Deck forces `LANG=C.UTF-8` in PTY spawn and uses `tmux -u`, but the host must have a UTF-8 locale available (`locale -a | grep -i utf` to check)
- [ ] **systemd locale**: add `Environment=LANG=C.UTF-8` to the service file; default `C` locale mangles em-dashes, arrows, and other multi-byte chars to underscores
- [ ] **Remote hosts**: locale is set inline on the remote tmux command, but if `C.UTF-8` isn't available on the remote, user needs to install/generate it (`sudo dpkg-reconfigure locales` or equivalent)
- [ ] **Startup health check**: server logs a warning if non-UTF-8 locale detected — check `journalctl -u session-deck` if Unicode looks broken
- [ ] **FAQ: "Why do I see underscores instead of dashes?"** → locale is `C`, not `C.UTF-8`. Fix: set `LANG=C.UTF-8` in systemd service or shell profile

## tmux Configuration

- [ ] **`extended-keys`**: GSD/pi may warn about `extended-keys` being off. Add `set -g extended-keys on` to `~/.tmux.conf`, then `tmux source-file ~/.tmux.conf` (editing the file alone doesn't reload — tmux must source it or all servers must be killed and restarted)
- [ ] **tmux socket access**: Session Deck must run as the same user who owns the tmux sessions, or the socket path must be accessible. Default socket: `/tmp/tmux-<UID>/default`
- [ ] **FAQ: "Session not found"** → tmux session must already exist. Session Deck attaches to existing sessions, it doesn't create them (yet — planned feature)

## Browser & UI

- [ ] **Supported browsers**: Chrome, Firefox, Edge (any modern browser with WebSocket + xterm.js support). Safari works but has minor keyboard quirks.
- [ ] **Keyboard shortcuts reference**: 1-9 workspace switch, Shift+1-9 pane focus, N new workspace, I properties, Ctrl+Shift+F zoom, Esc unzoom
- [ ] **Drag-and-drop**: drag pane headers to rearrange. Drop on center = swap, drop on edge = split in that direction. Green overlay = swap, blue = split.
- [ ] **Right-click menus**: available on workspace tabs (rename/duplicate/delete) and pane headers (session, split, zoom, close)
- [ ] **Fonts**: JetBrains Mono loaded from Google Fonts. Works offline if previously cached. Terminal falls back to system monospace if Google Fonts unavailable.
- [ ] **FAQ: "Icons look like boxes or question marks"** → we use CSS shapes, not Unicode icons, for all UI controls. If terminal *content* has broken glyphs, that's the locale issue (see above).

## Security

- [ ] **No auth by default**: Session Deck exposes terminal access. Do NOT expose to the public internet without a reverse proxy + auth layer (basic auth, SSO, VPN, etc.)
- [ ] **SSH keys**: never stored by Session Deck. Uses the running user's `~/.ssh/config` and key files. Recommend separate SSH key for Session Deck service user.
- [ ] **`NoNewPrivileges=true`**: only systemd hardening that's safe to use. Don't enable `ProtectSystem`, `ProtectHome`, or `PrivateTmp`.

## Architecture & Extensibility

- [ ] **How it works**: one WebSocket per terminal pane → node-pty → tmux attach (local) or ssh -t (remote)
- [ ] **Workspace persistence**: SQLite database, survives server restart
- [ ] **Adding hosts**: edit `~/.ssh/config` on the Session Deck server, restart service. Hosts are discovered automatically.
- [ ] **Session type detection**: heuristic based on process running in tmux pane (claude → AI, gsd/pi → AUTO, else → TERM). Not 100% accurate.

## Known Limitations

- [ ] **Scroll loop in narrow panes**: TUI apps (vim, htop, Claude Code) in small panes can trigger resize feedback loops. Multiple mitigations applied but not 100% eliminated. Workaround: give TUI panes enough space.
- [ ] **Copy/paste**: works via browser selection, but wrapped lines include hard breaks. Optimization planned.
- [ ] **No session creation from UI**: must create tmux sessions via CLI first. UI management planned.
- [ ] **Browser shortcuts conflict**: Ctrl+P triggers browser print, not usable for app shortcuts. We use safe alternatives.

## Troubleshooting Quick Reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Underscores instead of dashes | `LANG=C` locale | Set `LANG=C.UTF-8` in systemd service |
| "Session not found" error | tmux session doesn't exist | Create it: `tmux new-session -d -s <name>` |
| Can't connect to remote host | SSH key auth not set up | Configure `~/.ssh/config` with `IdentityFile` |
| Service won't start | node-pty build failure | Install `build-essential python3`, rebuild: `npm rebuild` |
| Terminals blank/frozen | PrivateTmp in systemd | Remove `PrivateTmp=true` from service file |
| "extended-keys" warning (GSD) | tmux config not reloaded | Run `tmux source-file ~/.tmux.conf` |
| Icons look wrong | Shouldn't happen (CSS-based) | File a bug — we don't use font icons in UI |
