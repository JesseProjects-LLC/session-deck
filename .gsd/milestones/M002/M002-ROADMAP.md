# M002: 

## Vision
Build the Svelte web UI with live xterm.js terminal panes connected to tmux sessions via WebSocket. Workspace layouts use recursive split trees for arbitrary pane arrangements. Session panel, keyboard navigation, and command palette complete the daily-driver experience.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Svelte frontend setup and layout shell | low | — | ✅ | Svelte app loads in browser with 3-panel skeleton layout |
| S02 | Session inventory panel | low | S01 | ✅ | Left panel shows live tmux sessions grouped by host with status indicators |
| S03 | Workspace grid editor with drag-drop | high | S02 | ✅ | Drag a session from inventory into a grid cell, see it placed |
| S04 | Real-time updates via WebSocket | medium | S02 | ✅ | WebSocket pushes session status changes to UI in real-time |
| S05 | Layout presets — save/load/delete | low | S03 | ✅ | Save layout as 'full deck', reload page, load it back intact |
| S06 | Properties panel and top bar | low | S03 | ✅ | Right panel shows selected session details and workspace grid settings |
