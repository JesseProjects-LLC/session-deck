---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Logo dropdown menu

Transform the .logo span into a clickable button. On click, toggle a dropdown menu below it with items: Servers, Sessions, Appearance, Help. Clicking outside closes the dropdown. Each item shows an icon/label. Clicking an item sets a state variable for which settings section is open, which will drive the settings panel in T02.

## Inputs

- `frontend/src/App.svelte`

## Expected Output

- `frontend/src/App.svelte with logo dropdown menu`

## Verification

Build frontend, verify logo click shows dropdown with 4 items, clicking outside closes it

## Observability Impact

None
