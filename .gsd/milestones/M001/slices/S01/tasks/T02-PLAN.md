---
estimated_steps: 7
estimated_files: 3
skills_used: []
---

# T02: Create Fastify server with health endpoint and structured logging

1. Create src/server.js — Fastify instance with pino logger
2. Create src/routes/health.js — GET /health returning {status, version, uptime, timestamp}
3. Create src/index.js — entry point that starts the server on configured port
4. Read port from environment variable SESSION_DECK_PORT (default 7890)
5. Add graceful shutdown on SIGTERM and SIGINT
6. Add request logging via Fastify's built-in pino integration
7. Add CORS support for LAN access from any device

## Inputs

- ``package.json` — dependencies from T01`

## Expected Output

- ``src/index.js` — entry point`
- ``src/server.js` — Fastify server factory`
- ``src/routes/health.js` — health endpoint`

## Verification

npm start launches server, curl http://localhost:7890/health returns 200 with valid JSON, SIGTERM triggers clean shutdown
