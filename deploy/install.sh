#!/bin/bash
# deploy/install.sh — Install Session Deck as a systemd service
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SERVICE_FILE="$SCRIPT_DIR/session-deck.service"

echo "Installing Session Deck service..."

# Copy service file
sudo cp "$SERVICE_FILE" /etc/systemd/system/session-deck.service

# Ensure data directory exists
mkdir -p "$PROJECT_DIR/data"

# Reload systemd
sudo systemctl daemon-reload

# Enable and start
sudo systemctl enable session-deck
sudo systemctl start session-deck

echo ""
echo "Session Deck service installed and started."
echo "  Status:  sudo systemctl status session-deck"
echo "  Logs:    sudo journalctl -u session-deck -f"
echo "  Stop:    sudo systemctl stop session-deck"
echo "  Restart: sudo systemctl restart session-deck"
