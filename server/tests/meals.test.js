const request = require('supertest');
const { app } = require('../app');

describe('Meals API', () => {
  describe('GET /api/meals', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/api/meals')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Meals API');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('mealTypes');
      expect(response.body.mealTypes).toContain('breakfast');
      expect(response.body.mealTypes).toContain('lunch');
      expect(response.body.mealTypes).toContain('dinner');
      expect(response.body.mealTypes).toContain('snack');
    });
  });

  describe('GET /api/meals/today', () => {
    it('should return today meals structure', async () => {
      const response = await request(app)
        .get('/api/meals/today')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('breakfast');
      expect(response.body).toHaveProperty('lunch');
      expect(response.body).toHaveProperty('dinner');
      expect(response.body).toHaveProperty('snack');
    });
  });

  describe('GET /api/meals/week', () => {
    it('should require start date parameter', async () => {
      const response = await request(app)
        .get('/api/meals/week')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return meals for a week', async () => {
      const startDate = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/api/meals/week?start=${startDate}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(typeof response.body).toBe('object');
    });
  });

  describe('POST /api/meals', () => {
    it('should require date parameter', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({ mealType: 'dinner' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should require valid meal type', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({ date: '2026-01-27', mealType: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should create a meal slot', async () => {
      const testDate = '2026-12-31'; // Use a future date to avoid conflicts

      const response = await request(app)
        .post('/api/meals')
        .send({
          date: testDate,
          mealType: 'dinner',
          recipeId: 1,
          recipeTitle: 'Test Recipe',
          recipeEmoji: '🍕',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('date', testDate);
      expect(response.body).toHaveProperty('mealType', 'dinner');

      // Clean up - delete the test meal
      await request(app).delete(`/api/meals/${testDate}/dinner`);
    });
  });

  describe('DELETE /api/meals/:date/:mealType', () => {
    it('should reject invalid meal types', async () => {
      const response = await request(app)
        .delete('/api/meals/2026-01-27/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should delete a meal slot', async () => {
      // First create a meal to delete
      const testDate = '2026-12-30';
      await request(app)
        .post('/api/meals')
        .send({
          date: testDate,
          mealType: 'lunch',
          recipeTitle: 'Test Lunch',
        });

      // Now delete it
      const response = await request(app)
        .delete(`/api/meals/${testDate}/lunch`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/meals/shopping-list', () => {
    it('should require start and end dates', async () => {
      const response = await request(app)
        .get('/api/meals/shopping-list')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return shopping list structure', async () => {
      const response = await request(app)
        .get('/api/meals/shopping-list?start=2026-01-01&end=2026-01-07')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('dateRange');
      expect(response.body).toHaveProperty('mealCount');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });
});
