---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T01: Backend: SSH connectivity test and tmux detection endpoints

1. Add POST /api/managed-hosts/:id/test endpoint that:
   a. Runs SSH connection test with 5s timeout (ssh -o ConnectTimeout=5 host 'echo ok')
   b. If connected, checks tmux availability (ssh host 'which tmux')
   c. If tmux missing, detects OS (ssh host 'cat /etc/os-release' or 'uname -s')
   d. Updates managed_hosts row with last_test_status, last_test_at, tmux_available
   e. Returns results including OS info and suggested install command
2. Add POST /api/managed-hosts/test-all endpoint that tests all enabled hosts in parallel
3. For local host, use direct exec instead of SSH

## Inputs

- `src/routes/managed-hosts.js`

## Expected Output

- `Updated src/routes/managed-hosts.js with test endpoints`

## Verification

curl POST /api/managed-hosts/1/test (reliant) — should return ok + tmux available

## Observability Impact

Test results persisted in DB
