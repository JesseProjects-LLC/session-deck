# S03: Workspace grid editor with drag-drop

**Goal:** Implement recursive split tree layout renderer in Svelte with drag-to-resize and multiple live xterm.js panes
**Demo:** After this: Drag a session from inventory into a grid cell, see it placed

## Tasks
- [x] **T01: Recursive SplitPane component with drag-to-resize, arbitrary nesting of h/v splits** — 1. Create frontend/src/lib/SplitPane.svelte — recursive split container
2. Takes a layout tree node as prop: either a leaf (session) or a split (direction + children)
3. Leaf nodes render Terminal.svelte
4. Split nodes render children in flexbox with resize handles between them
5. Resize handles: mousedown starts drag, mousemove updates flex ratios, mouseup commits
6. Support both horizontal (row) and vertical (column) splits
7. Nested splits work recursively — a child of a horizontal split can be a vertical split
8. Each pane tracks its size as a flex ratio (not pixels) for proportional resizing
9. Emit layout-changed event when resize completes
  - Estimate: 30min
  - Files: frontend/src/lib/SplitPane.svelte
  - Verify: Render a 3-level nested split layout, drag resize handles, verify panes resize proportionally and terminals remain connected
- [x] **T02: Layout store with 6 presets — dual through 4×3 deck, all rendering with live terminals** — 1. Create frontend/src/lib/stores/layout.js — Svelte store for workspace layout tree
2. Layout tree data model: { split: 'h'|'v', children: [...], size: number } or { session: 'name', host: 'host', size: number }
3. Helper functions: splitPane(nodeId, direction), removePane(nodeId), updateSize(nodeId, newSize)
4. Default layout: single pane with first available session
5. Preset layouts: deck (4×3), claude-focus (1+2), dual (2×1), custom
6. Update App.svelte to use layout store and render SplitPane
7. Add focused pane tracking — one pane has focus at a time
  - Estimate: 25min
  - Files: frontend/src/lib/stores/layout.js, frontend/src/App.svelte
  - Verify: Load preset layout, see multiple live terminal panes, split a pane, remove a pane, resize panes — all terminals remain connected
