# S04: Session management integration

**Goal:** Move session management into settings panel with per-host filtering while preserving existing entry point
**Demo:** After this: Open settings → Sessions section → see sessions grouped by configured hosts only → click a host to filter → create/rename/delete sessions → also accessible from status bar link

## Tasks
- [x] **T01: Session management in settings panel with per-host filtering and cross-navigation from server management** — 1. Replace the sessions placeholder in the settings panel with the session management UI.
2. Add host filter tabs at the top: 'All Hosts' plus one tab per configured host.
3. Reuse existing session management logic (create/rename/delete) within the panel.
4. Keep the existing session manager modal working from the status bar link.
5. When Sessions is opened from settings, also allow opening the session manager from there.
6. Add navigation from server management to sessions (click host name → filtered session view).
  - Estimate: 45min
  - Files: frontend/src/App.svelte
  - Verify: Build frontend. Open settings → Sessions → see all sessions grouped by host. Click a host filter → shows only that host's sessions. Create/rename/delete sessions from within settings panel. Status bar link still opens existing session manager modal.
