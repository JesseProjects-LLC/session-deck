# Demo Setup — Restore Instructions

## Database Backup
Backup file: `data/session-deck.db.backup-20260330-105254`

### To restore database (workspaces, hosts, presets):
```bash
cp data/session-deck.db.backup-20260330-105254 data/session-deck.db
sudo systemctl restart session-deck
```

## tmux Session Changes Made
| Action | Original | New |
|--------|----------|-----|
| killed | placer | — |
| renamed | business | finance |
| renamed | gsd-placer | gsd-freelance |
| renamed | gsd-onsite | gsd-webapp |

## To Restore tmux Sessions
```bash
tmux rename-session -t finance business
tmux rename-session -t gsd-freelance gsd-placer
tmux rename-session -t gsd-webapp gsd-onsite
# placer was killed intentionally (no longer needed)
```

## Demo Sessions to Kill
```bash
tmux kill-session -t monitoring
tmux kill-session -t editor
tmux kill-session -t logs
tmux kill-session -t docker-mgr
tmux kill-session -t python-dev
tmux kill-session -t node-app
```
