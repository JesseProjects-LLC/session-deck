# S01: Project scaffolding and server bootstrap — UAT

**Milestone:** M001
**Written:** 2026-03-27T21:58:03.071Z

## UAT: S01 \u2014 Project scaffolding and server bootstrap\n\n### Test 1: Server starts\n```bash\ncd /opt/projects/session-deck && npm start\n# Expect: JSON log line with port 7890\n```\n\n### Test 2: Health endpoint\n```bash\ncurl -s http://localhost:7890/health | python3 -m json.tool\n# Expect: {status: 'ok', version: '0.1.0', uptime: N, timestamp: '...'}\n```\n\n### Test 3: Config override\n```bash\nSESSION_DECK_PORT=9999 node src/index.js\n# Expect: server binds to port 9999\n```\n\n### Test 4: Graceful shutdown\n```bash\nkill -SIGTERM <pid>\n# Expect: 'Shutdown signal received' + 'Server closed' in logs, exit 0\n```"
