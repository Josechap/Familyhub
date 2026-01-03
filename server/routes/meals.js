const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /week - Get planned meals for a week
router.get('/week', (req, res) => {
    try {
        const { start } = req.query;

        if (!start) {
            return res.status(400).json({ error: 'Start date required' });
        }

        // Calculate week end (7 days from start)
        const startDate = new Date(start);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        const endStr = endDate.toISOString().split('T')[0];

        const rows = db.prepare(
            `SELECT * FROM dinner_slots WHERE date >= ? AND date <= ? ORDER BY date`
        ).all(start, endStr);

        res.json(rows || []);
    } catch (err) {
        console.error('Error fetching meals:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /today - Get today's planned dinner
router.get('/today', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const row = db.prepare(
            `SELECT * FROM dinner_slots WHERE date = ?`
        ).get(today);

        res.json(row || null);
    } catch (err) {
        console.error('Error fetching today meal:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST / - Assign a recipe to a date
router.post('/', (req, res) => {
    try {
        const { date, recipeId, recipeTitle, recipeEmoji, recipePhoto } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Date required' });
        }

        // Use INSERT OR REPLACE to handle existing entries
        const result = db.prepare(
            `INSERT OR REPLACE INTO dinner_slots (date, recipe_id, recipe_title, recipe_emoji, recipe_photo) 
             VALUES (?, ?, ?, ?, ?)`
        ).run(date, recipeId || null, recipeTitle || 'No Title', recipeEmoji || '🍽️', recipePhoto || null);

        res.json({
            success: true,
            id: result.lastInsertRowid,
            date,
            recipeTitle
        });
    } catch (err) {
        console.error('Error setting meal:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:date - Remove a meal from a date
router.delete('/:date', (req, res) => {
    try {
        const { date } = req.params;

        const result = db.prepare(
            `DELETE FROM dinner_slots WHERE date = ?`
        ).run(date);

        res.json({ success: true, deleted: result.changes > 0 });
    } catch (err) {
        console.error('Error removing meal:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
