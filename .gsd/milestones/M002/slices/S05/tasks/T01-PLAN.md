---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T01: Workspace management UI — create, rename, delete, duplicate

1. Add a '+' button to the workspace tabs row for creating new workspaces
2. Create a 'New Workspace' modal: name input, layout preset selector (from existing presets), create button
3. Right-click context menu or dropdown on workspace tabs: Rename, Duplicate, Delete
4. Rename: inline edit or small modal with name input
5. Duplicate: POST to API with name + '(copy)' and same layout
6. Delete: confirmation dialog, then DELETE API call
7. Add workspace store methods: renameWorkspace(id, name)
8. Add toast notification system for success/error feedback
9. Verify: create workspace, rename it, duplicate it, delete duplicate, reload — all persisted

## Inputs

- `src/routes/workspaces.js (existing API)`
- `frontend/src/lib/stores/workspaces.js (existing store)`

## Expected Output

- `frontend/src/App.svelte with workspace management UI`
- `frontend/src/lib/stores/workspaces.js with rename method`

## Verification

Create workspace 'test', rename to 'test-renamed', duplicate it, delete duplicate, reload page — 'test-renamed' persists with correct layout
