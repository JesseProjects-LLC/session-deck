---
id: T03
parent: S01
milestone: M001
provides: []
requires: []
affects: []
key_files: ["src/lib/config.js"]
key_decisions: ["Config validates at import time — fail fast on bad values", "DB path defaults to ./data/session-deck.db"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "SESSION_DECK_PORT=9999 override worked \u2014 server bound to port 9999."
completed_at: 2026-03-27T21:57:38.011Z
blocker_discovered: false
---

# T03: Configuration module with env var overrides and startup validation

> Configuration module with env var overrides and startup validation

## What Happened
---
id: T03
parent: S01
milestone: M001
key_files:
  - src/lib/config.js
key_decisions:
  - Config validates at import time — fail fast on bad values
  - DB path defaults to ./data/session-deck.db
duration: ""
verification_result: passed
completed_at: 2026-03-27T21:57:38.029Z
blocker_discovered: false
---

# T03: Configuration module with env var overrides and startup validation

**Configuration module with env var overrides and startup validation**

## What Happened

Created centralized config module with env var overrides and validation. Port, host, log level, and DB path all configurable. Invalid values fail fast at startup.

## Verification

SESSION_DECK_PORT=9999 override worked \u2014 server bound to port 9999.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `SESSION_DECK_PORT=9999 node src/index.js` | 0 | ✅ pass | 2000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `src/lib/config.js`


## Deviations
None.

## Known Issues
None.
