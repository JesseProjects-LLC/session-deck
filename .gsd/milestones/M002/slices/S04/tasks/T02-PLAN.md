---
estimated_steps: 10
estimated_files: 4
skills_used: []
---

# T02: Workspace tabs, lazy connect, and session assignment in panes

1. Create frontend/src/lib/stores/workspaces.js — workspace state management
2. Load workspaces from API on init
3. Track active workspace ID
4. Switch workspace: update active ID, trigger layout change
5. Save layout changes back to API (debounced)
6. Create/delete workspaces via API
7. Update App.svelte: workspace tabs in topnav, active workspace drives layout
8. Implement lazy connect: Terminal.svelte only connects WebSocket when visible
9. On workspace switch: destroy old SplitPane (disconnects terminals), mount new one (connects new terminals)
10. Add right-click or dropdown on pane header to reassign session

## Inputs

- ``src/routes/workspaces.js` — workspace API from T01`
- ``frontend/src/lib/stores/layout.js` — layout tree model`

## Expected Output

- ``frontend/src/lib/stores/workspaces.js` — workspace state store`
- ``frontend/src/App.svelte` — workspace tabs with lazy connect`

## Verification

Create workspace, assign sessions to panes, switch workspaces (old disconnect, new connect), reload page — layout restored from SQLite
