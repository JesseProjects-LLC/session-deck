# S03: Host connectivity testing and tmux detection

**Goal:** Async SSH connectivity test per host with tmux binary detection and setup guidance
**Demo:** After this: Open servers list → click Test on a host → shows SSH reachable + tmux available (or not) → for hosts without tmux, shows install guidance

## Tasks
- [x] **T01: SSH connectivity test + tmux detection with OS-aware install guidance for 10 OS families** — 1. Add POST /api/managed-hosts/:id/test endpoint that:
   a. Runs SSH connection test with 5s timeout (ssh -o ConnectTimeout=5 host 'echo ok')
   b. If connected, checks tmux availability (ssh host 'which tmux')
   c. If tmux missing, detects OS (ssh host 'cat /etc/os-release' or 'uname -s')
   d. Updates managed_hosts row with last_test_status, last_test_at, tmux_available
   e. Returns results including OS info and suggested install command
2. Add POST /api/managed-hosts/test-all endpoint that tests all enabled hosts in parallel
3. For local host, use direct exec instead of SSH
  - Estimate: 30min
  - Files: src/routes/managed-hosts.js
  - Verify: curl POST /api/managed-hosts/1/test (reliant) — should return ok + tmux available
- [x] **T02: Test buttons with async feedback, tmux setup hints, and error details in host list** — 1. Add a Test button on each host row (or Test All button in toolbar)
2. Show spinner while testing, then update badges (reachable/unreachable, tmux/no tmux)
3. When a host has no tmux, show an expandable section with:
   - Detected OS
   - Suggested install command (apt install tmux, apk add tmux, etc.)
   - Optional: button to copy command to clipboard
4. Test All button tests every enabled host in parallel with progress feedback
  - Estimate: 30min
  - Files: frontend/src/App.svelte
  - Verify: Build frontend. Test reliant host — shows reachable + tmux. Test unreachable host — shows error state.
