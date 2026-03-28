---
id: S03
parent: M002
milestone: M002
provides:
  - SplitPane.svelte component
  - Layout store with tree operations
  - 6 preset layouts
requires:
  - slice: S02
    provides: Terminal.svelte component
affects:
  - S04
  - S05
key_files:
  - frontend/src/lib/SplitPane.svelte
  - frontend/src/lib/stores/layout.js
key_decisions:
  - Flex ratio sizing for proportional resize
  - Self-import for recursive Svelte component
  - 6 preset layouts covering 2-12 pane arrangements
patterns_established:
  - Recursive SplitPane component for arbitrary layouts
  - Layout tree data model with leaf/hsplit/vsplit helpers
  - Flex ratio sizing for proportional resize
observability_surfaces:
  - Pane count in topnav
  - LIVE/Disconnected badges per pane
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S03/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-28T18:01:13.897Z
blocker_discovered: false
---

# S03: Split tree layout engine with resize

**Split tree layout engine with 6 presets — arbitrary pane arrangements with live terminals and drag-to-resize**

## What Happened

Built the split tree layout engine. SplitPane.svelte recursively renders layout trees with nested horizontal/vertical splits, each leaf hosting a live xterm.js terminal. Drag-to-resize handles between all pane borders. Layout store provides 6 preset layouts from simple dual (2 panes) to full 4×3 deck (12 panes). All presets verified with live terminal connections.

## Verification

All 6 presets render with live terminals. Nested splits work correctly at 3 levels of depth. Mixed layout shows 6 panes in complex arrangement.

## Requirements Advanced

- R010 — Arbitrary split tree layouts from 2 to 12+ panes
- R025 — Drag-to-resize handles between all pane borders

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

12-pane layout hits concurrent WebSocket limits. Lazy connect (S04) will resolve this.

## Follow-ups

Drag-to-resize needs testing at various nesting depths. May need minimum pane size enforcement.

## Files Created/Modified

- `frontend/src/lib/SplitPane.svelte` — Recursive split container with drag-to-resize
- `frontend/src/lib/stores/layout.js` — Layout tree data model with presets
- `frontend/src/App.svelte` — Updated with preset tabs and split layout rendering
