---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T01: Add create/rename/delete to tmux service

1. Add createSession(host, name, startDir?) to tmux.js — runs tmux new-session -d -s <name>
2. Add renameSession(host, oldName, newName) — runs tmux rename-session
3. Add deleteSession(host, name) — runs tmux kill-session -t <name>
4. All operations use the same execLocal/execRemote pattern
5. Return success/error with meaningful messages
6. Validate session name (no special chars)

## Inputs

- ``src/services/tmux.js` — existing tmux service with exec helpers`

## Expected Output

- ``src/services/tmux.js` — added create/rename/delete functions`

## Verification

Create a test session, verify it appears in list, rename it, delete it
