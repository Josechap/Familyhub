-- Familyhub OS Database Schema

-- Family Members
CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    emoji TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    category TEXT,
    is_favorite INTEGER DEFAULT 0,
    ingredients TEXT, -- JSON array
    steps TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chores/Tasks
CREATE TABLE IF NOT EXISTS chores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    assigned_to INTEGER REFERENCES family_members(id),
    completed INTEGER DEFAULT 0,
    recurring TEXT, -- daily, weekly, none
    schedule_type TEXT DEFAULT 'manual', -- manual, daily, weekly, specific_days
    days_of_week TEXT, -- JSON array of weekday tokens, e.g. ["mon","wed"]
    due_time TEXT, -- HH:MM
    cycle_key TEXT, -- current active cycle for routine resets
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL, -- YYYY-MM-DD
    start_hour INTEGER,
    duration REAL,
    member_id INTEGER REFERENCES family_members(id),
    color TEXT,
    event_type TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Meal Planning (supports breakfast, lunch, dinner, snack)
CREATE TABLE IF NOT EXISTS meal_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    recipe_id INTEGER REFERENCES recipes(id),
    recipe_title TEXT,
    recipe_emoji TEXT DEFAULT '🍽️',
    recipe_photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, meal_type) -- One meal per type per day
);

-- Meal History (track completed meals)
CREATE TABLE IF NOT EXISTS meal_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    recipe_id INTEGER REFERENCES recipes(id),
    recipe_title TEXT,
    recipe_emoji TEXT,
    recipe_photo TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Legacy table for backward compatibility (can be removed after migration)
CREATE TABLE IF NOT EXISTS dinner_slots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
    recipe_id INTEGER REFERENCES recipes(id),
    recipe_title TEXT,
    recipe_emoji TEXT DEFAULT '🍽️',
    recipe_photo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Google OAuth Tokens
CREATE TABLE IF NOT EXISTS google_tokens (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row allowed
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date INTEGER,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task Completion History (tracks all task completions for analytics)
CREATE TABLE IF NOT EXISTS task_completions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER REFERENCES family_members(id),
    member_name TEXT NOT NULL,
    task_title TEXT NOT NULL,
    task_source TEXT NOT NULL, -- 'local' or 'google'
    task_id TEXT,
    cycle_key TEXT,
    points_earned INTEGER DEFAULT 1,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Shared-screen announcements
CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    member_id INTEGER REFERENCES family_members(id),
    priority TEXT DEFAULT 'normal',
    start_at TEXT NOT NULL,
    expires_at TEXT,
    dismissed_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Persistent shopping items
CREATE TABLE IF NOT EXISTS shopping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    normalized_label TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    category TEXT DEFAULT 'general',
    meal_dates TEXT DEFAULT '[]', -- JSON array of YYYY-MM-DD strings
    checked INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_items_normalized_label
ON shopping_items(normalized_label);

-- Event prep templates and checklist items
CREATE TABLE IF NOT EXISTS prep_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- title_keyword, event_type
    trigger_value TEXT NOT NULL,
    member_id INTEGER REFERENCES family_members(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prep_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES prep_templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
);
