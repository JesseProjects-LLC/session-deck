---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T01: Recursive SplitPane component with drag-to-resize

1. Create frontend/src/lib/SplitPane.svelte — recursive split container
2. Takes a layout tree node as prop: either a leaf (session) or a split (direction + children)
3. Leaf nodes render Terminal.svelte
4. Split nodes render children in flexbox with resize handles between them
5. Resize handles: mousedown starts drag, mousemove updates flex ratios, mouseup commits
6. Support both horizontal (row) and vertical (column) splits
7. Nested splits work recursively — a child of a horizontal split can be a vertical split
8. Each pane tracks its size as a flex ratio (not pixels) for proportional resizing
9. Emit layout-changed event when resize completes

## Inputs

- ``frontend/src/lib/Terminal.svelte` — terminal component from S02`

## Expected Output

- ``frontend/src/lib/SplitPane.svelte` — recursive split container with resize handles`

## Verification

Render a 3-level nested split layout, drag resize handles, verify panes resize proportionally and terminals remain connected
