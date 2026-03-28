---
estimated_steps: 6
estimated_files: 5
skills_used: []
---

# T01: Scaffold Svelte 5 + Vite project in frontend/

1. Create frontend/ directory with Svelte 5 + Vite via create-vite template
2. Install dependencies: svelte, @sveltejs/vite-plugin-svelte, vite
3. Configure vite.config.js with API proxy to localhost:7890
4. Set up basic App.svelte with placeholder layout
5. Add npm scripts: dev (vite), build (vite build), preview (vite preview)
6. Update root package.json with frontend scripts

## Inputs

- ``package.json` — root project manifest`

## Expected Output

- ``frontend/package.json` — Svelte project manifest`
- ``frontend/vite.config.js` — Vite config with API proxy`
- ``frontend/src/App.svelte` — root component`
- ``frontend/src/main.js` — entry point`
- ``frontend/index.html` — HTML shell`

## Verification

cd frontend && npm run build succeeds without errors, dist/ directory created with index.html
