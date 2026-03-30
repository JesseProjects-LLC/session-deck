---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T02: Frontend: host management UI in settings panel

1. Replace the placeholder in settingsSection === 'servers' with a full host management UI.
2. Show host list grouped by group_name with name, hostname, user, group, enabled status.
3. Add host button opens inline form: name, hostname, user, port, group, auth method.
4. Edit button on each host row opens same form pre-filled.
5. Delete button with confirmation.
6. Import from SSH Config button calls the import endpoint and refreshes.
7. On first load, if no managed hosts exist, auto-trigger the SSH config import.
8. Wire all actions to the /api/managed-hosts endpoints.

## Inputs

- `frontend/src/App.svelte`
- `src/routes/managed-hosts.js`

## Expected Output

- `frontend/src/App.svelte with host management UI in settings panel`

## Verification

Build frontend. Open settings → Servers. See imported hosts. Add a new host. Edit a host. Delete a host. Refresh page — changes persist.

## Observability Impact

Host count shown in server list header
