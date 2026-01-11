#!/bin/bash
# Familyhub OS - SQLite Database Backup Script
#
# Usage: ./backup-db.sh [backup_dir]
#
# This script creates timestamped backups of the SQLite database
# and removes backups older than 7 days.
#
# To set up automatic daily backups, add to crontab:
#   crontab -e
#   0 2 * * * /home/pi/Familyhub/scripts/backup-db.sh >> /var/log/familyhub-backup.log 2>&1

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_DIR/server/db/familyhub.db"
BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/familyhub_$TIMESTAMP.db"

echo "$(date '+%Y-%m-%d %H:%M:%S') - Starting backup..."

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}Error: Database not found at $DB_PATH${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup using SQLite's backup command (safe for running database)
if command -v sqlite3 &> /dev/null; then
    # Use SQLite's built-in backup (safer)
    sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
else
    # Fallback to copy (works but less safe if DB is being written)
    cp "$DB_PATH" "$BACKUP_FILE"
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo -e "${GREEN}Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
DELETED_COUNT=0
while IFS= read -r -d '' old_backup; do
    rm "$old_backup"
    ((DELETED_COUNT++))
done < <(find "$BACKUP_DIR" -name "familyhub_*.db" -type f -mtime +$RETENTION_DAYS -print0 2>/dev/null)

if [ $DELETED_COUNT -gt 0 ]; then
    echo -e "${YELLOW}Deleted $DELETED_COUNT old backup(s)${NC}"
fi

# List current backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "familyhub_*.db" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)

echo ""
echo "Backup summary:"
echo "  Location: $BACKUP_DIR"
echo "  Total backups: $BACKUP_COUNT"
echo "  Total size: $TOTAL_SIZE"
echo ""
echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S') - Backup completed successfully${NC}"
