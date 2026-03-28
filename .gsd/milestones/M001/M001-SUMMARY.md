---
id: M001
title: "Foundation — Server, SSH, and tmux Inventory"
status: complete
completed_at: 2026-03-28T17:39:30.490Z
key_decisions:
  - Fastify over Express for built-in schema validation and pino logging
  - Port 7890 default, 0.0.0.0 bind for LAN access
  - Session type detection via pane_current_command
  - Error classification from SSH stderr (unreachable/no-tmux/auth-failed)
  - PrivateTmp incompatible with tmux socket — removed
  - SQLite WAL mode for concurrent reads
  - Static file serving via @fastify/static for playground
key_files:
  - src/index.js
  - src/server.js
  - src/lib/config.js
  - src/lib/db.js
  - src/routes/health.js
  - src/routes/hosts.js
  - src/routes/sessions.js
  - src/services/ssh-config.js
  - src/services/tmux.js
  - deploy/session-deck.service
  - deploy/install.sh
lessons_learned:
  - systemd PrivateTmp=true gives services their own /tmp — breaks tmux socket at /tmp/tmux-1002/default
  - Node execFileAsync error objects have .stderr property — must check both .message and .stderr for error classification
  - SSH config comment headers (# --- VPS Hosts ---) can serve as group hints for host categorization
---

# M001: Foundation — Server, SSH, and tmux Inventory

**Server, API, SSH config, tmux inventory, session CRUD, systemd service, and SQLite — all running on Reliant**

## What Happened

Built the Session Deck server from scratch on Reliant. Fastify server with pino logging, health endpoint, SSH config parser (15 hosts across 8 groups), multi-host tmux session inventory with parallel queries and type detection, session CRUD API, SQLite database with schema, and systemd service. All API endpoints return live data. The playground UI was also built during this milestone to iterate on UI design direction, leading to a major project pivot from WezTerm config generator to web-native terminal workspace manager with xterm.js.

## Success Criteria Results

All 7 success criteria met — server starts, SSH config parsed, sessions listed, types detected, host reachability checked, API returns grouped inventory, SQLite initialized.

## Definition of Done Results

- [x] Server runs on Reliant and responds to health check — systemd service active\n- [x] GET /api/hosts returns parsed SSH config hosts — 15 hosts, 8 groups\n- [x] GET /api/sessions returns tmux sessions — 13 sessions from Reliant with type detection\n- [x] Session type detection identifies Claude Code and GSD — verified\n- [x] Host reachability shown in API response — online/no-tmux/unreachable statuses\n- [x] SQLite database created with schema — 3 tables\n- [x] systemd unit file created and tested — service starts/stops/restarts cleanly

## Requirement Outcomes

R001 (session listing) — advanced: 13 sessions listed from Reliant\nR002 (SSH hosts) — advanced: 15 hosts parsed with groups\nR003 (create sessions) — advanced: POST creates sessions\nR004 (rename/delete) — advanced: PUT/DELETE work\nR005 (attached status) — advanced: attached count in response\nR006 (type detection) — advanced: claude-code/gsd/terminal detected\nR007 (multi-host) — advanced: 12 hosts queried in parallel\nR008 (host status) — advanced: online/no-tmux/unreachable\nR009 (host grouping) — advanced: 8 groups\nR026 (runs on Reliant) — advanced: systemd service\nR027 (lightweight) — advanced: <30MB memory, <2s startup\nR029 (SQLite) — advanced: 3 tables created\nR030 (systemd) — advanced: service installed and running

## Deviations

PrivateTmp=true in systemd unit blocked tmux socket access — removed. ProtectSystem/ProtectHome also removed for SSH access.

## Follow-ups

M002 — Svelte UI with live xterm.js terminals and split layouts
