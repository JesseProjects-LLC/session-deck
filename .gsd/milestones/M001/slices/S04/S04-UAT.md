# S04: Session management — create, rename, delete — UAT

**Milestone:** M001
**Written:** 2026-03-27T22:05:49.970Z

## UAT: S04 — Session management CRUD\n\n### Test 1: Create session\n```bash\ncurl -s -X POST http://localhost:7890/api/sessions/reliant \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\": \"test-session\"}'\n# Expect: {success: true, host: 'reliant', session: 'test-session'}\n```\n\n### Test 2: Rename session\n```bash\ncurl -s -X PUT http://localhost:7890/api/sessions/reliant/test-session \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"newName\": \"test-renamed\"}'\n# Expect: {success: true, oldName: 'test-session', newName: 'test-renamed'}\n```\n\n### Test 3: Delete session\n```bash\ncurl -s -X DELETE http://localhost:7890/api/sessions/reliant/test-renamed\n# Expect: {success: true}\n```\n\n### Test 4: Validation\n```bash\ncurl -s -X POST http://localhost:7890/api/sessions/reliant \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\": \"bad name!\"}'\n# Expect: 400 with error message\n```"
