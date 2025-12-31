const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all recipes
router.get('/', (req, res) => {
    try {
        const recipes = db.prepare(`
            SELECT id, title, emoji, prep_time, cook_time, servings, category, is_favorite, ingredients, steps
            FROM recipes
            ORDER BY title
        `).all();

        // Parse JSON fields
        const parsed = recipes.map(r => ({
            ...r,
            prepTime: r.prep_time,
            cookTime: r.cook_time,
            isFavorite: Boolean(r.is_favorite),
            ingredients: JSON.parse(r.ingredients || '[]'),
            steps: JSON.parse(r.steps || '[]'),
        }));

        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single recipe
router.get('/:id', (req, res) => {
    try {
        const recipe = db.prepare(`
            SELECT id, title, emoji, prep_time, cook_time, servings, category, is_favorite, ingredients, steps
            FROM recipes WHERE id = ?
        `).get(req.params.id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        res.json({
            ...recipe,
            prepTime: recipe.prep_time,
            cookTime: recipe.cook_time,
            isFavorite: Boolean(recipe.is_favorite),
            ingredients: JSON.parse(recipe.ingredients || '[]'),
            steps: JSON.parse(recipe.steps || '[]'),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create recipe
router.post('/', (req, res) => {
    try {
        const { title, emoji, prepTime, cookTime, servings, category, ingredients, steps } = req.body;

        const result = db.prepare(`
            INSERT INTO recipes (title, emoji, prep_time, cook_time, servings, category, ingredients, steps)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(title, emoji, prepTime, cookTime, servings, category, JSON.stringify(ingredients), JSON.stringify(steps));

        res.status(201).json({ id: result.lastInsertRowid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update recipe
router.put('/:id', (req, res) => {
    try {
        const { title, emoji, prepTime, cookTime, servings, category, isFavorite, ingredients, steps } = req.body;

        db.prepare(`
            UPDATE recipes SET
                title = COALESCE(?, title),
                emoji = COALESCE(?, emoji),
                prep_time = COALESCE(?, prep_time),
                cook_time = COALESCE(?, cook_time),
                servings = COALESCE(?, servings),
                category = COALESCE(?, category),
                is_favorite = COALESCE(?, is_favorite),
                ingredients = COALESCE(?, ingredients),
                steps = COALESCE(?, steps)
            WHERE id = ?
        `).run(title, emoji, prepTime, cookTime, servings, category, isFavorite ? 1 : 0,
            ingredients ? JSON.stringify(ingredients) : null,
            steps ? JSON.stringify(steps) : null, req.params.id);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT toggle favorite
router.put('/:id/favorite', (req, res) => {
    try {
        db.prepare('UPDATE recipes SET is_favorite = NOT is_favorite WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE recipe
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
