#!/bin/bash
# Familyhub Auto-Update Script
# This script pulls the latest code from GitHub and rebuilds the client if needed

set -e

# Configuration
FAMILYHUB_DIR="${HOME}/Familyhub"
LOG_FILE="${FAMILYHUB_DIR}/update.log"
LOCK_FILE="/tmp/familyhub-update.lock"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Prevent concurrent updates
if [ -f "$LOCK_FILE" ]; then
    echo -e "${YELLOW}Update already in progress. Exiting.${NC}"
    exit 0
fi
trap "rm -f $LOCK_FILE" EXIT
touch "$LOCK_FILE"

log "🔄 Starting Familyhub auto-update check..."

cd "$FAMILYHUB_DIR"

# Fetch latest changes
git fetch origin main --quiet

# Check if there are updates
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    log "✅ Already up to date (${LOCAL_HASH:0:8})"
    exit 0
fi

log "📥 Updates available! ${LOCAL_HASH:0:8} → ${REMOTE_HASH:0:8}"

# Pull changes
log "Pulling latest changes..."
git pull --quiet origin main

# Check if client source changed
CLIENT_CHANGED=$(git diff --name-only "$LOCAL_HASH" "$REMOTE_HASH" | grep -c "^client/src/" || true)

if [ "$CLIENT_CHANGED" -gt 0 ]; then
    log "📦 Client source changed. Rebuilding..."
    cd "${FAMILYHUB_DIR}/client"
    npm run build >> "$LOG_FILE" 2>&1
    log "✅ Client rebuilt successfully"
    cd "$FAMILYHUB_DIR"
fi

# Restart the service
log "🔄 Restarting familyhub service..."
sudo systemctl restart familyhub

# Wait a moment for service to start
sleep 5

# Check service status
if systemctl is-active --quiet familyhub; then
    log "✅ Update complete! Service is running."
else
    log "❌ Service failed to start after update!"
    systemctl status familyhub >> "$LOG_FILE" 2>&1
    exit 1
fi

log "🎉 Familyhub updated to ${REMOTE_HASH:0:8}"
