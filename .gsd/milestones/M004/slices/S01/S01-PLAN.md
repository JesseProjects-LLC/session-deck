# S01: Settings menu infrastructure

**Goal:** Transform the SESSION DECK logo into a menu trigger and build the settings panel shell with section navigation
**Demo:** After this: Click SESSION DECK logo → dropdown menu appears with section links → clicking a section opens settings panel with back navigation

## Tasks
- [x] **T01: Added settings menu dropdown from logo click and slide-over panel with section navigation, help docs, and appearance preview** — Transform the .logo span into a clickable button. On click, toggle a dropdown menu below it with items: Servers, Sessions, Appearance, Help. Clicking outside closes the dropdown. Each item shows an icon/label. Clicking an item sets a state variable for which settings section is open, which will drive the settings panel in T02.
  - Estimate: 30min
  - Files: frontend/src/App.svelte
  - Verify: Build frontend, verify logo click shows dropdown with 4 items, clicking outside closes it
- [x] **T02: Settings panel shell with section navigation, back/close, and Escape key support** — When a settings section is selected from the dropdown, open a slide-over panel from the left side (overlaying the terminal content). Panel has a header with section title and close button. Body area is a placeholder for each section's content (to be filled in subsequent slices). Back button returns to the menu. Close button (or Escape) closes the panel entirely. Panel should not interfere with the topnav or statusbar.
  - Estimate: 45min
  - Files: frontend/src/App.svelte
  - Verify: Build frontend, verify clicking a menu item opens panel with correct section title, close and back work, Escape closes panel, existing workspace tabs still functional
