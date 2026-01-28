#!/bin/bash
# Update Familyhub and Ghost Coach from GitHub
# Run: ~/update-apps.sh

set -e
LOG_FILE="/home/joschapa/app-updates.log"

log() {
    echo "[$(date "+%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

log "=== Starting app updates ==="

# Update Familyhub
log "Updating Familyhub..."
cd /home/joschapa/Familyhub
OLD_HEAD=$(git rev-parse HEAD)
git fetch origin
git reset --hard origin/main
NEW_HEAD=$(git rev-parse HEAD)

if [ "$OLD_HEAD" != "$NEW_HEAD" ]; then
    log "Familyhub updated from ${OLD_HEAD:0:7} to ${NEW_HEAD:0:7}"
    cd server
    npm install --production
    cd ../client
    npm install
    npm run build
    sudo systemctl restart familyhub
    log "Familyhub service restarted"
else
    log "Familyhub already up to date"
fi

# Update HypertrophyAI (Ghost Coach)
log "Updating Ghost Coach..."
cd /home/joschapa/hypertrophyai
OLD_HEAD=$(git rev-parse HEAD)
git fetch origin
git reset --hard origin/main
NEW_HEAD=$(git rev-parse HEAD)

if [ "$OLD_HEAD" != "$NEW_HEAD" ]; then
    log "Ghost Coach updated from ${OLD_HEAD:0:7} to ${NEW_HEAD:0:7}"
    npm install
    npm run build
    sudo systemctl restart hypertrophyai
    log "Ghost Coach service restarted"
else
    log "Ghost Coach already up to date"
fi

log "=== Update complete ==="
