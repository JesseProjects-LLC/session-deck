# S02: SSH config parser and host discovery — UAT

**Milestone:** M001
**Written:** 2026-03-27T22:00:11.248Z

## UAT: S02 \u2014 SSH config parser and host discovery\n\n### Test 1: Hosts API\n```bash\ncurl -s http://localhost:7890/api/hosts | python3 -m json.tool\n# Expect: 15 hosts, 8 groups, reliant first\n```\n\n### Test 2: Host groups\n```bash\ncurl -s http://localhost:7890/api/hosts | python3 -c \"import json,sys; print(list(json.load(sys.stdin)['groups'].keys()))\"\n# Expect: ['Local', 'VPS', 'Network', 'NAS', 'Proxmox', 'HomeLab VM', 'HomeLab LXC', 'Client']\n```"
