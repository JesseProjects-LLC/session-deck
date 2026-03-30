---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Settings panel shell with section navigation

When a settings section is selected from the dropdown, open a slide-over panel from the left side (overlaying the terminal content). Panel has a header with section title and close button. Body area is a placeholder for each section's content (to be filled in subsequent slices). Back button returns to the menu. Close button (or Escape) closes the panel entirely. Panel should not interfere with the topnav or statusbar.

## Inputs

- `frontend/src/App.svelte`

## Expected Output

- `frontend/src/App.svelte with settings panel component`

## Verification

Build frontend, verify clicking a menu item opens panel with correct section title, close and back work, Escape closes panel, existing workspace tabs still functional

## Observability Impact

None
