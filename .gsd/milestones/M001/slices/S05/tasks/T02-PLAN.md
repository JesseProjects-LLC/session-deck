---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: systemd service unit file and deployment script

1. Create deploy/session-deck.service systemd unit file
2. Configure: User=claude, WorkingDirectory, ExecStart with node
3. Restart=on-failure, RestartSec=5
4. Environment for production settings
5. After=network.target
6. Create deploy/install.sh script for easy deployment
7. Test with systemctl commands

## Inputs

- ``src/index.js` — server entry point`

## Expected Output

- ``deploy/session-deck.service` — systemd unit file`
- ``deploy/install.sh` — installation script`

## Verification

systemctl start session-deck succeeds, service responds on port, systemctl stop cleans up
