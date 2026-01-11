# Design: Screensaver, Analytics Trends & Dashboard Enhancements

## Overview

Add four features to FamilyHub:
1. Historical trend chart in Task Analytics (stacked bar chart)
2. "What to Wear" clothing card on Dashboard
3. Auto-return to Dashboard after idle timeout
4. Screensaver with Google Photos rotation and calendar overlay

---

## Feature 1: Task Analytics Trend Chart

**Type**: Stacked bar chart showing daily task completions per family member

**Library**: Recharts (lightweight, React-native)

**Data source**: Existing `/api/tasks/analytics/daily` endpoint (returns per-day per-member breakdown)

**Placement**: Above "Completion History" list in TaskAnalytics component

**Design**:
- Each bar segment colored by family member's assigned color
- Hover/tap tooltip shows member name and count
- Legend below chart
- Responsive width, matches dark theme

---

## Feature 2: Dashboard "What to Wear" Card

**Data**: Already exists in `state.dashboard.clothing` (currently hardcoded)

**Card layout**:
```
+---------------------------+
|  [shirt icon] What to Wear |
|                           |
|  [jacket] Light Jacket    |
|                           |
|  [shoe] Sneakers  [cap]   |
|                           |
|  [bulb] Weather tip here  |
+---------------------------+
```

**Grid update**: Change from 3-column to responsive `grid-cols-2 lg:grid-cols-4`

---

## Feature 3: Auto-Return to Dashboard

**Settings**:
| Key | Default | Range |
|-----|---------|-------|
| `idleReturnTimeout` | 5 min | 1-30 min |

**Implementation**:
- Custom `useIdleTimer` hook tracks: mouse, touch, keyboard, scroll
- Located in Layout.jsx (wraps all pages)
- On idle: `navigate('/')` via React Router
- Activity resets timer

---

## Feature 4: Screensaver

**Settings**:
| Key | Default | Range |
|-----|---------|-------|
| `screensaverTimeout` | 10 min | 5-60 min |
| `screensaverPhotoInterval` | 30 sec | 10-120 sec |
| `googlePhotosAlbumId` | null | User-selected album |

**Layout**: Full-screen photo with semi-transparent calendar overlay (bottom-left)

**Calendar overlay shows**:
- Current time (large)
- Today's date
- Today's events (max 5)

**Photo behavior**:
- Crossfade transition (500ms)
- Preload next image
- Shuffle on activation
- Skip failed images

**Dismissal**: Any tap/click/keypress exits screensaver

**Google Photos integration**:
- New scope: `photoslibrary.readonly`
- Endpoints: `/api/google/photos/albums`, `/api/google/photos/album/:id`
- Album picker in Settings (includes face/people albums)
- Photo URLs cached, refreshed every 30 min

---

## New Files

| File | Purpose |
|------|---------|
| `client/src/hooks/useIdleTimer.js` | Idle detection hook |
| `client/src/components/Screensaver.jsx` | Screensaver overlay component |
| `client/src/components/GooglePhotosAlbumPicker.jsx` | Album selection for Settings |
| `server/routes/google-photos.js` | Google Photos API endpoints |

---

## Modified Files

| File | Changes |
|------|---------|
| `client/src/components/Layout.jsx` | Add idle timers, render Screensaver |
| `client/src/features/appSlice.js` | Add `screensaverActive` state |
| `client/src/features/settingsSlice.js` | Add idle/screensaver settings |
| `client/src/pages/Dashboard.jsx` | Add clothing card, update grid |
| `client/src/pages/Tasks.jsx` | Add Recharts bar chart to TaskAnalytics |
| `client/src/pages/Settings.jsx` | Add Display + Google Photos sections |
| `client/src/lib/api.js` | Add Google Photos API methods |
| `server/routes/google.js` | Add Photos OAuth scope |
| `server/index.js` | Register google-photos router |
| `client/package.json` | Add `recharts` dependency |

---

## Settings UI (Settings Page)

**New "Display" section**:
- Idle return timeout slider (1-30 min, default 5)
- Screensaver timeout slider (5-60 min, default 10)
- Photo interval slider (10-120 sec, default 30)

**New "Google Photos" section**:
- Connect button (triggers OAuth with Photos scope)
- Album picker dropdown (user albums + face albums)
- Selected album preview

---

## Verification Plan

1. **Trend chart**: View Analytics tab, verify stacked bars show per-member daily data
2. **Clothing card**: Dashboard shows "What to Wear" card in grid
3. **Auto-return**: Navigate to Tasks, wait 5 min idle, verify return to Dashboard
4. **Screensaver**: Wait 10 min idle, verify photo + calendar overlay appears
5. **Photo rotation**: Confirm photos change every 30 sec with crossfade
6. **Dismissal**: Tap screensaver, verify it exits and resets timers
7. **Settings**: Verify all sliders save and apply correctly
8. **Google Photos**: Connect, select album, verify photos load in screensaver
