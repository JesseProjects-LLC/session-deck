---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: Sessions API endpoint with parallel host queries

1. Create GET /api/sessions route
2. Query all hosts in parallel (Promise.allSettled)
3. Return per-host results with status (online/offline/no-tmux)
4. Include query timing for observability
5. Register route in server.js

## Inputs

- ``src/services/tmux.js` — tmux query service from T01`
- ``src/services/ssh-config.js` — host list`
- ``src/server.js` — server to register route`

## Expected Output

- ``src/routes/sessions.js` — sessions API route`

## Verification

curl /api/sessions returns sessions from localhost + status for remote hosts, completes within 10s
