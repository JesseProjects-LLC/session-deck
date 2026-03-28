# S04: Workspace CRUD, lazy connect, and session assignment — UAT

**Milestone:** M002
**Written:** 2026-03-28T20:28:25.388Z

## UAT: S04 — Workspace CRUD, Lazy Connect, Session Assignment\n\n### Test 1: Workspace tabs\n1. Open http://localhost:7890\n2. Three workspace tabs visible: claude-focus, quad, deck\n3. Click each tab — layout changes, pane count updates\n\n### Test 2: Lazy connect\n1. On claude-focus: 3 terminals show LIVE\n2. Switch to quad: 4 terminals connect, show LIVE\n3. Switch back to claude-focus: old terminals gone, 3 fresh ones connect\n\n### Test 3: Session picker\n1. Click any session name in a pane header\n2. Overlay shows all available sessions with type dots\n3. Current session marked with 'current' badge\n4. Click different session — pane reconnects to selected session\n\n### Test 4: Persistence\n1. Switch to quad workspace\n2. Reload the page\n3. Workspaces load from API, claude-focus is default\n4. All tabs and layouts intact\n\n### Test 5: CRUD API\n1. POST /api/workspaces with name and layout → 201, new workspace\n2. PUT /api/workspaces/:id with new layout → updated\n3. DELETE /api/workspaces/:id → removed\n4. GET /api/workspaces → correct count"
