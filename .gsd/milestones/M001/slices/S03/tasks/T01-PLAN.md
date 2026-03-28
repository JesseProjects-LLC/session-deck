---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T01: tmux session query service with type detection

1. Create src/services/tmux.js
2. Implement listSessions(host) — runs tmux list-sessions via local exec or SSH
3. For local host: spawn child_process with tmux command
4. For remote hosts: spawn ssh with ConnectTimeout=5 and tmux command
5. Parse output: session_name, session_windows, session_attached, session_created
6. Detect session type by running tmux list-panes -t <session> -F pane_current_command
7. Type mapping: 'claude' → 'claude-code', 'gsd'|'pi' → 'gsd', else → 'terminal'
8. Handle errors: host unreachable, tmux not installed, no sessions
9. Return structured array per host

## Inputs

- ``src/services/ssh-config.js` — host list for remote queries`

## Expected Output

- ``src/services/tmux.js` — tmux session query and type detection service`

## Verification

Service returns sessions from localhost with correct names, window counts, and types
