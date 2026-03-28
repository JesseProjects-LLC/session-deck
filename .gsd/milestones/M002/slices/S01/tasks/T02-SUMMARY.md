---
id: T02
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["src/server.js", "package.json"]
key_decisions: ["Two @fastify/static registrations: frontend/dist as root, public/playground under /playground/", "SPA fallback via setNotFoundHandler — serves index.html for non-API/non-playground routes", "Root package.json scripts: dev:server, dev:client, dev (both), build, postinstall"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "Root serves Svelte app HTML, /health returns JSON, /playground/index.html returns 200, /api/sessions/reliant returns 13 sessions."
completed_at: 2026-03-28T17:46:07.601Z
blocker_discovered: false
---

# T02: Fastify serves Svelte build in production, playground preserved, SPA fallback working

> Fastify serves Svelte build in production, playground preserved, SPA fallback working

## What Happened
---
id: T02
parent: S01
milestone: M002
key_files:
  - src/server.js
  - package.json
key_decisions:
  - Two @fastify/static registrations: frontend/dist as root, public/playground under /playground/
  - SPA fallback via setNotFoundHandler — serves index.html for non-API/non-playground routes
  - Root package.json scripts: dev:server, dev:client, dev (both), build, postinstall
duration: ""
verification_result: passed
completed_at: 2026-03-28T17:46:07.603Z
blocker_discovered: false
---

# T02: Fastify serves Svelte build in production, playground preserved, SPA fallback working

**Fastify serves Svelte build in production, playground preserved, SPA fallback working**

## What Happened

Integrated Vite build output with Fastify production serving. Two static file roots: frontend/dist/ as primary (Svelte app), public/playground/ under /playground/ prefix. SPA fallback sends index.html for client-side routing. Root scripts updated for dev workflow (concurrent server + client) and production build.

## Verification

Root serves Svelte app HTML, /health returns JSON, /playground/index.html returns 200, /api/sessions/reliant returns 13 sessions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npm run build && node src/index.js + curl tests` | 0 | ✅ pass — all 4 endpoints verified | 3000ms |


## Deviations

Fixed playground serving \u2014 root for second static plugin needed to point to public/playground/ not public/

## Known Issues

None.

## Files Created/Modified

- `src/server.js`
- `package.json`


## Deviations
Fixed playground serving \u2014 root for second static plugin needed to point to public/playground/ not public/

## Known Issues
None.
