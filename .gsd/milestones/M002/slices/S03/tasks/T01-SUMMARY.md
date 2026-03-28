---
id: T01
parent: S03
milestone: M002
provides: []
requires: []
affects: []
key_files: ["frontend/src/lib/SplitPane.svelte"]
key_decisions: ["Flex ratio sizing (not pixel) for proportional resize", "ResizeObserver on container + mousedown/mousemove/mouseup for drag resize", "pointer-events: none on terminals during resize to prevent focus stealing", "Self-import pattern for recursive SplitPane"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Mixed layout (3 levels of nesting) renders correctly, resize handles visible on hover, terminals connected in all panes."
completed_at: 2026-03-28T18:00:26.564Z
blocker_discovered: false
---

# T01: Recursive SplitPane component with drag-to-resize, arbitrary nesting of h/v splits

> Recursive SplitPane component with drag-to-resize, arbitrary nesting of h/v splits

## What Happened
---
id: T01
parent: S03
milestone: M002
key_files:
  - frontend/src/lib/SplitPane.svelte
key_decisions:
  - Flex ratio sizing (not pixel) for proportional resize
  - ResizeObserver on container + mousedown/mousemove/mouseup for drag resize
  - pointer-events: none on terminals during resize to prevent focus stealing
  - Self-import pattern for recursive SplitPane
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:00:26.565Z
blocker_discovered: false
---

# T01: Recursive SplitPane component with drag-to-resize, arbitrary nesting of h/v splits

**Recursive SplitPane component with drag-to-resize, arbitrary nesting of h/v splits**

## What Happened

Built the recursive SplitPane.svelte component. Takes a layout tree node, renders leaf nodes as Terminal.svelte instances and split nodes as flexbox containers with resize handles. Resize uses mousedown/mousemove/mouseup with flex ratio math. Disables pointer events on terminals during resize to prevent focus stealing. Supports arbitrary nesting of horizontal and vertical splits.

## Verification

Mixed layout (3 levels of nesting) renders correctly, resize handles visible on hover, terminals connected in all panes.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `Browser: mixed layout renders 6 panes with nested splits` | 0 | ✅ pass | 5000ms |


## Deviations

Used self-import instead of deprecated svelte:self. Added a11y ignore comments for resize handles and click handlers.

## Known Issues

None.

## Files Created/Modified

- `frontend/src/lib/SplitPane.svelte`


## Deviations
Used self-import instead of deprecated svelte:self. Added a11y ignore comments for resize handles and click handlers.

## Known Issues
None.
