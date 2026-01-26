const request = require('supertest');
const { app } = require('../app');

describe('Recipes API', () => {
  describe('GET /api/recipes', () => {
    it('should return an array of recipes', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include recipe properties', async () => {
      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      if (response.body.length > 0) {
        const recipe = response.body[0];
        expect(recipe).toHaveProperty('id');
        expect(recipe).toHaveProperty('title');
        expect(recipe).toHaveProperty('isFavorite');
      }
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('should return 404 for non-existent recipe', async () => {
      const response = await request(app)
        .get('/api/recipes/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return a specific recipe by ID', async () => {
      // First get all recipes to find a valid ID
      const allRecipes = await request(app).get('/api/recipes');

      if (allRecipes.body.length > 0) {
        const recipeId = allRecipes.body[0].id;
        const response = await request(app)
          .get(`/api/recipes/${recipeId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', recipeId);
        expect(response.body).toHaveProperty('title');
      }
    });
  });

  describe('PUT /api/recipes/:id/favorite', () => {
    it('should toggle favorite and return success', async () => {
      // Get a recipe first
      const allRecipes = await request(app).get('/api/recipes');

      if (allRecipes.body.length > 0) {
        const recipeId = allRecipes.body[0].id;

        const response = await request(app)
          .put(`/api/recipes/${recipeId}/favorite`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);

        // Toggle back to restore original state
        await request(app).put(`/api/recipes/${recipeId}/favorite`);
      }
    });
  });
});
