# Nest Thermostat Integration Design

## Overview

Add Nest thermostat control to Familyhub, allowing users to view and adjust their home temperature from the dashboard.

## Features

### Dashboard Card
- Current temperature (large display)
- Target temperature (smaller)
- Current mode icon (heat/cool/eco/off)
- Quick +/- buttons for 1° adjustments
- Tap to open detailed view
- Multiple thermostats: show primary with "+N more" badge

### Detailed View
- Large circular temperature dial showing current vs target
- Mode selector: Heat / Cool / Heat+Cool / Off / Eco
- Temperature slider or +/- controls
- Ambient humidity display
- HVAC status ("Heating to 72°" or "Idle")
- Multi-thermostat support via tabs
- Schedule awareness (following schedule vs hold mode)

## Technical Architecture

### Backend Structure

```
server/
├── routes/
│   └── nest.js              # API endpoints for frontend
├── services/
│   └── nestService.js       # Google Device Access API calls
└── db/
    └── (existing)           # OAuth tokens, device cache
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/nest/devices` | List all thermostats |
| GET | `/api/nest/devices/:id` | Get current state (temp, mode, humidity) |
| POST | `/api/nest/devices/:id/temperature` | Set target temperature |
| POST | `/api/nest/devices/:id/mode` | Change mode (heat/cool/off/eco) |

### Authentication Flow

1. User goes to Settings → Integrations → "Connect Nest"
2. Redirects to Google OAuth consent screen
3. User grants Familyhub access to Nest devices
4. Tokens stored encrypted in SQLite (same pattern as Paprika)
5. Automatic token refresh on expiry

### Data Flow

- Poll Nest API every 60 seconds for temperature updates
- Immediate refresh after user makes a change
- Cache device list to reduce API calls

### Google Device Access Requirements

- One-time $5 registration fee
- Google Cloud project with SDM API enabled
- OAuth 2.0 credentials (Web application)
- Redirect URI: `http://familyhub.local/api/nest/callback`

## Frontend Components

```
client/src/components/
├── NestCard.jsx           # Dashboard summary card
├── NestDetailView.jsx     # Full control page
├── TemperatureDial.jsx    # Circular temp display/control
└── ThermostatSelector.jsx # Multi-thermostat tabs
```

### NestCard.jsx
- Dashboard summary showing current/target temp and mode
- Quick +/- temperature adjustments
- Loading/error/disconnected states
- Click to open detailed view

### TemperatureDial.jsx
- SVG-based circular gauge
- Current temp as position indicator
- Target temp as adjustable arc
- Color gradient: blue (cool) → orange (heat)
- Touch-friendly for kiosk mode

### Styling
- Tailwind CSS matching existing theme
- Dark/light mode support
- Responsive for dashboard column width

## Implementation Phases

### Phase 1: Google Device Access Setup
- [ ] Register for Device Access ($5 fee)
- [ ] Create Google Cloud project
- [ ] Enable Smart Device Management API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Add redirect URI for Familyhub

### Phase 2: Backend
- [ ] Create `nestService.js` with Device Access API
- [ ] Add OAuth flow routes (`/api/nest/auth`, `/api/nest/callback`)
- [ ] Create device and control endpoints
- [ ] Add encrypted token storage
- [ ] Implement polling mechanism

### Phase 3: Frontend
- [ ] Build `NestCard` dashboard component
- [ ] Build `NestDetailView` with temperature dial
- [ ] Add "Connect Nest" to Settings → Integrations
- [ ] Wire up components to API

### Phase 4: Testing & Polish
- [ ] Test OAuth flow end-to-end
- [ ] Test temperature adjustments
- [ ] Handle edge cases (offline, token expiry)
- [ ] Verify dark/light mode styling
- [ ] Test on kiosk display

## References

- [Google Device Access](https://developers.google.com/nest/device-access)
- [Thermostat API](https://developers.google.com/nest/device-access/api/thermostat)
- [Node.js Web App Codelab](https://developers.google.com/nest/device-access/codelabs/web-app)
