---
estimated_steps: 12
estimated_files: 1
skills_used: []
---

# T01: Properties panel and keyboard shortcuts

1. Create a collapsible right-side properties panel (250px wide)
2. When a pane is focused, panel shows:
   - Session name and host
   - Session type (claude-code, gsd, terminal) with badge
   - Window count and attached client count from sessions API
   - Created timestamp
3. Toggle button in topnav to show/hide panel
4. Add keyboard shortcuts:
   - 1-9 to switch workspaces
   - Ctrl+P to toggle properties panel
5. Update status bar with shortcut hints
6. Verify: focus a pane, panel shows details; press number to switch workspace; toggle panel

## Inputs

- `frontend/src/lib/stores/workspaces.js`
- `src/routes/sessions.js`

## Expected Output

- `frontend/src/App.svelte with properties panel and keyboard shortcuts`

## Verification

Focus a pane — panel shows session details. Press 1/2/3 to switch workspaces. Ctrl+P toggles panel.
