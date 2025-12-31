const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all calendar events
router.get('/events', (req, res) => {
    try {
        const events = db.prepare(`
            SELECT e.id, e.title, e.date, e.start_hour, e.duration, e.color,
                   fm.name as member
            FROM calendar_events e
            LEFT JOIN family_members fm ON e.member_id = fm.id
            ORDER BY e.date, e.start_hour
        `).all();

        const parsed = events.map(e => ({
            id: String(e.id),
            title: e.title,
            date: e.date,
            startHour: e.start_hour,
            duration: e.duration,
            color: e.color,
            member: e.member,
        }));

        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create event
router.post('/events', (req, res) => {
    try {
        const { title, date, startHour, duration, member, color } = req.body;

        // Get member ID
        const memberRecord = db.prepare('SELECT id FROM family_members WHERE name = ?').get(member);

        const result = db.prepare(`
            INSERT INTO calendar_events (title, date, start_hour, duration, member_id, color)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title, date, startHour, duration, memberRecord?.id, color);

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET dinner slots
router.get('/dinner', (req, res) => {
    try {
        const dinners = db.prepare(`
            SELECT id, date, recipe_id, recipe_title FROM dinner_slots ORDER BY date
        `).all();

        res.json(dinners.map(d => ({
            id: String(d.id),
            date: d.date,
            recipeId: d.recipe_id,
            recipe: d.recipe_title,
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT set dinner for a date
router.put('/dinner/:date', (req, res) => {
    try {
        const { recipeId, recipeTitle } = req.body;

        // Upsert dinner slot
        db.prepare(`
            INSERT INTO dinner_slots (date, recipe_id, recipe_title)
            VALUES (?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                recipe_id = excluded.recipe_id,
                recipe_title = excluded.recipe_title
        `).run(req.params.date, recipeId, recipeTitle);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
