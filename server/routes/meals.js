const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Valid meal types
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// Migrate old dinner_slots to new meal_slots (run once on startup)
function migrateDinnerSlots() {
    try {
        const oldDinners = db.prepare('SELECT * FROM dinner_slots').all();
        const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO meal_slots (date, meal_type, recipe_id, recipe_title, recipe_emoji, recipe_photo, created_at)
            VALUES (?, 'dinner', ?, ?, ?, ?, ?)
        `);

        for (const dinner of oldDinners) {
            insertStmt.run(
                dinner.date,
                dinner.recipe_id,
                dinner.recipe_title,
                dinner.recipe_emoji,
                dinner.recipe_photo,
                dinner.created_at
            );
        }
    } catch (err) {
        console.log('Migration note:', err.message);
    }
}

// Run migration on module load
migrateDinnerSlots();

// GET /api/meals - Base route with usage info
router.get('/', (req, res) => {
    res.json({
        message: 'Meals API',
        endpoints: {
            week: 'GET /api/meals/week?start=YYYY-MM-DD',
            today: 'GET /api/meals/today',
            set: 'POST /api/meals',
            remove: 'DELETE /api/meals/:date/:mealType',
            shoppingList: 'GET /api/meals/shopping-list?start=YYYY-MM-DD&end=YYYY-MM-DD',
            history: 'GET /api/meals/history?start=YYYY-MM-DD&end=YYYY-MM-DD',
            complete: 'POST /api/meals/:date/:mealType/complete'
        },
        mealTypes: MEAL_TYPES
    });
});

// GET /week - Get planned meals for a week (grouped by date)
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
            `SELECT * FROM meal_slots WHERE date >= ? AND date <= ? ORDER BY date, meal_type`
        ).all(start, endStr);

        // Group by date and meal type
        const meals = {};
        for (const row of rows) {
            if (!meals[row.date]) {
                meals[row.date] = {};
            }
            meals[row.date][row.meal_type] = {
                id: row.id,
                recipeId: row.recipe_id,
                recipeTitle: row.recipe_title,
                recipeEmoji: row.recipe_emoji,
                recipePhoto: row.recipe_photo,
            };
        }

        res.json(meals);
    } catch (err) {
        console.error('Error fetching meals:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /today - Get today's planned meals (all meal types)
router.get('/today', (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        const rows = db.prepare(
            `SELECT * FROM meal_slots WHERE date = ?`
        ).all(today);

        // Group by meal type
        const meals = {
            breakfast: null,
            lunch: null,
            dinner: null,
            snack: null,
        };

        for (const row of rows) {
            meals[row.meal_type] = {
                id: row.id,
                recipeId: row.recipe_id,
                recipeTitle: row.recipe_title,
                recipeEmoji: row.recipe_emoji,
                recipePhoto: row.recipe_photo,
            };
        }

        res.json(meals);
    } catch (err) {
        console.error('Error fetching today meals:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST / - Assign a recipe to a date and meal type
router.post('/', (req, res) => {
    try {
        const { date, mealType, recipeId, recipeTitle, recipeEmoji, recipePhoto } = req.body;

        if (!date) {
            return res.status(400).json({ error: 'Date required' });
        }

        if (!mealType || !MEAL_TYPES.includes(mealType)) {
            return res.status(400).json({
                error: `Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`
            });
        }

        // Use INSERT OR REPLACE to handle existing entries
        const result = db.prepare(
            `INSERT OR REPLACE INTO meal_slots (date, meal_type, recipe_id, recipe_title, recipe_emoji, recipe_photo)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
            date,
            mealType,
            recipeId || null,
            recipeTitle || 'No Title',
            recipeEmoji || '🍽️',
            recipePhoto || null
        );

        res.json({
            success: true,
            id: result.lastInsertRowid,
            date,
            mealType,
            recipeTitle
        });
    } catch (err) {
        console.error('Error setting meal:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /:date/:mealType - Remove a specific meal from a date
router.delete('/:date/:mealType', (req, res) => {
    try {
        const { date, mealType } = req.params;

        if (!MEAL_TYPES.includes(mealType)) {
            return res.status(400).json({
                error: `Invalid meal type. Must be one of: ${MEAL_TYPES.join(', ')}`
            });
        }

        const result = db.prepare(
            `DELETE FROM meal_slots WHERE date = ? AND meal_type = ?`
        ).run(date, mealType);

        res.json({ success: true, deleted: result.changes > 0 });
    } catch (err) {
        console.error('Error removing meal:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /:date/:mealType/complete - Mark a meal as completed (add to history)
router.post('/:date/:mealType/complete', (req, res) => {
    try {
        const { date, mealType } = req.params;

        // Get the meal
        const meal = db.prepare(
            `SELECT * FROM meal_slots WHERE date = ? AND meal_type = ?`
        ).get(date, mealType);

        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        // Add to history
        db.prepare(
            `INSERT INTO meal_history (date, meal_type, recipe_id, recipe_title, recipe_emoji, recipe_photo)
             VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
            date,
            mealType,
            meal.recipe_id,
            meal.recipe_title,
            meal.recipe_emoji,
            meal.recipe_photo
        );

        res.json({ success: true, message: 'Meal marked as completed' });
    } catch (err) {
        console.error('Error completing meal:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /history - Get meal history
router.get('/history', (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates required' });
        }

        const rows = db.prepare(
            `SELECT * FROM meal_history
             WHERE date >= ? AND date <= ?
             ORDER BY completed_at DESC`
        ).all(start, end);

        res.json(rows);
    } catch (err) {
        console.error('Error fetching meal history:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /shopping-list - Generate shopping list from planned meals
router.get('/shopping-list', (req, res) => {
    try {
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Start and end dates required' });
        }

        // Get all meals in date range
        const meals = db.prepare(
            `SELECT * FROM meal_slots WHERE date >= ? AND date <= ?`
        ).all(start, end);

        // Get recipe IDs
        const recipeIds = [...new Set(meals.map(m => m.recipe_id).filter(Boolean))];

        if (recipeIds.length === 0) {
            return res.json({
                items: [],
                dateRange: { start, end },
                mealCount: 0
            });
        }

        // Get recipes with ingredients
        const placeholders = recipeIds.map(() => '?').join(',');
        const recipes = db.prepare(
            `SELECT id, title, ingredients FROM recipes WHERE id IN (${placeholders})`
        ).all(...recipeIds);

        // Aggregate ingredients
        const ingredientMap = {};
        let ingredientId = 1;

        for (const recipe of recipes) {
            if (!recipe.ingredients) continue;

            let ingredients = [];
            try {
                ingredients = JSON.parse(recipe.ingredients);
            } catch (err) {
                console.error(`Error parsing ingredients for recipe ${recipe.id}:`, err);
                continue;
            }

            for (const ingredient of ingredients) {
                const normalized = ingredient.toLowerCase().trim();
                if (!ingredientMap[normalized]) {
                    ingredientMap[normalized] = {
                        id: ingredientId++,
                        name: ingredient,
                        checked: false,
                        recipes: [recipe.title]
                    };
                } else {
                    if (!ingredientMap[normalized].recipes.includes(recipe.title)) {
                        ingredientMap[normalized].recipes.push(recipe.title);
                    }
                }
            }
        }

        const items = Object.values(ingredientMap).sort((a, b) =>
            a.name.localeCompare(b.name)
        );

        res.json({
            items,
            dateRange: { start, end },
            mealCount: meals.length
        });
    } catch (err) {
        console.error('Error generating shopping list:', err);
        res.status(500).json({ error: err.message });
    }
});

// Legacy endpoint for backward compatibility
// DELETE /:date - Remove dinner from a date (assumes mealType='dinner')
router.delete('/:date', (req, res) => {
    try {
        const { date } = req.params;

        const result = db.prepare(
            `DELETE FROM meal_slots WHERE date = ? AND meal_type = 'dinner'`
        ).run(date);

        res.json({ success: true, deleted: result.changes > 0 });
    } catch (err) {
        console.error('Error removing meal:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
