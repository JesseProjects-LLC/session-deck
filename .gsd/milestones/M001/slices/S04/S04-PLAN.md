# S04: Session management — create, rename, delete

**Goal:** Create, rename, and delete tmux sessions on any reachable host via API
**Demo:** After this: POST/PUT/DELETE /api/sessions/:host/:name creates/renames/deletes tmux sessions

## Tasks
- [x] **T01: Create, rename, delete tmux sessions with validation and error classification** — 1. Add createSession(host, name, startDir?) to tmux.js — runs tmux new-session -d -s <name>
2. Add renameSession(host, oldName, newName) — runs tmux rename-session
3. Add deleteSession(host, name) — runs tmux kill-session -t <name>
4. All operations use the same execLocal/execRemote pattern
5. Return success/error with meaningful messages
6. Validate session name (no special chars)
  - Estimate: 15min
  - Files: src/services/tmux.js
  - Verify: Create a test session, verify it appears in list, rename it, delete it
- [x] **T02: CRUD API endpoints for tmux session management** — 1. Add POST /api/sessions/:hostName route — create session
2. Add PUT /api/sessions/:hostName/:sessionName route — rename session
3. Add DELETE /api/sessions/:hostName/:sessionName route — delete session
4. Validate request body (name required for create/rename)
5. Return created/updated/deleted session info
6. Return appropriate error codes (404, 409, 400)
  - Estimate: 15min
  - Files: src/routes/sessions.js
  - Verify: Full CRUD cycle via curl: create → list → rename → list → delete → list
