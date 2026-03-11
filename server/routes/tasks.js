const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getWeekStartKey, refreshRoutineTask } = require('../lib/familyOps');

const selectTasks = () => db.prepare(`
    SELECT
        c.id,
        c.title,
        c.points,
        c.completed,
        c.recurring,
        c.schedule_type,
        c.days_of_week,
        c.due_time,
        c.cycle_key,
        c.active,
        c.assigned_to,
        fm.id AS member_id,
        fm.name AS assigned_name,
        fm.color
    FROM chores c
    LEFT JOIN family_members fm ON c.assigned_to = fm.id
    ORDER BY c.completed, c.title
`).all();

const mapTask = (task) => ({
    id: String(task.id),
    title: task.title,
    points: task.points,
    completed: Boolean(task.completed),
    recurring: task.recurring,
    scheduleType: task.scheduleType,
    daysOfWeek: task.daysOfWeek,
    dueTime: task.dueTime,
    cycleKey: task.cycleKey,
    active: Boolean(task.active),
    assignedTo: task.assigned_name,
    assignedMemberId: task.member_id ? String(task.member_id) : null,
    color: task.color,
    dueToday: task.dueToday,
    dueThisWeek: task.dueThisWeek,
    isRoutine: task.isRoutine,
});

const getHydratedTasks = (now = new Date()) => {
    const rawTasks = selectTasks();
    const transaction = db.transaction((tasks) => tasks.map((task) => refreshRoutineTask(db, task, now)));
    return transaction(rawTasks);
};

router.get('/', (req, res) => {
    try {
        const tasks = getHydratedTasks();
        res.json(tasks.map(mapTask));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/toggle', (req, res) => {
    try {
        const rawTask = db.prepare(`
            SELECT
                c.id,
                c.title,
                c.points,
                c.completed,
                c.recurring,
                c.schedule_type,
                c.days_of_week,
                c.due_time,
                c.cycle_key,
                c.active,
                c.assigned_to,
                fm.id AS member_id,
                fm.name AS member_name,
                fm.color
            FROM chores c
            LEFT JOIN family_members fm ON c.assigned_to = fm.id
            WHERE c.id = ?
        `).get(req.params.id);

        if (!rawTask) {
            return res.status(404).json({ error: 'Chore not found' });
        }

        const task = refreshRoutineTask(db, rawTask);
        const newCompleted = task.completed ? 0 : 1;
        const pointChange = newCompleted ? task.points : -task.points;

        db.prepare('UPDATE chores SET completed = ?, cycle_key = ? WHERE id = ?').run(newCompleted, task.cycleKey, req.params.id);

        if (task.assigned_to) {
            db.prepare('UPDATE family_members SET points = points + ? WHERE id = ?').run(pointChange, task.assigned_to);
        }

        if (task.assigned_to && task.cycleKey) {
            if (newCompleted) {
                const existingCompletion = db.prepare(`
                    SELECT id
                    FROM task_completions
                    WHERE task_source = 'local' AND task_id = ? AND cycle_key = ?
                `).get(String(task.id), task.cycleKey);

                if (!existingCompletion) {
                    db.prepare(`
                        INSERT INTO task_completions (
                            member_id, member_name, task_title, task_source, task_id, cycle_key, points_earned
                        ) VALUES (?, ?, ?, 'local', ?, ?, ?)
                    `).run(task.assigned_to, rawTask.member_name || 'Unknown', task.title, String(task.id), task.cycleKey, task.points);
                }
            } else {
                db.prepare(`
                    DELETE FROM task_completions
                    WHERE task_source = 'local' AND task_id = ? AND cycle_key = ?
                `).run(String(task.id), task.cycleKey);
            }
        }

        res.json({ success: true, completed: Boolean(newCompleted), cycleKey: task.cycleKey });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const {
            title,
            points = 1,
            assignedTo,
            assignedMemberId,
            recurring = 'none',
            scheduleType = null,
            daysOfWeek = [],
            dueTime = null,
            active = true,
        } = req.body;

        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const member = assignedMemberId
            ? db.prepare('SELECT id FROM family_members WHERE id = ?').get(assignedMemberId)
            : db.prepare('SELECT id FROM family_members WHERE name = ?').get(assignedTo);

        const resolvedScheduleType = scheduleType || (
            recurring === 'daily' || recurring === 'weekly' ? recurring : 'manual'
        );

        const cycleKey = resolvedScheduleType === 'manual' ? null : (
            resolvedScheduleType === 'daily' ? new Date().toISOString().split('T')[0] : getWeekStartKey()
        );

        const result = db.prepare(`
            INSERT INTO chores (
                title, points, assigned_to, recurring, schedule_type, days_of_week, due_time, cycle_key, active, completed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `).run(
            title.trim(),
            points,
            member?.id || null,
            recurring,
            resolvedScheduleType,
            JSON.stringify(daysOfWeek),
            dueTime,
            cycleKey,
            active ? 1 : 0
        );

        res.status(201).json({ id: String(result.lastInsertRowid) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM task_completions WHERE task_source = ? AND task_id = ?').run('local', String(req.params.id));
        db.prepare('DELETE FROM chores WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/family', (req, res) => {
    try {
        const members = db.prepare(`
            SELECT id, name, color, points FROM family_members ORDER BY points DESC
        `).all();

        res.json(members.map((member) => ({
            id: String(member.id),
            name: member.name,
            color: member.color,
            points: member.points,
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analytics/weekly', (req, res) => {
    try {
        const weekStartStr = getWeekStartKey();

        const weeklyStats = db.prepare(`
            SELECT
                member_id,
                member_name,
                COUNT(*) AS tasks_completed,
                SUM(points_earned) AS points_earned
            FROM task_completions
            WHERE date(completed_at) >= date(?)
            GROUP BY member_id, member_name
            ORDER BY tasks_completed DESC
        `).all(weekStartStr);

        const members = db.prepare('SELECT id, name, color, points FROM family_members').all();
        const stats = members.map((member) => {
            const memberStats = weeklyStats.find((stat) => String(stat.member_id) === String(member.id)) || {
                tasks_completed: 0,
                points_earned: 0,
            };

            return {
                id: String(member.id),
                name: member.name,
                color: member.color,
                totalPoints: member.points,
                weeklyTasksCompleted: memberStats.tasks_completed,
                weeklyPointsEarned: memberStats.points_earned || 0,
            };
        });

        res.json({
            weekStart: weekStartStr,
            stats: stats.sort((a, b) => b.weeklyTasksCompleted - a.weeklyTasksCompleted),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analytics/history', (req, res) => {
    try {
        const { days = 7, memberId } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));
        const startDate = daysAgo.toISOString().split('T')[0];

        let query = `
            SELECT
                id,
                member_id,
                member_name,
                task_title,
                task_source,
                task_id,
                cycle_key,
                points_earned,
                datetime(completed_at) AS completed_at
            FROM task_completions
            WHERE date(completed_at) >= date(?)
        `;
        const params = [startDate];

        if (memberId) {
            query += ' AND member_id = ?';
            params.push(memberId);
        }

        query += ' ORDER BY completed_at DESC LIMIT 100';
        res.json(db.prepare(query).all(...params));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/analytics/daily', (req, res) => {
    try {
        const { days = 7 } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(days, 10));
        const startDate = daysAgo.toISOString().split('T')[0];

        const dailyStats = db.prepare(`
            SELECT
                date(completed_at) AS date,
                member_name,
                COUNT(*) AS count,
                SUM(points_earned) AS points
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
