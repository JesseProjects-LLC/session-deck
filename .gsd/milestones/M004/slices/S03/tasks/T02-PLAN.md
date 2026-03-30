---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T02: Frontend: test buttons, status badges, and tmux setup guidance

1. Add a Test button on each host row (or Test All button in toolbar)
2. Show spinner while testing, then update badges (reachable/unreachable, tmux/no tmux)
3. When a host has no tmux, show an expandable section with:
   - Detected OS
   - Suggested install command (apt install tmux, apk add tmux, etc.)
   - Optional: button to copy command to clipboard
4. Test All button tests every enabled host in parallel with progress feedback

## Inputs

- `frontend/src/App.svelte`

## Expected Output

- `frontend/src/App.svelte with test buttons and results display`

## Verification

Build frontend. Test reliant host — shows reachable + tmux. Test unreachable host — shows error state.

## Observability Impact

None
