# S01: Svelte frontend setup and layout shell

**Goal:** Set up Svelte 5 + Vite build pipeline with dev proxy to Fastify API and production static serving
**Demo:** After this: Svelte app loads in browser with 3-panel skeleton layout

## Tasks
- [x] **T01: Svelte 5 + Vite scaffolded with live API integration and 137ms build** — 1. Create frontend/ directory with Svelte 5 + Vite via create-vite template
2. Install dependencies: svelte, @sveltejs/vite-plugin-svelte, vite
3. Configure vite.config.js with API proxy to localhost:7890
4. Set up basic App.svelte with placeholder layout
5. Add npm scripts: dev (vite), build (vite build), preview (vite preview)
6. Update root package.json with frontend scripts
  - Estimate: 15min
  - Files: frontend/package.json, frontend/vite.config.js, frontend/src/App.svelte, frontend/src/main.js, frontend/index.html
  - Verify: cd frontend && npm run build succeeds without errors, dist/ directory created with index.html
- [x] **T02: Fastify serves Svelte build in production, playground preserved, SPA fallback working** — 1. Update Fastify static serving to serve frontend/dist/ instead of public/
2. In dev mode, Vite dev server handles frontend; Fastify only serves API
3. In production, Fastify serves frontend/dist/ as static files and falls back to index.html for SPA routing
4. Update root package.json scripts: dev starts both Vite and Fastify, build runs vite build
5. Keep /playground/ accessible from public/
6. Test: npm run dev → Vite HMR works, API proxy works
7. Test: npm run build + npm start → Fastify serves built app
  - Estimate: 15min
  - Files: src/server.js, package.json
  - Verify: npm run build && npm start → curl localhost:7890 returns Svelte app HTML, curl localhost:7890/api/health returns JSON
