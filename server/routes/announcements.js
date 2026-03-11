const express = require('express');
const router = express.Router();
const db = require('../db/database');

const mapAnnouncement = (row) => ({
    id: String(row.id),
    title: row.title,
    body: row.body,
    memberId: row.member_id ? String(row.member_id) : null,
    memberName: row.member_name || null,
    priority: row.priority,
    startAt: row.start_at,
    expiresAt: row.expires_at,
    dismissedAt: row.dismissed_at,
});

router.get('/', (req, res) => {
    try {
        const { active, memberId } = req.query;
        const now = new Date().toISOString();
        const clauses = [];
        const params = [];

        if (active === '1' || active === 'true') {
            clauses.push('datetime(start_at) <= datetime(?)');
            clauses.push('(expires_at IS NULL OR datetime(expires_at) >= datetime(?))');
            clauses.push('dismissed_at IS NULL');
            params.push(now, now);
        }

        if (memberId) {
            clauses.push('(member_id IS NULL OR member_id = ?)');
            params.push(memberId);
        }

        const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        const rows = db.prepare(`
            SELECT a.*, fm.name AS member_name
            FROM announcements a
            LEFT JOIN family_members fm ON a.member_id = fm.id
            ${whereClause}
            ORDER BY
                CASE a.priority
                    WHEN 'high' THEN 0
                    WHEN 'normal' THEN 1
                    ELSE 2
                END,
                datetime(a.start_at) DESC
        `).all(...params);

        res.json(rows.map(mapAnnouncement));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const {
            title,
            body,
            memberId = null,
            priority = 'normal',
            startAt = new Date().toISOString(),
            expiresAt = null,
        } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const result = db.prepare(`
            INSERT INTO announcements (title, body, member_id, priority, start_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(title.trim(), body.trim(), memberId, priority, startAt, expiresAt);

        const created = db.prepare(`
            SELECT a.*, fm.name AS member_name
            FROM announcements a
            LEFT JOIN family_members fm ON a.member_id = fm.id
            WHERE a.id = ?
        `).get(result.lastInsertRowid);

        res.status(201).json(mapAnnouncement(created));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const {
            title,
            body,
            memberId = null,
            priority = 'normal',
            startAt,
            expiresAt = null,
            dismissedAt = null,
        } = req.body;

        db.prepare(`
            UPDATE announcements
            SET title = ?, body = ?, member_id = ?, priority = ?, start_at = ?, expires_at = ?, dismissed_at = ?
            WHERE id = ?
        `).run(title.trim(), body.trim(), memberId, priority, startAt, expiresAt, dismissedAt, req.params.id);

        const updated = db.prepare(`
            SELECT a.*, fm.name AS member_name
            FROM announcements a
            LEFT JOIN family_members fm ON a.member_id = fm.id
            WHERE a.id = ?
        `).get(req.params.id);

        res.json(mapAnnouncement(updated));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/:id/dismiss', (req, res) => {
    try {
        const dismissedAt = new Date().toISOString();
        db.prepare('UPDATE announcements SET dismissed_at = ? WHERE id = ?').run(dismissedAt, req.params.id);
        res.json({ success: true, dismissedAt });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
