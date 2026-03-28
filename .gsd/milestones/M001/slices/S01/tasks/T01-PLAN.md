---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T01: Initialize Node.js project and install dependencies

1. Run npm init to create package.json with name session-deck, type module
2. Install Fastify (fast, lightweight, schema validation built-in)
3. Install better-sqlite3 for SQLite persistence
4. Install pino for structured logging (Fastify default)
5. Set up npm scripts: start, dev
6. Create basic directory structure: src/, src/routes/, src/services/, src/lib/

## Inputs

- ``REQUIREMENTS-INPUT.md` — project requirements driving dependency choices`

## Expected Output

- ``package.json` — project manifest with dependencies`
- ``src/` — directory structure for server code`

## Verification

npm install completes without errors, package.json has correct dependencies
