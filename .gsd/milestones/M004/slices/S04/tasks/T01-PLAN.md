---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T01: Session management in settings panel with per-host filtering

1. Replace the sessions placeholder in the settings panel with the session management UI.
2. Add host filter tabs at the top: 'All Hosts' plus one tab per configured host.
3. Reuse existing session management logic (create/rename/delete) within the panel.
4. Keep the existing session manager modal working from the status bar link.
5. When Sessions is opened from settings, also allow opening the session manager from there.
6. Add navigation from server management to sessions (click host name → filtered session view).

## Inputs

- `frontend/src/App.svelte`

## Expected Output

- `frontend/src/App.svelte with sessions section in settings panel`

## Verification

Build frontend. Open settings → Sessions → see all sessions grouped by host. Click a host filter → shows only that host's sessions. Create/rename/delete sessions from within settings panel. Status bar link still opens existing session manager modal.

## Observability Impact

None
