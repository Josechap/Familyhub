# Home tab: portal redesign

## Problem

The current Dashboard (`/`) is a dense, scrolling stack of panels with
duplicated information (family standings shown twice, shopping count
shown twice, a nested note repeating the hero's own text). It's meant
to run on a 15.6" 1920x1080 kiosk touchscreen with no page scroll, and
today it doesn't fit.

## Goal

Home becomes a portal: a header with the clock/date, and a row of five
tappable summary cards for the things that matter most at a glance —
Calendar, Tasks, Weather, Music, Leaderboard. Each card shows live,
glanceable state and navigates to its full tab on tap. Meals and
Recipes are intentionally not on Home; they're reachable via their own
tabs.

## Layout

Two vertical zones filling the viewport, no scroll:

- **Header band** (~15% of height): greeting + live clock + date,
  left-aligned. No CTA buttons — the cards are the navigation.
- **Card row** (fills remaining height): `grid-cols-6`. Calendar is
  `col-span-2` (events are the most important thing, gets more room
  and shows up to 3 events instead of 1). Tasks, Weather, Music,
  Leaderboard are each `col-span-1`. All cards stretch to equal
  height via grid.

Order left to right: Calendar, Tasks, Weather, Music, Leaderboard.

## Card content

| Card | Hero content | Supporting line | Empty state |
|---|---|---|---|
| Calendar | Next up to 3 events (title + time) | "+N more today" if truncated | "Nothing on the calendar" |
| Tasks | Count due today (large number) | Next unfinished task's title | "All caught up" |
| Weather | Current temp + condition icon | "Wear: ..." if configured | "Set up weather in Settings" |
| Music | Track title + artist, animated pulse if playing | "Tap to browse" if idle | "Nothing playing" |
| Leaderboard | #1 member's avatar + name + points | "+N more" hint | "Add family members in Settings" |

## Visual treatment

- Each card has a distinct accent glow (radial gradient, tone system
  matching `PageHeader`'s existing tone map): Calendar=sky,
  Tasks=emerald, Weather=amber, Music=violet/pink, Leaderboard=warning/gold.
- Hover: lift (`-translate-y-1`) + glow intensifies. Press:
  `scale-[0.98]`. Same interaction language as `RecipeCard`.
- Music card gets a small animated equalizer/pulse when playing.
- Leaderboard's #1 member keeps the existing trophy-badge treatment.
- Whole card is one `<button>` — full-card tap target, 44px+ touch
  padding throughout (existing app convention).
- No inner scrolling in any card; each shows only what fits.

## Technical plan

- New `client/src/pages/Home.jsx` replaces `Dashboard.jsx` as the `/`
  route in `App.jsx`. `Dashboard.jsx` is deleted (not left as dead code).
- New `client/src/components/home/` folder:
  - `HomeCard.jsx` — shared wrapper: accent glow, hover/press,
    kicker label, click-to-navigate. Each specific card composes this.
  - `CalendarCard.jsx`, `TasksCard.jsx`, `WeatherCard.jsx`,
    `MusicCard.jsx`, `LeaderboardCard.jsx`.
- No new API endpoints. Reuses existing Redux slices as-is:
  `dashboardSlice` (events/tasks/weather/shopping data),
  `sonosSlice` (music), `settingsSlice` (family members).
- Existing modals (`EventModal`, `MealModal`) are dropped from Home
  since the card no longer shows a scrollable event/meal list to pick
  from — tapping a card just navigates to its full tab.
- Verify against `.dashboard-kiosk`-style compact spacing so the whole
  thing fits 1920x1080 without scroll (can't pixel-verify true 1080p
  in this sandbox; needs a check on the real device).

## Out of scope (this pass)

- Redesigning Calendar/Tasks/Recipes/Meals/Settings tabs — planned as
  a follow-up audit against each tab's stated purpose, after Home
  ships.
