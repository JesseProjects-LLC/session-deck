---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T02: Hosts API endpoint

1. Create GET /api/hosts route
2. Returns JSON array of parsed hosts
3. Include group information in response
4. Register route in server.js
5. Test with curl

## Inputs

- ``src/services/ssh-config.js` — SSH config parser from T01`
- ``src/server.js` — server to register route`

## Expected Output

- ``src/routes/hosts.js` — hosts API route`

## Verification

curl /api/hosts returns JSON array with all configured hosts, correct groups, aliases, and IPs
