---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T02: Session mutation API endpoints

1. Add POST /api/sessions/:hostName route — create session
2. Add PUT /api/sessions/:hostName/:sessionName route — rename session
3. Add DELETE /api/sessions/:hostName/:sessionName route — delete session
4. Validate request body (name required for create/rename)
5. Return created/updated/deleted session info
6. Return appropriate error codes (404, 409, 400)

## Inputs

- ``src/services/tmux.js` — CRUD functions from T01`
- ``src/routes/sessions.js` — existing sessions route`

## Expected Output

- ``src/routes/sessions.js` — added mutation routes`

## Verification

Full CRUD cycle via curl: create → list → rename → list → delete → list
