# S01: Svelte + Vite scaffolding and dev proxy — UAT

**Milestone:** M002
**Written:** 2026-03-28T17:46:31.362Z

## UAT: S01 \u2014 Svelte + Vite scaffolding\n\n### Test 1: Production build\n```bash\nnpm run build\n# Expect: vite build succeeds, frontend/dist/ created\n```\n\n### Test 2: Production serve\n```bash\nnpm start\ncurl http://localhost:7890/\n# Expect: Svelte app HTML with Session Deck title\n```\n\n### Test 3: API still works\n```bash\ncurl http://localhost:7890/health\n# Expect: {status: 'ok'}\n```\n\n### Test 4: Playground preserved\n```bash\ncurl -o /dev/null -w '%{http_code}' http://localhost:7890/playground/index.html\n# Expect: 200\n```"
