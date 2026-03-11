const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { getPrepTemplates } = require('../lib/prepTemplates');

const createPrepTemplate = (payload) => {
    const {
        title,
        triggerType,
        triggerValue,
        memberId = null,
        items = [],
    } = payload;

    if (!title || !triggerType || !triggerValue) {
        throw new Error('Title, triggerType, and triggerValue are required');
    }

    const transaction = db.transaction(() => {
        const templateResult = db.prepare(`
            INSERT INTO prep_templates (title, trigger_type, trigger_value, member_id)
            VALUES (?, ?, ?, ?)
        `).run(title.trim(), triggerType, triggerValue.trim().toLowerCase(), memberId);

        const insertItem = db.prepare(`
            INSERT INTO prep_items (template_id, label, sort_order)
            VALUES (?, ?, ?)
        `);

        items
            .filter((item) => item?.label?.trim())
            .forEach((item, index) => {
                insertItem.run(templateResult.lastInsertRowid, item.label.trim(), item.sortOrder ?? index + 1);
            });

        return templateResult.lastInsertRowid;
    });

    return transaction();
};

router.get('/', (req, res) => {
    try {
        res.json(getPrepTemplates(db));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const templateId = createPrepTemplate(req.body);
        const created = getPrepTemplates(db).find((template) => template.id === String(templateId));
        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const {
            title,
            triggerType,
            triggerValue,
            memberId = null,
            items = [],
        } = req.body;

        const transaction = db.transaction(() => {
            db.prepare(`
                UPDATE prep_templates
                SET title = ?, trigger_type = ?, trigger_value = ?, member_id = ?
                WHERE id = ?
            `).run(title.trim(), triggerType, triggerValue.trim().toLowerCase(), memberId, req.params.id);

            db.prepare('DELETE FROM prep_items WHERE template_id = ?').run(req.params.id);

            const insertItem = db.prepare(`
                INSERT INTO prep_items (template_id, label, sort_order)
                VALUES (?, ?, ?)
            `);

            items
                .filter((item) => item?.label?.trim())
                .forEach((item, index) => {
                    insertItem.run(req.params.id, item.label.trim(), item.sortOrder ?? index + 1);
                });
        });

        transaction();

        const updated = getPrepTemplates(db).find((template) => template.id === String(req.params.id));
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM prep_templates WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
