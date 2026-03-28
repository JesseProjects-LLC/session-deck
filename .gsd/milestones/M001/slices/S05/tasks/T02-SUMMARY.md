---
id: T02
parent: S05
milestone: M001
provides: []
requires: []
affects: []
key_files: ["deploy/session-deck.service", "deploy/install.sh"]
key_decisions: ["Removed PrivateTmp=true — tmux socket lives in /tmp and needs shared access", "Kept NoNewPrivileges=true as the only hardening"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "systemctl restart session-deck succeeds, curl /api/sessions/reliant returns 13 sessions."
completed_at: 2026-03-27T23:38:11.464Z
blocker_discovered: false
---

# T02: systemd service installed and running — tmux sessions accessible

> systemd service installed and running — tmux sessions accessible

## What Happened
---
id: T02
parent: S05
milestone: M001
key_files:
  - deploy/session-deck.service
  - deploy/install.sh
key_decisions:
  - Removed PrivateTmp=true — tmux socket lives in /tmp and needs shared access
  - Kept NoNewPrivileges=true as the only hardening
duration: ""
verification_result: passed
completed_at: 2026-03-27T23:38:11.466Z
blocker_discovered: false
---

# T02: systemd service installed and running — tmux sessions accessible

**systemd service installed and running — tmux sessions accessible**

## What Happened

Created systemd unit file and install script. Initial version had PrivateTmp=true which gave the service its own /tmp, hiding the tmux socket at /tmp/tmux-1002/default. Removed PrivateTmp and other restrictive directives. Service now starts, finds tmux sessions, and responds correctly.

## Verification

systemctl restart session-deck succeeds, curl /api/sessions/reliant returns 13 sessions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `sudo systemctl restart session-deck && curl /api/sessions/reliant` | 0 | ✅ pass — 13 sessions from systemd service | 3000ms |


## Deviations

Removed ProtectSystem/ProtectHome/PrivateTmp from systemd unit — PrivateTmp blocked tmux socket access at /tmp/tmux-1002/default.

## Known Issues

None.

## Files Created/Modified

- `deploy/session-deck.service`
- `deploy/install.sh`


## Deviations
Removed ProtectSystem/ProtectHome/PrivateTmp from systemd unit — PrivateTmp blocked tmux socket access at /tmp/tmux-1002/default.

## Known Issues
None.
