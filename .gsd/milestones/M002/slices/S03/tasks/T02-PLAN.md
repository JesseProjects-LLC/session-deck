---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: Layout store with split tree operations and preset layouts

1. Create frontend/src/lib/stores/layout.js — Svelte store for workspace layout tree
2. Layout tree data model: { split: 'h'|'v', children: [...], size: number } or { session: 'name', host: 'host', size: number }
3. Helper functions: splitPane(nodeId, direction), removePane(nodeId), updateSize(nodeId, newSize)
4. Default layout: single pane with first available session
5. Preset layouts: deck (4×3), claude-focus (1+2), dual (2×1), custom
6. Update App.svelte to use layout store and render SplitPane
7. Add focused pane tracking — one pane has focus at a time

## Inputs

- ``frontend/src/lib/SplitPane.svelte` — split container from T01`
- ``frontend/src/lib/Terminal.svelte` — terminal component`

## Expected Output

- ``frontend/src/lib/stores/layout.js` — layout tree store with split/remove/resize operations`
- ``frontend/src/App.svelte` — updated to render split layout with multiple live terminals`

## Verification

Load preset layout, see multiple live terminal panes, split a pane, remove a pane, resize panes — all terminals remain connected
