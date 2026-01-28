# Familyhub Deployment

Scripts and configuration for deploying Familyhub on a Raspberry Pi.

## Quick Setup

```bash
# Copy service files
sudo cp deploy/familyhub.service /etc/systemd/system/
sudo cp deploy/app-update.service /etc/systemd/system/

# Copy scripts
cp deploy/update-apps.sh ~/update-apps.sh
cp deploy/kiosk.sh ~/kiosk.sh
chmod +x ~/update-apps.sh ~/kiosk.sh

# Enable services
sudo systemctl daemon-reload
sudo systemctl enable familyhub app-update

# Start Familyhub
sudo systemctl start familyhub
```

## Kiosk Mode

For kiosk mode (fullscreen browser on boot):

```bash
# Add to labwc autostart
mkdir -p ~/.config/labwc
echo '/home/joschapa/kiosk.sh &' >> ~/.config/labwc/autostart

# Disable screen blanking
sudo sed -i 's/$/ consoleblank=0/' /boot/firmware/cmdline.txt
```

## Cloudflare Tunnel

To expose Familyhub via Cloudflare Tunnel, add to `/etc/cloudflared/config.yml`:

```yaml
ingress:
  - hostname: familyhub.yourdomain.com
    service: http://localhost:3001
```

## Auto-Update

The `app-update.service` runs on boot before Familyhub starts, pulling the latest code from GitHub.

To manually update:
```bash
~/update-apps.sh
```

## Commands

```bash
# Check status
sudo systemctl status familyhub

# View logs
journalctl -u familyhub -f

# Restart
sudo systemctl restart familyhub

# Update from GitHub
~/update-apps.sh
```
