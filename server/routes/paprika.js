const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Paprika API base URL
const PAPRIKA_API = 'https://www.paprikaapp.com/api/v2';

// Get stored credentials
const getCredentials = () => {
    try {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('paprika_credentials');
        if (row) {
            return JSON.parse(row.value);
        }
    } catch (error) {
        console.error('Error getting Paprika credentials:', error);
    }
    return null;
};

// Save credentials with token
const saveCredentials = (email, password, token) => {
    const credentials = JSON.stringify({ email, password, token });
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('paprika_credentials', credentials);
};

// Clear credentials
const clearCredentials = () => {
    db.prepare('DELETE FROM settings WHERE key = ?').run('paprika_credentials');
};

// POST /connect - Connect to Paprika with credentials
router.post('/connect', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Login to get token - Paprika requires specific User-Agent
        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('password', password);

        const loginResponse = await fetch(`${PAPRIKA_API}/account/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Paprika/3.0.0 (iOS)',
            },
            body: formData.toString(),
        });

        const loginData = await loginResponse.json();
        console.log('Paprika login response:', loginResponse.status, loginData);

        if (!loginResponse.ok || loginData.error) {
            return res.status(401).json({ error: loginData.error?.message || 'Invalid credentials' });
        }

        const token = loginData.result?.token;
        if (!token) {
            return res.status(401).json({ error: 'No token received from Paprika' });
        }

        saveCredentials(email, password, token);
        res.json({ success: true, message: 'Connected to Paprika' });
    } catch (error) {
        console.error('Paprika connect error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /status - Check connection status
router.get('/status', async (req, res) => {
    try {
        const credentials = getCredentials();
        if (!credentials || !credentials.token) {
            return res.json({ connected: false });
        }

        // Verify token still works
        const response = await fetch(`${PAPRIKA_API}/sync/recipes/`, {
            headers: {
                'Authorization': `Bearer ${credentials.token}`,
                'User-Agent': 'Paprika/3.0.0 (iOS)',
            },
        });

        if (!response.ok) {
            return res.json({ connected: false, error: 'Token expired' });
        }

        res.json({ connected: true, email: credentials.email });
    } catch (error) {
        res.json({ connected: false, error: error.message });
    }
});

// GET /recipes - Fetch all recipes from Paprika
router.get('/recipes', async (req, res) => {
    try {
        const credentials = getCredentials();
        if (!credentials || !credentials.token) {
            return res.status(401).json({ error: 'Not connected to Paprika' });
        }

        const headers = {
            'Authorization': `Bearer ${credentials.token}`,
            'User-Agent': 'Paprika/3.0.0 (iOS)',
        };

        // Get all recipe UIDs
        const listResponse = await fetch(`${PAPRIKA_API}/sync/recipes/`, { headers });

        if (!listResponse.ok) {
            return res.status(401).json({ error: 'Paprika authentication failed' });
        }

        const recipeList = await listResponse.json();
        const recipeUIDs = recipeList.result || [];

        // Fetch full details for each recipe (limit to 50 for performance)
        const recipes = [];
        const limitedUIDs = recipeUIDs.slice(0, 50);

        for (const item of limitedUIDs) {
            const uid = item.uid;
            try {
                const recipeResponse = await fetch(`${PAPRIKA_API}/sync/recipe/${uid}/`, { headers });

                if (recipeResponse.ok) {
                    const recipeData = await recipeResponse.json();
                    const r = recipeData.result;

                    // Build photo URL if recipe has an image
                    let photoUrl = null;
                    if (r.photo_hash || r.photo) {
                        photoUrl = r.photo_url || `${PAPRIKA_API}/sync/recipe/${uid}/photo/`;
                    }

                    recipes.push({
                        id: `paprika-${r.uid}`,
                        uid: r.uid,
                        title: r.name,
                        description: r.description || '',
                        prepTime: r.prep_time || '',
                        cookTime: r.cook_time || '',
                        totalTime: r.total_time || '',
                        servings: r.servings || '',
                        source: r.source || '',
                        sourceUrl: r.source_url || '',
                        ingredients: r.ingredients || '',
                        directions: r.directions || '',
                        notes: r.notes || '',
                        categories: r.categories || [],
                        rating: r.rating || 0,
                        isFavorite: r.on_favorites || false,
                        photoUrl: photoUrl,
                        hasPhoto: !!photoUrl,
                        paprikaSource: true,
                    });
                }
            } catch (error) {
                console.error(`Error fetching recipe ${uid}:`, error);
            }
        }

        res.json({ recipes, total: recipeUIDs.length, fetched: recipes.length });
    } catch (error) {
        console.error('Paprika recipes fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /disconnect - Remove Paprika connection
router.post('/disconnect', (req, res) => {
    try {
        clearCredentials();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
