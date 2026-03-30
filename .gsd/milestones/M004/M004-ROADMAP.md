# M004: 

## Vision
Transform the SESSION DECK logo into a settings menu that consolidates all configuration: host/server management with connectivity testing and tmux setup assistance, session management scoped to configured hosts, appearance customization, and help documentation. Move from implicit SSH config parsing to explicit host configuration with persistence.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | Settings menu infrastructure | low | — | ✅ | Click SESSION DECK logo → dropdown menu appears with section links → clicking a section opens settings panel with back navigation |
| S02 | Host management with SQLite persistence | high | S01 | ✅ | Open settings → Servers section → see imported hosts from SSH config → add a new host → edit group → remove a host → changes persist across page reload |
| S03 | Host connectivity testing and tmux detection | high | S02 | ✅ | Open servers list → click Test on a host → shows SSH reachable + tmux available (or not) → for hosts without tmux, shows install guidance |
| S04 | Session management integration | medium | S02 | ✅ | Open settings → Sessions section → see sessions grouped by configured hosts only → click a host to filter → create/rename/delete sessions → also accessible from status bar link |
| S05 | Appearance settings and help documentation | low | S01 | ✅ | Open settings → Appearance → see session type color indicators → Help → see full keyboard shortcuts reference and version info |
