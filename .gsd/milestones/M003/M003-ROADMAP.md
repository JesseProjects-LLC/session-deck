# M003: 

## Vision
Generate wezterm.lua and clawdeck.config.json from workspace layouts, safely deploy to Windows via SCP, and manage the ClawDeck bridge process lifecycle. The full workflow from visual layout to running config.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | WezTerm Lua config generator | high | — | ⬜ | Layout preset → valid wezterm.lua workspace section with correct splits and sessions |
| S02 | ClawDeck config generator | low | S01 | ⬜ | clawdeck.config.json generated with paneLabels matching the workspace layout |
| S03 | SCP deployment with backup | medium | S01, S02 | ⬜ | Click 'Deploy' → configs land on Windows at correct paths with backup created |
| S04 | Config conflict detection and safe modification | medium | S01 | ⬜ | Modify managed section, detect manual edits outside markers, warn user |
| S05 | ClawDeck bridge lifecycle management | medium | S03 | ⬜ | Click 'Restart Bridge' → bridge process restarts on Windows |
