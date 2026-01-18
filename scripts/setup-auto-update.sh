#!/bin/bash
# Familyhub - Setup Auto-Update Cron Job
# Run this once on the Raspberry Pi to enable automatic updates

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UPDATE_SCRIPT="${SCRIPT_DIR}/auto-update.sh"

# Make update script executable
chmod +x "$UPDATE_SCRIPT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}📦 Setting up Familyhub auto-update...${NC}"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto-update.sh"; then
    echo -e "${YELLOW}Auto-update cron job already exists.${NC}"
    read -p "Replace it? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing cron job."
        exit 0
    fi
    # Remove existing job
    crontab -l 2>/dev/null | grep -v "auto-update.sh" | crontab -
fi

# Add cron job to run every hour
(crontab -l 2>/dev/null; echo "0 * * * * ${UPDATE_SCRIPT} >> ${HOME}/Familyhub/update.log 2>&1") | crontab -

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Auto-update configured!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "Familyhub will now check for updates every hour."
echo "When updates are available, it will:"
echo "  1. Pull the latest code from GitHub"
echo "  2. Rebuild the client if source files changed"
echo "  3. Restart the familyhub service"
echo ""
echo "📋 Useful commands:"
echo "   crontab -l                           # View scheduled jobs"
echo "   tail -f ~/Familyhub/update.log       # Watch update logs"
echo "   bash ~/Familyhub/scripts/auto-update.sh  # Run update manually"
echo ""
