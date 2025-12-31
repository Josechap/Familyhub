const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all chores with family member names
router.get('/', (req, res) => {
    try {
        const chores = db.prepare(`
            SELECT c.id, c.title, c.points, c.completed, c.recurring,
                   fm.name as assigned_to, fm.color
            FROM chores c
            LEFT JOIN family_members fm ON c.assigned_to = fm.id
            ORDER BY c.completed, c.title
        `).all();

        const parsed = chores.map(c => ({
            id: String(c.id),
            title: c.title,
            points: c.points,
            completed: Boolean(c.completed),
            recurring: c.recurring,
            assignedTo: c.assigned_to,
            color: c.color,
        }));

        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT toggle chore completion
router.put('/:id/toggle', (req, res) => {
    try {
        // Get current state
        const chore = db.prepare('SELECT completed, points, assigned_to FROM chores WHERE id = ?').get(req.params.id);

        if (!chore) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        const newCompleted = chore.completed ? 0 : 1;
        const pointChange = newCompleted ? chore.points : -chore.points;

        // Update chore
        db.prepare('UPDATE chores SET completed = ? WHERE id = ?').run(newCompleted, req.params.id);

        // Update family member points
        db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?').run(pointChange, chore.assigned_to);

        res.json({ success: true, completed: Boolean(newCompleted) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create chore
router.post('/', (req, res) => {
    try {
        const { title, points, assignedTo, recurring } = req.body;

        // Get member ID from name
        const member = db.prepare('SELECT id FROM family_members WHERE name = ?').get(assignedTo);

        const result = db.prepare(`
            INSERT INTO chores (title, points, assigned_to, recurring)
            VALUES (?, ?, ?, ?)
        `).run(title, points || 10, member?.id, recurring || 'none');

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET family members with points
router.get('/family', (req, res) => {
    try {
        const members = db.prepare(`
            SELECT id, name, color, points FROM family_members ORDER BY points DESC
        `).all();

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

module.exports = router;
