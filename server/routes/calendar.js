const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { attachPrepMatches } = require('../lib/prepTemplates');

const getLocalCalendarEvents = () => {
    const events = db.prepare(`
        SELECT
            e.id,
            e.title,
            e.date,
            e.start_hour,
            e.duration,
            e.color,
            e.event_type,
            fm.id AS member_id,
            fm.name AS member
        FROM calendar_events e
        LEFT JOIN family_members fm ON e.member_id = fm.id
        ORDER BY e.date, e.start_hour
    `).all();

    return attachPrepMatches(db, events.map((event) => ({
        id: String(event.id),
        title: event.title,
        date: event.date,
        startHour: event.start_hour,
        duration: event.duration,
        color: event.color,
        eventType: event.event_type || 'general',
        member: event.member,
        memberId: event.member_id ? String(event.member_id) : null,
        source: 'local',
    })));
};

router.get('/', (req, res) => {
    res.json({
        message: 'Calendar API',
        endpoints: {
            events: 'GET /api/calendar/events',
            dinner: 'GET /api/calendar/dinner',
        },
    });
});

router.get('/events', (req, res) => {
    try {
        res.json(getLocalCalendarEvents());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/events', (req, res) => {
    try {
        const {
            title,
            date,
            startHour,
            duration,
            member,
            memberId,
            color,
            eventType = 'general',
        } = req.body;

        if (!title || !date) {
            return res.status(400).json({ error: 'Title and date are required' });
        }

        const memberRecord = memberId
            ? db.prepare('SELECT id FROM family_members WHERE id = ?').get(memberId)
            : db.prepare('SELECT id FROM family_members WHERE name = ?').get(member);

        const result = db.prepare(`
            INSERT INTO calendar_events (title, date, start_hour, duration, member_id, color, event_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(title, date, startHour, duration, memberRecord?.id || null, color, eventType);

        res.status(201).json({ id: String(result.lastInsertRowid) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/dinner', (req, res) => {
    try {
        const dinners = db.prepare(`
            SELECT id, date, recipe_id, recipe_title, recipe_emoji
            FROM dinner_slots
            ORDER BY date
        `).all();

        res.json(dinners.map((dinner) => ({
            id: String(dinner.id),
            date: dinner.date,
            recipeId: dinner.recipe_id,
            recipe: dinner.recipe_title,
            emoji: dinner.recipe_emoji || '🍽️',
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/dinner/:date', (req, res) => {
    try {
        const { recipeId, recipeTitle, recipeEmoji = '🍽️', recipePhoto = null } = req.body;
        db.prepare(`
            INSERT INTO dinner_slots (date, recipe_id, recipe_title, recipe_emoji, recipe_photo)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(date) DO UPDATE SET
                recipe_id = excluded.recipe_id,
                recipe_title = excluded.recipe_title,
                recipe_emoji = excluded.recipe_emoji,
                recipe_photo = excluded.recipe_photo
        `).run(req.params.date, recipeId, recipeTitle, recipeEmoji, recipePhoto);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
