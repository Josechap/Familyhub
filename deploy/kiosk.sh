#!/bin/bash
# Familyhub Kiosk Mode
# Launches Chromium in fullscreen kiosk mode pointing to Familyhub

# Wait for Familyhub server to be ready
sleep 5

# Disable screen blanking (works with both X11 and Wayland on RPi)
wlr-randr 2>/dev/null || true

# Launch Chromium in kiosk mode
# --ozone-platform-hint=auto for Wayland support
chromium --noerrdialogs --disable-infobars --kiosk --disable-session-crashed-bubble --disable-restore-session-state --ozone-platform-hint=auto http://localhost:3001
