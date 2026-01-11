# Familyhub OS

A beautiful family dashboard for Raspberry Pi with calendar, tasks, recipes, meal planning, and photo screensaver.

![Dashboard Preview](docs/images/dashboard-preview.png)

## Features

- 📅 **Google Calendar** - View family events and schedules
- ✅ **Google Tasks** - Track chores and to-dos with points
- 🍽️ **Meal Planning** - Weekly dinner planner with Paprika integration
- 📸 **Photo Screensaver** - Display local photos with HEIC support
- 🔊 **Sonos Control** - Control music throughout your home
- 🌙 **Dark/Light Mode** - Auto-adjusts based on time of day

---

## 🍓 Raspberry Pi Installation (Blank SD Card)

Complete guide to set up Familyhub on a fresh Raspberry Pi.

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Raspberry Pi | 3B+ | 4 (2GB+) |
| SD Card | 16GB | 32GB Class 10 |
| Display | Any HDMI | 7" touchscreen |
| Power | 2.5A (Pi 3) | 3A USB-C (Pi 4) |

### Step 1: Flash the SD Card

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/) on your computer
2. Insert your SD card
3. Open Raspberry Pi Imager and click **Choose OS** → **Raspberry Pi OS (other)** → **Raspberry Pi OS Lite (64-bit)**
4. Click **Choose Storage** and select your SD card
5. Click the **⚙️ gear icon** (or Ctrl+Shift+X) for advanced options:

   **Set hostname:** `familyhub`
   
   **Enable SSH:** ✅ Use password authentication
   
   **Set username and password:**
   - Username: `pi`
   - Password: (choose a secure password)
   
   **Configure WiFi:** ✅
   - SSID: Your WiFi name
   - Password: Your WiFi password
   - Country: Your country code (US, GB, etc.)
   
   **Set locale settings:** Your timezone

6. Click **Save**, then **Write**

### Step 2: Boot and Connect

1. Insert the SD card into your Pi and power it on
2. Wait 2-3 minutes for first boot
3. Find your Pi's IP address:
   - **Option A:** Check your router's admin page for connected devices
   - **Option B:** Use `ping familyhub.local` from your computer
   - **Option C:** Connect a monitor temporarily and run `hostname -I`

4. SSH into your Pi:
   ```bash
   ssh pi@familyhub.local
   # Or: ssh pi@<IP-ADDRESS>
   ```

### Step 3: Install Familyhub

Run the one-liner installer:

```bash
curl -sSL https://raw.githubusercontent.com/Josechap/Familyhub/main/install.sh | bash
```

This will automatically:
- ✅ Install Node.js 20 LTS
- ✅ Install build tools and dependencies
- ✅ Build the production client
- ✅ Configure Nginx reverse proxy (port 80)
- ✅ Set up systemd auto-start
- ✅ Configure daily database backups

**Installation takes about 10-15 minutes on Pi 4.**

### Step 4: Configure Environment

1. Generate an encryption key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Edit the configuration:
   ```bash
   nano ~/Familyhub/server/.env
   ```

3. Add your settings:
   ```env
   # Required: Encryption key (paste from step 1)
   ENCRYPTION_KEY=your_64_character_hex_key
   
   # Optional: Google Calendar/Tasks integration
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

4. Restart the service:
   ```bash
   sudo systemctl restart familyhub
   ```

### Step 5: Access Your Dashboard

Open a browser on any device on your network:

```
http://familyhub.local
```

Or use the IP address: `http://<PI-IP-ADDRESS>`

---

## 🖥️ Kiosk Mode (Dedicated Display)

Turn your Pi into a dedicated family dashboard with auto-start browser.

### Quick Setup

```bash
cd ~/Familyhub
./scripts/setup-kiosk.sh
```

This will:
- Install Chromium browser
- Configure auto-login to desktop
- Start Chromium in kiosk mode on boot
- Disable screen blanking
- Hide cursor after 5 seconds of idle

### Manual Kiosk Setup

If you prefer manual setup:

```bash
# Install desktop and Chromium
sudo apt-get install -y --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox chromium-browser unclutter

# Configure auto-login
sudo raspi-config nonint do_boot_behaviour B4

# Create autostart
mkdir -p ~/.config/openbox
cat > ~/.config/openbox/autostart << 'EOF'
# Disable screen blanking
xset s off
xset s noblank
xset -dpms

# Hide cursor when idle
unclutter -idle 5 -root &

# Start Chromium in kiosk mode
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost &
EOF

# Reboot
sudo reboot
```

---

## ⚙️ Configuration

### Google Calendar & Tasks

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable: **Google Calendar API** and **Google Tasks API**
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `http://familyhub.local/api/google/callback`
6. Copy Client ID and Secret to `server/.env`
7. Restart: `sudo systemctl restart familyhub`
8. Connect via Settings page in the dashboard

### Local Photos (Screensaver)

1. Create a photos folder:
   ```bash
   mkdir -p ~/photos
   ```

2. Copy photos (HEIC, JPG, PNG supported):
   ```bash
   scp -r /path/to/photos/* pi@familyhub.local:~/photos/
   ```

3. In Settings → Screensaver Photos, enter: `/home/pi/photos`

### Paprika Recipe Sync

1. Go to Settings → Integrations
2. Enter your Paprika email and password
3. Recipes will sync automatically

---

## 🔧 Service Management

```bash
# Check status
sudo systemctl status familyhub

# View logs (live)
sudo journalctl -u familyhub -f

# Restart
sudo systemctl restart familyhub

# Stop
sudo systemctl stop familyhub

# Start
sudo systemctl start familyhub
```

---

## 🔄 Updates

```bash
cd ~/Familyhub
git pull
cd client && npm install && npm run build
sudo systemctl restart familyhub
```

---

## 💾 Backups

Backups run automatically at 2 AM daily and keep 7 days of history.

```bash
# Manual backup
~/Familyhub/scripts/backup-db.sh

# View backups
ls -la ~/Familyhub/backups/

# Restore from backup
cp ~/Familyhub/backups/familyhub_YYYYMMDD_HHMMSS.db ~/Familyhub/server/db/familyhub.db
sudo systemctl restart familyhub
```

---

## 🐛 Troubleshooting

### Dashboard not loading

```bash
# Check if service is running
sudo systemctl status familyhub

# Check for errors
sudo journalctl -u familyhub --since "10 minutes ago"

# Check Nginx
sudo systemctl status nginx
sudo nginx -t
```

### Can't find Pi on network

```bash
# From Pi (with monitor attached):
hostname -I

# Check WiFi is connected:
iwconfig wlan0
```

### "Permission denied" errors

```bash
# Fix ownership
sudo chown -R pi:pi ~/Familyhub
```

### Node.js/npm errors

```bash
# Reinstall Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Screen goes blank (kiosk mode)

```bash
# Disable screen blanking
xset s off && xset s noblank && xset -dpms
```

---

## 💻 Development Setup

For local development on your computer:

### Server (Backend)

```bash
cd server
npm install
cp .env.example .env  # Edit with your settings
npm run dev           # Runs on http://localhost:3001
```

### Client (Frontend)

```bash
cd client
npm install
npm run dev           # Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
Familyhub/
├── client/           # React frontend (Vite + Tailwind)
├── server/           # Express.js backend
│   ├── db/           # SQLite database
│   ├── routes/       # API endpoints
│   └── .env          # Configuration (create from .env.example)
├── nginx/            # Nginx reverse proxy config
├── scripts/          # Utility scripts (backup, kiosk)
├── install.sh        # Raspberry Pi installer
└── README.md
```

---

## 📄 License

MIT License - Feel free to use and modify for your family!
