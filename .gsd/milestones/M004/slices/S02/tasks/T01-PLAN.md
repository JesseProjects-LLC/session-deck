---
estimated_steps: 5
estimated_files: 4
skills_used: []
---

# T01: Backend: managed_hosts table and CRUD API

1. Add a 'managed_hosts' table to db.js migrations: id, name, hostname, user, port, identity_file, auth_method (key/password), group_name, enabled, sort_order, created_at, updated_at.
2. Create src/routes/managed-hosts.js with CRUD endpoints: GET /api/managed-hosts, POST /api/managed-hosts, PUT /api/managed-hosts/:id, DELETE /api/managed-hosts/:id.
3. Add POST /api/managed-hosts/import-ssh-config endpoint that reads parseSSHConfig() and inserts any hosts not already in the table.
4. Register routes in server.js.
5. Update the existing GET /api/hosts to read from managed_hosts table instead of parseSSHConfig() directly. Keep parseSSHConfig() as the import source only.

## Inputs

- `src/lib/db.js`
- `src/routes/hosts.js`
- `src/services/ssh-config.js`

## Expected Output

- `src/routes/managed-hosts.js`
- `Updated src/lib/db.js with managed_hosts table`
- `Updated src/routes/hosts.js to read from DB`

## Verification

curl POST/GET/PUT/DELETE against /api/managed-hosts. Import from SSH config. Verify persistence across server restart.

## Observability Impact

None
