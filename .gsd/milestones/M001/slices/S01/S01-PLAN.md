# S01: Project scaffolding and server bootstrap

**Goal:** Create Node.js project with Fastify, SQLite, and basic server structure. Server starts on configured port, responds to GET /health.
**Demo:** After this: Server starts on port, responds to GET /health with status JSON

## Tasks
- [x] **T01: Node.js project initialized with Fastify, better-sqlite3, and directory structure** — 1. Run npm init to create package.json with name session-deck, type module
2. Install Fastify (fast, lightweight, schema validation built-in)
3. Install better-sqlite3 for SQLite persistence
4. Install pino for structured logging (Fastify default)
5. Set up npm scripts: start, dev
6. Create basic directory structure: src/, src/routes/, src/services/, src/lib/
  - Estimate: 15min
  - Files: package.json, src/
  - Verify: npm install completes without errors, package.json has correct dependencies
- [x] **T02: Fastify server with /health endpoint, structured logging, and graceful shutdown** — 1. Create src/server.js — Fastify instance with pino logger
2. Create src/routes/health.js — GET /health returning {status, version, uptime, timestamp}
3. Create src/index.js — entry point that starts the server on configured port
4. Read port from environment variable SESSION_DECK_PORT (default 7890)
5. Add graceful shutdown on SIGTERM and SIGINT
6. Add request logging via Fastify's built-in pino integration
7. Add CORS support for LAN access from any device
  - Estimate: 20min
  - Files: src/index.js, src/server.js, src/routes/health.js
  - Verify: npm start launches server, curl http://localhost:7890/health returns 200 with valid JSON, SIGTERM triggers clean shutdown
- [x] **T03: Configuration module with env var overrides and startup validation** — 1. Create src/lib/config.js — centralized config from env vars with defaults
2. Config values: port (7890), host (0.0.0.0), logLevel (info), dbPath (./data/session-deck.db)
3. Validate config at startup — fail fast on invalid values
4. Export typed config object used by all modules
  - Estimate: 10min
  - Files: src/lib/config.js
  - Verify: Server starts with default config, respects SESSION_DECK_PORT env var override
