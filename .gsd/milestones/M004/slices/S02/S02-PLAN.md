# S02: Host management with SQLite persistence

**Goal:** Persistent host configuration in SQLite with CRUD UI and SSH config import
**Demo:** After this: Open settings → Servers section → see imported hosts from SSH config → add a new host → edit group → remove a host → changes persist across page reload

## Tasks
- [x] **T01: Backend managed_hosts table, CRUD API, and SSH config import — all 15 hosts imported successfully** — 1. Add a 'managed_hosts' table to db.js migrations: id, name, hostname, user, port, identity_file, auth_method (key/password), group_name, enabled, sort_order, created_at, updated_at.
2. Create src/routes/managed-hosts.js with CRUD endpoints: GET /api/managed-hosts, POST /api/managed-hosts, PUT /api/managed-hosts/:id, DELETE /api/managed-hosts/:id.
3. Add POST /api/managed-hosts/import-ssh-config endpoint that reads parseSSHConfig() and inserts any hosts not already in the table.
4. Register routes in server.js.
5. Update the existing GET /api/hosts to read from managed_hosts table instead of parseSSHConfig() directly. Keep parseSSHConfig() as the import source only.
  - Estimate: 45min
  - Files: src/lib/db.js, src/routes/managed-hosts.js, src/routes/hosts.js, src/server.js
  - Verify: curl POST/GET/PUT/DELETE against /api/managed-hosts. Import from SSH config. Verify persistence across server restart.
- [x] **T02: Host management UI with grouped list, add/edit form, inline delete, and SSH config import** — 1. Replace the placeholder in settingsSection === 'servers' with a full host management UI.
2. Show host list grouped by group_name with name, hostname, user, group, enabled status.
3. Add host button opens inline form: name, hostname, user, port, group, auth method.
4. Edit button on each host row opens same form pre-filled.
5. Delete button with confirmation.
6. Import from SSH Config button calls the import endpoint and refreshes.
7. On first load, if no managed hosts exist, auto-trigger the SSH config import.
8. Wire all actions to the /api/managed-hosts endpoints.
  - Estimate: 60min
  - Files: frontend/src/App.svelte
  - Verify: Build frontend. Open settings → Servers. See imported hosts. Add a new host. Edit a host. Delete a host. Refresh page — changes persist.
