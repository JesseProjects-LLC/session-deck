---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: Integrate Vite dev proxy and production build serving

1. Update Fastify static serving to serve frontend/dist/ instead of public/
2. In dev mode, Vite dev server handles frontend; Fastify only serves API
3. In production, Fastify serves frontend/dist/ as static files and falls back to index.html for SPA routing
4. Update root package.json scripts: dev starts both Vite and Fastify, build runs vite build
5. Keep /playground/ accessible from public/
6. Test: npm run dev → Vite HMR works, API proxy works
7. Test: npm run build + npm start → Fastify serves built app

## Inputs

- ``frontend/vite.config.js` — Vite config from T01`
- ``src/server.js` — existing server`

## Expected Output

- ``src/server.js` — updated static serving for production`
- ``package.json` — updated root scripts`

## Verification

npm run build && npm start → curl localhost:7890 returns Svelte app HTML, curl localhost:7890/api/health returns JSON
