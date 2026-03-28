# M001: 

## Vision
Stand up the Node.js server on Reliant with SSH config parsing and multi-host tmux session discovery. After this milestone, the server runs as a systemd service, exposes a REST API, and returns live tmux session data from all configured hosts.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Project scaffolding and server bootstrap | low | — | ✅ | Server starts on port, responds to GET /health with status JSON |
| S02 | SSH config parser and host discovery | low | S01 | ✅ | GET /api/hosts returns list of configured SSH hosts with metadata |
| S03 | tmux session inventory — local and remote | medium | S02 | ✅ | GET /api/sessions returns sessions from Reliant + remote hosts with type detection |
| S04 | Session management — create, rename, delete | low | S03 | ✅ | POST/PUT/DELETE /api/sessions/:host/:name creates/renames/deletes tmux sessions |
| S05 | systemd service and SQLite schema | low | S01 | ✅ | systemctl start session-deck works, SQLite DB created with tables |
