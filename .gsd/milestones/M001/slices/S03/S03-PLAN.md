# S03: tmux session inventory — local and remote

**Goal:** Query tmux sessions on all reachable hosts, detect session type, report status via API
**Demo:** After this: GET /api/sessions returns sessions from Reliant + remote hosts with type detection

## Tasks
- [x] **T01: tmux session query service with parallel host queries and type detection** — 1. Create src/services/tmux.js
2. Implement listSessions(host) — runs tmux list-sessions via local exec or SSH
3. For local host: spawn child_process with tmux command
4. For remote hosts: spawn ssh with ConnectTimeout=5 and tmux command
5. Parse output: session_name, session_windows, session_attached, session_created
6. Detect session type by running tmux list-panes -t <session> -F pane_current_command
7. Type mapping: 'claude' → 'claude-code', 'gsd'|'pi' → 'gsd', else → 'terminal'
8. Handle errors: host unreachable, tmux not installed, no sessions
9. Return structured array per host
  - Estimate: 25min
  - Files: src/services/tmux.js
  - Verify: Service returns sessions from localhost with correct names, window counts, and types
- [x] **T02: Sessions API with parallel multi-host queries and per-host status** — 1. Create GET /api/sessions route
2. Query all hosts in parallel (Promise.allSettled)
3. Return per-host results with status (online/offline/no-tmux)
4. Include query timing for observability
5. Register route in server.js
  - Estimate: 15min
  - Files: src/routes/sessions.js, src/server.js
  - Verify: curl /api/sessions returns sessions from localhost + status for remote hosts, completes within 10s
