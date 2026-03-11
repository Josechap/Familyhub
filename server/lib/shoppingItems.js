const normalizeLabel = (label) => String(label || '').trim().toLowerCase().replace(/\s+/g, ' ');

const inferCategory = (label) => {
    const value = normalizeLabel(label);
    if (!value) {
        return 'general';
    }

    if (/(milk|cheese|yogurt|butter|egg)/.test(value)) return 'dairy';
    if (/(apple|banana|lettuce|tomato|onion|spinach|pepper|pineapple|garlic)/.test(value)) return 'produce';
    if (/(chicken|pork|beef|turkey|fish)/.test(value)) return 'protein';
    if (/(bread|pasta|rice|tortilla|cereal|flour)/.test(value)) return 'pantry';
    return 'general';
};

const parseMealDates = (value) => {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const serializeItem = (row) => ({
    id: String(row.id),
    label: row.label,
    source: row.source,
    category: row.category,
    mealDates: parseMealDates(row.meal_dates),
    checked: Boolean(row.checked),
    notes: row.notes || '',
});

const getShoppingItems = (db) => {
    const rows = db.prepare(`
        SELECT id, label, source, category, meal_dates, checked, notes
        FROM shopping_items
        ORDER BY checked, category, label
    `).all();

    const items = rows.map(serializeItem);
    return {
        items,
        uncheckedCount: items.filter((item) => !item.checked).length,
    };
};

const collectMealPlanIngredients = (db, start, end) => {
    const meals = db.prepare(`
        SELECT date, recipe_id
        FROM meal_slots
        WHERE date >= ? AND date <= ?
          AND recipe_id IS NOT NULL
    `).all(start, end);

    const recipeIds = [...new Set(meals.map((meal) => meal.recipe_id).filter(Boolean))];
    if (recipeIds.length === 0) {
        return [];
    }

    const placeholders = recipeIds.map(() => '?').join(',');
    const recipes = db.prepare(`
        SELECT id, ingredients
        FROM recipes
        WHERE id IN (${placeholders})
    `).all(...recipeIds);

    const recipeById = new Map(recipes.map((recipe) => [recipe.id, recipe]));
    const aggregated = new Map();

    meals.forEach((meal) => {
        const recipe = recipeById.get(meal.recipe_id);
        if (!recipe?.ingredients) {
            return;
        }

        let ingredients = [];
        try {
            ingredients = JSON.parse(recipe.ingredients);
        } catch {
            ingredients = [];
        }

        ingredients.forEach((ingredient) => {
            const normalizedLabel = normalizeLabel(ingredient);
            if (!normalizedLabel) {
                return;
            }

            const existing = aggregated.get(normalizedLabel) || {
                label: ingredient,
                normalizedLabel,
                source: 'meal-plan',
                category: inferCategory(ingredient),
                mealDates: [],
            };

            if (!existing.mealDates.includes(meal.date)) {
                existing.mealDates.push(meal.date);
            }

            aggregated.set(normalizedLabel, existing);
        });
    });

    return [...aggregated.values()];
};

const upsertShoppingItemsFromMeals = (db, start, end) => {
    const generatedItems = collectMealPlanIngredients(db, start, end);
    const upsert = db.prepare(`
        INSERT INTO shopping_items (
            label, normalized_label, source, category, meal_dates, checked, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, '', CURRENT_TIMESTAMP)
        ON CONFLICT(normalized_label) DO UPDATE SET
            label = excluded.label,
            source = excluded.source,
            category = excluded.category,
            meal_dates = excluded.meal_dates,
            updated_at = CURRENT_TIMESTAMP
    `);

    const existingByLabel = new Map(
        db.prepare('SELECT normalized_label, meal_dates, checked, notes FROM shopping_items').all()
            .map((row) => [row.normalized_label, row])
    );

    const transaction = db.transaction(() => {
        generatedItems.forEach((item) => {
            const existing = existingByLabel.get(item.normalizedLabel);
            const mealDates = existing
                ? [...new Set([...parseMealDates(existing.meal_dates), ...item.mealDates])].sort()
                : item.mealDates.sort();

            upsert.run(
                item.label,
                item.normalizedLabel,
                item.source,
                item.category,
                JSON.stringify(mealDates)
            );

            if (existing) {
                db.prepare(`
                    UPDATE shopping_items
                    SET checked = ?, notes = ?
                    WHERE normalized_label = ?
                `).run(existing.checked, existing.notes, item.normalizedLabel);
            }
        });
    });

    transaction();
    return getShoppingItems(db);
};

module.exports = {
    normalizeLabel,
    inferCategory,
    getShoppingItems,
    upsertShoppingItemsFromMeals,
};
