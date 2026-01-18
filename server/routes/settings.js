const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Default settings
const defaultSettings = {
    darkMode: 'false',
    use24Hour: 'false',
    weeklyGoal: '500',
    weatherApiKey: '',
    location: '',
};

// GET all settings (filters sensitive data)
router.get('/', (req, res) => {
    try {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        const result = { ...defaultSettings };
        settings.forEach(s => {
            result[s.key] = s.value;
        });

        // Filter out sensitive data - never expose credentials
        const {
            paprika_credentials,
            google_tokens,
            ...safeSettings
        } = result;

        res.json(safeSettings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update settings
router.put('/', (req, res) => {
    try {
        const upsert = db.prepare(`
            INSERT INTO settings (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `);

        Object.entries(req.body).forEach(([key, value]) => {
            upsert.run(key, String(value));
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all family members
router.get('/family', (req, res) => {
    try {
        const members = db.prepare('SELECT id, name, color, points FROM family_members ORDER BY id').all();
        res.json(members.map(m => ({
            id: String(m.id),
            name: m.name,
            color: m.color,
            points: m.points,
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add family member
router.post('/family', (req, res) => {
    try {
        const { name, color } = req.body;
        const result = db.prepare('INSERT INTO family_members (name, color, points) VALUES (?, ?, 0)').run(name, color);
        res.status(201).json({ id: result.lastInsertRowid, name, color, points: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update family member
router.put('/family/:id', (req, res) => {
    try {
        const { name, color } = req.body;
        db.prepare('UPDATE family_members SET name = ?, color = ? WHERE id = ?').run(name, color, req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE family member (cascades to chores and events)
router.delete('/family/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM chores WHERE assigned_to = ?').run(req.params.id);
        db.prepare('DELETE FROM calendar_events WHERE member_id = ?').run(req.params.id);
        db.prepare('DELETE FROM family_members WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST reset database - clears all user data except settings and auth tokens
router.post('/reset-database', (req, res) => {
    try {
        // Use a transaction for atomic operation
        const reset = db.transaction(() => {
            // Clear user content tables
            db.prepare('DELETE FROM family_members').run();
            db.prepare('DELETE FROM chores').run();
            db.prepare('DELETE FROM calendar_events').run();
            db.prepare('DELETE FROM recipes').run();
            db.prepare('DELETE FROM meal_slots').run();
            db.prepare('DELETE FROM meal_history').run();
            db.prepare('DELETE FROM dinner_slots').run();
            db.prepare('DELETE FROM task_completions').run();

            // Reset SQLite sequences so IDs start fresh
            db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('family_members', 'chores', 'calendar_events', 'recipes', 'meal_slots', 'meal_history', 'dinner_slots', 'task_completions')").run();
        });

        reset();

        console.log('Database reset completed - all user data cleared');
        res.json({ success: true, message: 'Database reset successfully. All user data has been cleared.' });
    } catch (error) {
        console.error('Database reset failed:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
