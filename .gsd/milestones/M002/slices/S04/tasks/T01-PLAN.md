---
estimated_steps: 8
estimated_files: 2
skills_used: []
---

# T01: Workspace CRUD API with SQLite persistence

1. Create src/routes/workspaces.js — CRUD API for workspaces
2. GET /api/workspaces — list all workspaces with layout trees
3. POST /api/workspaces — create workspace with name and layout
4. PUT /api/workspaces/:id — update layout tree
5. DELETE /api/workspaces/:id — delete workspace
6. Store layout trees as JSON in layout_presets table
7. Seed default workspaces on first run (claude-focus, quad, deck)
8. Register routes in server.js

## Inputs

- ``src/lib/db.js` — SQLite database`

## Expected Output

- ``src/routes/workspaces.js` — workspace CRUD API`

## Verification

curl /api/workspaces returns seeded workspaces, POST creates new, PUT updates layout, DELETE removes
