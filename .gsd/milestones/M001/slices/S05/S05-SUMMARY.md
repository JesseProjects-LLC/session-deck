---
id: S05
parent: M001
milestone: M001
provides:
  - systemd service
  - SQLite database with schema
  - DB access via fastify.db
requires:
  - slice: S01
    provides: Server and config module
affects:
  []
key_files:
  - src/lib/db.js
  - deploy/session-deck.service
  - deploy/install.sh
key_decisions:
  - PrivateTmp incompatible with tmux socket access
  - WAL mode for SQLite
patterns_established:
  - SQLite WAL mode default
  - Fastify decorator for DB access
  - DB close on server shutdown hook
observability_surfaces:
  - systemctl status session-deck
  - journalctl -u session-deck
drill_down_paths:
  - .gsd/milestones/M001/slices/S05/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S05/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-27T23:38:30.355Z
blocker_discovered: false
---

# S05: systemd service and SQLite schema

**systemd service and SQLite schema — server runs as daemon with tmux access**

## What Happened

Created SQLite database with schema for layout presets, host groups, and deploy history. Built systemd service unit and install script. Discovered PrivateTmp=true blocks tmux socket access — removed it. Service now runs correctly as a daemon with tmux session visibility.

## Verification

systemd service running, 13 sessions visible via API, SQLite DB with 3 tables created.

## Requirements Advanced

- R029 — SQLite DB with layout_presets table
- R030 — systemd service installed and running

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

Removed PrivateTmp from systemd unit to allow tmux socket access.

## Known Limitations

Minimal systemd hardening — only NoNewPrivileges=true. Acceptable for a LAN-only service.

## Follow-ups

None.

## Files Created/Modified

- `src/lib/db.js` — SQLite initialization with schema migration
- `src/server.js` — Added DB init and shutdown hooks
- `deploy/session-deck.service` — systemd unit file (fixed tmux access)
- `deploy/install.sh` — Installation script
