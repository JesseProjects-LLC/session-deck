# S06: Properties panel and top bar

**Goal:** Session details panel showing focused pane info (session name, host, window count, attached clients, creation time). Toggle panel visibility. Keyboard shortcuts for workspace navigation.
**Demo:** After this: Right panel shows selected session details and workspace grid settings

## Tasks
- [x] **T01: Properties panel showing focused session details plus keyboard shortcuts for workspace navigation** — 1. Create a collapsible right-side properties panel (250px wide)
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
  - Estimate: 25min
  - Files: frontend/src/App.svelte
  - Verify: Focus a pane — panel shows session details. Press 1/2/3 to switch workspaces. Ctrl+P toggles panel.
