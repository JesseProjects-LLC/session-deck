# S03: tmux session inventory — local and remote — UAT

**Milestone:** M001
**Written:** 2026-03-27T22:03:53.177Z

## UAT: S03 — tmux session inventory\n\n### Test 1: All sessions\n```bash\ncurl -s http://localhost:7890/api/sessions | python3 -m json.tool\n# Expect: results array with per-host entries, reliant shows 13 sessions\n```\n\n### Test 2: Single host\n```bash\ncurl -s http://localhost:7890/api/sessions/reliant\n# Expect: 13 sessions with correct types\n```\n\n### Test 3: Session types\n```bash\ncurl -s http://localhost:7890/api/sessions/reliant | python3 -c \"\nimport json,sys\nfor s in json.load(sys.stdin)['sessions']:\n    print(f'{s[\"name\"]:20s} {s[\"type\"]}')\n\"\n# Expect: main=claude-code, gsd-clawdeck=gsd, business=terminal\n```\n\n### Test 4: Host status\n```bash\ncurl -s http://localhost:7890/api/sessions | python3 -c \"\nimport json,sys\nfor r in json.load(sys.stdin)['results']:\n    print(f'{r[\"host\"]:20s} {r[\"status\"]}')\n\"\n# Expect: reliant=online, unreachable hosts show unreachable/no-tmux\n```"
