# S02: SSH config parser and host discovery

**Goal:** Parse ~/.ssh/config and expose host list via REST API with grouping support
**Demo:** After this: GET /api/hosts returns list of configured SSH hosts with metadata

## Tasks
- [x] **T01: SSH config parser extracts 15 hosts with aliases, IPs, and group categorization** — 1. Parse ~/.ssh/config line by line
2. Extract Host entries with all aliases (e.g., 'wayfarer jp-vps jesseprojects-vps 31.220.57.14')
3. Extract HostName (IP), User, IdentityFile for each
4. Skip wildcard Host * entries
5. Handle comment sections as group hints (e.g., '# --- VPS Hosts ---')
6. Add localhost (reliant) as an implicit host entry
7. Support configurable host groups via a groups config in config.js or a separate hosts.json
8. Each host: { name, aliases, hostname, user, identityFile, group, isLocal }
  - Estimate: 20min
  - Files: src/services/ssh-config.js
  - Verify: Unit test or inline test that parses ~/.ssh/config and returns expected host count and structure
- [x] **T02: GET /api/hosts endpoint returns 15 hosts in 8 groups** — 1. Create GET /api/hosts route
2. Returns JSON array of parsed hosts
3. Include group information in response
4. Register route in server.js
5. Test with curl
  - Estimate: 10min
  - Files: src/routes/hosts.js, src/server.js
  - Verify: curl /api/hosts returns JSON array with all configured hosts, correct groups, aliases, and IPs
