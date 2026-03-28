---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T01: SSH config parser service

1. Parse ~/.ssh/config line by line
2. Extract Host entries with all aliases (e.g., 'wayfarer jp-vps jesseprojects-vps 31.220.57.14')
3. Extract HostName (IP), User, IdentityFile for each
4. Skip wildcard Host * entries
5. Handle comment sections as group hints (e.g., '# --- VPS Hosts ---')
6. Add localhost (reliant) as an implicit host entry
7. Support configurable host groups via a groups config in config.js or a separate hosts.json
8. Each host: { name, aliases, hostname, user, identityFile, group, isLocal }

## Inputs

- ``~/.ssh/config` — SSH configuration file`
- ``src/lib/config.js` — for SSH config path`

## Expected Output

- ``src/services/ssh-config.js` — SSH config parser service`

## Verification

Unit test or inline test that parses ~/.ssh/config and returns expected host count and structure
