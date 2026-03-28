# S05: systemd service and SQLite schema — UAT

**Milestone:** M001
**Written:** 2026-03-27T23:38:30.355Z

## UAT: S05 \u2014 systemd service and SQLite schema\n\n### Test 1: Service status\n```bash\nsudo systemctl status session-deck\n# Expect: active (running)\n```\n\n### Test 2: Sessions via service\n```bash\ncurl -s http://localhost:7890/api/sessions/reliant | python3 -c \"import json,sys; d=json.load(sys.stdin); print(f'Sessions: {d[\\\"sessionCount\\\"]}')\"\n# Expect: Sessions: 13 (or current count)\n```\n\n### Test 3: DB exists\n```bash\nsqlite3 data/session-deck.db '.tables'\n# Expect: deploy_history host_groups layout_presets\n```"
