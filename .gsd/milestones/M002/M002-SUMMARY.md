---
id: M002
title: "Web UI — Svelte frontend with live terminals"
status: complete
completed_at: 2026-03-28T20:39:53.139Z
key_decisions:
  - Recursive SplitPane component for arbitrary layout trees
  - Flex ratio sizing for proportional resize
  - Svelte {#key} remount pattern for lazy connect lifecycle
  - JSON layout trees in SQLite for workspace persistence
  - Context menu pattern for workspace tab management
key_files:
  - frontend/src/App.svelte
  - frontend/src/lib/SplitPane.svelte
  - frontend/src/lib/Terminal.svelte
  - frontend/src/lib/stores/layout.js
  - frontend/src/lib/stores/workspaces.js
  - src/routes/workspaces.js
  - src/services/workspace-defaults.js
  - src/routes/terminal-ws.js
lessons_learned:
  - Svelte 5 runes ($state, $props, $effect) work well for reactive terminal UI
  - xterm.js FitAddon + ResizeObserver handles dynamic pane resizing automatically
  - Recursive self-import works in Svelte for tree structures
  - Lazy connect via component lifecycle (mount/destroy) is simpler than explicit connection management
---

# M002: Web UI — Svelte frontend with live terminals

**Complete Svelte web UI with live xterm.js terminals, split-tree layouts, workspace management, and keyboard navigation**

## What Happened

Built the complete Svelte web UI for Session Deck across 6 slices. Starting from a bare Svelte shell (S01), progressively added: session inventory panel showing live tmux sessions grouped by host (S02), recursive split-tree layout engine with 6 presets and drag-to-resize handles (S03), workspace CRUD with SQLite persistence and lazy connect lifecycle (S04), workspace management UI with create/rename/duplicate/delete and toast notifications (S05), and a collapsible properties panel with session details plus keyboard shortcuts for workspace navigation (S06). The app is now a fully functional daily-driver terminal workspace manager accessible from any browser on the LAN.

## Success Criteria Results

All success criteria met. Svelte frontend loads with workspace tabs, live xterm.js terminals connect to tmux sessions, split-tree layouts support arbitrary pane arrangements, workspace CRUD persists in SQLite, keyboard shortcuts provide efficient navigation.

## Definition of Done Results

- [x] Svelte frontend loads and renders workspace layouts with live terminals\n- [x] All 6 layout presets work (dual, claude-focus, quad, infra, deck, mixed)\n- [x] Workspace CRUD persisted in SQLite across page reloads\n- [x] Session picker allows reassigning sessions to panes\n- [x] Lazy connect: only active workspace has live WebSocket connections\n- [x] Properties panel shows session metadata\n- [x] Keyboard shortcuts for workspace navigation\n- [x] All code committed to git

## Requirement Outcomes

R010 (workspace layouts) — advanced: split tree layout engine with 6 presets, SQLite persistence, full CRUD\nR025 (pane interaction) — advanced: drag-to-resize, session assignment picker, properties panel\nRemaining requirements (multi-host, ClawDeck integration) deferred to M003

## Deviations

None.

## Follow-ups

None.
