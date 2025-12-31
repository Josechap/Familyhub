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

// GET all settings
router.get('/', (req, res) => {
    try {
        const settings = db.prepare('SELECT key, value FROM settings').all();
        const result = { ...defaultSettings };
        settings.forEach(s => {
            result[s.key] = s.value;
        });
        res.json(result);
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

module.exports = router;
