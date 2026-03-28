# S04: Real-time updates via WebSocket

**Goal:** Workspace tabs with per-workspace layouts, session assignment to panes, lazy connect lifecycle, and SQLite persistence
**Demo:** After this: WebSocket pushes session status changes to UI in real-time

## Tasks
- [x] **T01: Workspace CRUD API with SQLite persistence — full REST endpoints for workspace management with default seeding** — 1. Create src/routes/workspaces.js — CRUD API for workspaces
2. GET /api/workspaces — list all workspaces with layout trees
3. POST /api/workspaces — create workspace with name and layout
4. PUT /api/workspaces/:id — update layout tree
5. DELETE /api/workspaces/:id — delete workspace
6. Store layout trees as JSON in layout_presets table
7. Seed default workspaces on first run (claude-focus, quad, deck)
8. Register routes in server.js
  - Estimate: 20min
  - Files: src/routes/workspaces.js, src/server.js
  - Verify: curl /api/workspaces returns seeded workspaces, POST creates new, PUT updates layout, DELETE removes
- [x] **T02: Workspace tabs with lazy connect lifecycle, session assignment picker, and SQLite-backed persistence across page reloads** — 1. Create frontend/src/lib/stores/workspaces.js — workspace state management
2. Load workspaces from API on init
3. Track active workspace ID
4. Switch workspace: update active ID, trigger layout change
5. Save layout changes back to API (debounced)
6. Create/delete workspaces via API
7. Update App.svelte: workspace tabs in topnav, active workspace drives layout
8. Implement lazy connect: Terminal.svelte only connects WebSocket when visible
9. On workspace switch: destroy old SplitPane (disconnects terminals), mount new one (connects new terminals)
10. Add right-click or dropdown on pane header to reassign session
  - Estimate: 35min
  - Files: frontend/src/lib/stores/workspaces.js, frontend/src/App.svelte, frontend/src/lib/Terminal.svelte, frontend/src/lib/SplitPane.svelte
  - Verify: Create workspace, assign sessions to panes, switch workspaces (old disconnect, new connect), reload page — layout restored from SQLite
