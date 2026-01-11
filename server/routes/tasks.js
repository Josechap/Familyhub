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
        // Get current state with chore title and member info
        const chore = db.prepare(`
            SELECT c.id, c.title, c.completed, c.points, c.assigned_to, fm.name as member_name
            FROM chores c
            LEFT JOIN family_members fm ON c.assigned_to = fm.id
            WHERE c.id = ?
        `).get(req.params.id);

        if (!chore) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        const newCompleted = chore.completed ? 0 : 1;
        const pointChange = newCompleted ? chore.points : -chore.points;

        // Update chore
        db.prepare('UPDATE chores SET completed = ? WHERE id = ?').run(newCompleted, req.params.id);

        // Update family member points
        db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?').run(pointChange, chore.assigned_to);

        // Log completion to history if marking as completed
        if (newCompleted && chore.assigned_to) {
            db.prepare(`
                INSERT INTO task_completions (member_id, member_name, task_title, task_source, points_earned)
                VALUES (?, ?, ?, 'local', ?)
            `).run(chore.assigned_to, chore.member_name || 'Unknown', chore.title, chore.points);
        }

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
        `).run(title, points || 1, member?.id, recurring || 'none');

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

// GET weekly task stats per member
router.get('/analytics/weekly', (req, res) => {
    try {
        // Get start of current week (Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        // Get completions this week per member
        const weeklyStats = db.prepare(`
            SELECT
                member_id,
                member_name,
                COUNT(*) as tasks_completed,
                SUM(points_earned) as points_earned
            FROM task_completions
            WHERE date(completed_at) >= date(?)
            GROUP BY member_id, member_name
            ORDER BY tasks_completed DESC
        `).all(weekStartStr);

        // Get family members to include those with 0 completions
        const members = db.prepare('SELECT id, name, color, points FROM family_members').all();

        const stats = members.map(m => {
            const memberStats = weeklyStats.find(s => String(s.member_id) === String(m.id)) || {
                tasks_completed: 0,
                points_earned: 0
            };
            return {
                id: String(m.id),
                name: m.name,
                color: m.color,
                totalPoints: m.points,
                weeklyTasksCompleted: memberStats.tasks_completed,
                weeklyPointsEarned: memberStats.points_earned || 0
            };
        });

        res.json({
            weekStart: weekStartStr,
            stats: stats.sort((a, b) => b.weeklyTasksCompleted - a.weeklyTasksCompleted)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET task completion history
router.get('/analytics/history', (req, res) => {
    try {
        const { days = 7, memberId } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        const startDate = daysAgo.toISOString().split('T')[0];

        let query = `
            SELECT
                id, member_id, member_name, task_title, task_source, points_earned,
                datetime(completed_at) as completed_at
            FROM task_completions
            WHERE date(completed_at) >= date(?)
        `;
        const params = [startDate];

        if (memberId) {
            query += ' AND member_id = ?';
            params.push(memberId);
        }

        query += ' ORDER BY completed_at DESC LIMIT 100';

        const history = db.prepare(query).all(...params);

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET daily completion counts for chart
router.get('/analytics/daily', (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days));
        const startDate = daysAgo.toISOString().split('T')[0];

        const dailyStats = db.prepare(`
            SELECT
                date(completed_at) as date,
                member_name,
                COUNT(*) as count,
                SUM(points_earned) as points
            FROM task_completions
            WHERE date(completed_at) >= date(?)
            GROUP BY date(completed_at), member_name
            ORDER BY date(completed_at)
        `).all(startDate);

        res.json(dailyStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
