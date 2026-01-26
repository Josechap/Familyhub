const request = require('supertest');
const { app } = require('../app');

describe('Tasks API', () => {
  describe('GET /api/tasks', () => {
    it('should return an array of tasks/chores', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include task properties', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      if (response.body.length > 0) {
        const task = response.body[0];
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('points');
        expect(task).toHaveProperty('completed');
      }
    });
  });

  describe('GET /api/tasks/family', () => {
    it('should return family members array', async () => {
      const response = await request(app)
        .get('/api/tasks/family')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const member = response.body[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('color');
        expect(member).toHaveProperty('points');
      }
    });
  });

  describe('PUT /api/tasks/:id/toggle', () => {
    it('should toggle task completion status', async () => {
      // Get tasks first
      const tasksResponse = await request(app).get('/api/tasks');
      const chores = tasksResponse.body;

      if (chores.length > 0) {
        const taskId = chores[0].id;
        const originalCompleted = chores[0].completed;

        const response = await request(app)
          .put(`/api/tasks/${taskId}/toggle`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('completed');
        expect(response.body.completed).toBe(!originalCompleted);

        // Toggle back to restore state
        await request(app).put(`/api/tasks/${taskId}/toggle`);
      }
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/api/tasks/99999/toggle')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tasks/analytics/weekly', () => {
    it('should return weekly stats with weekStart and stats', async () => {
      const response = await request(app)
        .get('/api/tasks/analytics/weekly')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('weekStart');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.stats)).toBe(true);

      // Verify stats structure if there are any
      if (response.body.stats.length > 0) {
        const memberStat = response.body.stats[0];
        expect(memberStat).toHaveProperty('id');
        expect(memberStat).toHaveProperty('name');
        expect(memberStat).toHaveProperty('weeklyTasksCompleted');
        expect(memberStat).toHaveProperty('weeklyPointsEarned');
      }
    });
  });

  describe('GET /api/tasks/analytics/daily', () => {
    it('should return daily stats with days parameter', async () => {
      const response = await request(app)
        .get('/api/tasks/analytics/daily?days=7')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/tasks/analytics/history', () => {
    it('should return task completion history', async () => {
      const response = await request(app)
        .get('/api/tasks/analytics/history?days=7')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
