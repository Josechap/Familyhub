const request = require('supertest');
const { app } = require('../app');

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
    });

    it('should indicate test environment', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.environment).toBe('test');
    });
  });
});
