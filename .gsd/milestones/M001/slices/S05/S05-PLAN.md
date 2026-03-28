# S05: systemd service and SQLite schema

**Goal:** Production-ready systemd service deployment with SQLite schema for layout presets and host groups
**Demo:** After this: systemctl start session-deck works, SQLite DB created with tables

## Tasks
- [x] **T01: SQLite database with schema for presets, host groups, and deploy history** — 1. Create src/lib/db.js — initialize SQLite database
2. Create tables: layout_presets (id, name, layout_json, created_at, updated_at), host_groups (id, name, hosts_json, created_at)
3. Use better-sqlite3 for synchronous DB access
4. Initialize DB on server startup via Fastify plugin
5. Create data/ directory if it doesn't exist
6. Use WAL mode for better concurrent read performance
  - Estimate: 15min
  - Files: src/lib/db.js, src/server.js
  - Verify: Server starts, DB file created, tables exist with correct columns
- [x] **T02: systemd service installed and running — tmux sessions accessible** — 1. Create deploy/session-deck.service systemd unit file
2. Configure: User=claude, WorkingDirectory, ExecStart with node
3. Restart=on-failure, RestartSec=5
4. Environment for production settings
5. After=network.target
6. Create deploy/install.sh script for easy deployment
7. Test with systemctl commands
  - Estimate: 15min
  - Files: deploy/session-deck.service, deploy/install.sh
  - Verify: systemctl start session-deck succeeds, service responds on port, systemctl stop cleans up
