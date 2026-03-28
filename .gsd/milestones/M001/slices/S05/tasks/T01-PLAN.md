---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T01: SQLite database initialization with schema

1. Create src/lib/db.js — initialize SQLite database
2. Create tables: layout_presets (id, name, layout_json, created_at, updated_at), host_groups (id, name, hosts_json, created_at)
3. Use better-sqlite3 for synchronous DB access
4. Initialize DB on server startup via Fastify plugin
5. Create data/ directory if it doesn't exist
6. Use WAL mode for better concurrent read performance

## Inputs

- ``src/lib/config.js` — dbPath configuration`

## Expected Output

- ``src/lib/db.js` — SQLite database initialization module`

## Verification

Server starts, DB file created, tables exist with correct columns
