const express = require('express');
const router = express.Router();
const db = require('../db/database');
const {
    normalizeLabel,
    inferCategory,
    getShoppingItems,
    upsertShoppingItemsFromMeals,
} = require('../lib/shoppingItems');

router.get('/', (req, res) => {
    try {
        res.json(getShoppingItems(db));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const {
            label,
            source = 'manual',
            category = null,
            mealDates = [],
            notes = '',
        } = req.body;

        if (!label?.trim()) {
            return res.status(400).json({ error: 'Label is required' });
        }

        const normalizedLabel = normalizeLabel(label);
        const result = db.prepare(`
            INSERT INTO shopping_items (
                label, normalized_label, source, category, meal_dates, checked, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(normalized_label) DO UPDATE SET
                label = excluded.label,
                source = excluded.source,
                category = excluded.category,
                meal_dates = excluded.meal_dates,
                notes = excluded.notes,
                updated_at = CURRENT_TIMESTAMP
        `).run(
            label.trim(),
            normalizedLabel,
            source,
            category || inferCategory(label),
            JSON.stringify(mealDates),
            notes
        );

        res.status(201).json({
            success: true,
            id: String(result.lastInsertRowid),
            ...getShoppingItems(db),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/generate', (req, res) => {
    try {
        const { start, end } = req.body;
        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates are required' });
        }

        const shopping = upsertShoppingItemsFromMeals(db, start, end);
        res.json({
            ...shopping,
            dateRange: { start, end },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id', (req, res) => {
    try {
        const current = db.prepare(`
            SELECT id, label, normalized_label, source, category, meal_dates, checked, notes
            FROM shopping_items
            WHERE id = ?
        `).get(req.params.id);

        if (!current) {
            return res.status(404).json({ error: 'Shopping item not found' });
        }

        const label = req.body.label?.trim() || current.label;
        const normalizedLabel = normalizeLabel(label);
        const source = req.body.source || current.source;
        const category = req.body.category || current.category;
        const mealDates = req.body.mealDates || JSON.parse(current.meal_dates || '[]');
        const checked = req.body.checked === undefined ? current.checked : (req.body.checked ? 1 : 0);
        const notes = req.body.notes === undefined ? current.notes : req.body.notes;

        db.prepare(`
            UPDATE shopping_items
            SET label = ?, normalized_label = ?, source = ?, category = ?, meal_dates = ?, checked = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            label,
            normalizedLabel,
            source,
            category,
            JSON.stringify(mealDates),
            checked,
            notes,
            req.params.id
        );

        res.json(getShoppingItems(db));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM shopping_items WHERE id = ?').run(req.params.id);
        res.json(getShoppingItems(db));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
