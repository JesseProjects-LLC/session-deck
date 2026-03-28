---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T03: Add configuration module

1. Create src/lib/config.js — centralized config from env vars with defaults
2. Config values: port (7890), host (0.0.0.0), logLevel (info), dbPath (./data/session-deck.db)
3. Validate config at startup — fail fast on invalid values
4. Export typed config object used by all modules

## Inputs

- ``src/server.js` — server that will consume config`

## Expected Output

- ``src/lib/config.js` — configuration module`

## Verification

Server starts with default config, respects SESSION_DECK_PORT env var override
