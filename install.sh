#!/bin/bash
# Familyhub OS - Raspberry Pi Install Script
# Run with: curl -sSL https://raw.githubusercontent.com/Josechap/Familyhub/main/install.sh | bash
# Or: ./install.sh

set -e

echo "🏠 Familyhub OS Installer"
echo "========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${FAMILYHUB_DIR:-$SCRIPT_DIR}"

# If running via curl pipe, clone the repo
if [[ "$SCRIPT_DIR" == "/dev/fd" ]] || [[ ! -f "$SCRIPT_DIR/server/package.json" ]]; then
    INSTALL_DIR="$HOME/Familyhub"
    echo -e "${YELLOW}📥 Cloning Familyhub repository...${NC}"
    if [ -d "$INSTALL_DIR" ]; then
        echo "   Directory exists, pulling latest..."
        cd "$INSTALL_DIR" && git pull
    else
        git clone https://github.com/Josechap/Familyhub.git "$INSTALL_DIR"
    fi
    cd "$INSTALL_DIR"
else
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}📂 Installing in: $INSTALL_DIR${NC}"
echo ""

# Check if running on Raspberry Pi (ARM)
ARCH=$(uname -m)
echo "🔍 Detected architecture: $ARCH"

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${YELLOW}📦 Installing Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✓ Node.js installed: $(node -v)${NC}"
fi

# Install build tools for native modules (better-sqlite3) and nginx
echo ""
echo -e "${YELLOW}📦 Installing build dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y build-essential python3 nginx sqlite3

# Install server dependencies
echo ""
echo -e "${YELLOW}📦 Installing server dependencies...${NC}"
cd "$INSTALL_DIR/server"
npm install

# Install client dependencies and build
echo ""
echo -e "${YELLOW}📦 Installing client dependencies...${NC}"
cd "$INSTALL_DIR/client"
npm install

echo ""
echo -e "${YELLOW}🔨 Building client for production...${NC}"
npm run build

# Create .env if it doesn't exist
if [ ! -f "$INSTALL_DIR/server/.env" ]; then
    echo ""
    echo -e "${YELLOW}📝 Creating .env from template...${NC}"
    cp "$INSTALL_DIR/server/.env.example" "$INSTALL_DIR/server/.env" 2>/dev/null || \
    cat > "$INSTALL_DIR/server/.env" << 'EOF'
# Google OAuth credentials (for calendar integration)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Server configuration
PORT=3001
HOST=0.0.0.0
EOF
    echo -e "${YELLOW}⚠️  Please edit server/.env with your credentials${NC}"
fi

# Create systemd service
echo ""
echo -e "${YELLOW}🔧 Setting up systemd service...${NC}"
sudo tee /etc/systemd/system/familyhub.service > /dev/null << EOF
[Unit]
Description=Familyhub OS Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/server
ExecStart=$(which node) index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=familyhub
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable familyhub
sudo systemctl start familyhub

# Configure Nginx reverse proxy
echo ""
echo -e "${YELLOW}🔧 Configuring Nginx reverse proxy...${NC}"
sudo cp "$INSTALL_DIR/nginx/familyhub.conf" /etc/nginx/sites-available/familyhub
sudo ln -sf /etc/nginx/sites-available/familyhub /etc/nginx/sites-enabled/familyhub
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx
echo -e "${GREEN}✓ Nginx configured (access on port 80)${NC}"

# Set up backup directory and cron job
echo ""
echo -e "${YELLOW}🔧 Setting up database backups...${NC}"
mkdir -p "$INSTALL_DIR/backups"
chmod +x "$INSTALL_DIR/scripts/backup-db.sh"

# Add daily backup cron job (2 AM)
CRON_JOB="0 2 * * * $INSTALL_DIR/scripts/backup-db.sh >> /var/log/familyhub-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$CRON_JOB") | crontab -
echo -e "${GREEN}✓ Daily backups scheduled (2 AM)${NC}"

# Run initial backup
"$INSTALL_DIR/scripts/backup-db.sh" > /dev/null 2>&1 || true

# Get IP address
IP_ADDR=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Familyhub OS installed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo ""
echo "🌐 Access your dashboard at:"
echo -e "   ${GREEN}http://$IP_ADDR${NC} (via Nginx)"
echo -e "   ${GREEN}http://localhost${NC}"
echo ""
echo "📋 Useful commands:"
echo "   sudo systemctl status familyhub    # Check app status"
echo "   sudo systemctl restart familyhub   # Restart app"
echo "   sudo systemctl status nginx        # Check Nginx status"
echo "   sudo journalctl -u familyhub -f    # View app logs"
echo "   ./scripts/backup-db.sh             # Manual backup"
echo ""
echo "📦 Backups:"
echo "   Location: $INSTALL_DIR/backups/"
echo "   Schedule: Daily at 2 AM (7-day retention)"
echo ""
echo -e "${YELLOW}⚠️  Don't forget to edit server/.env with your Google credentials!${NC}"
