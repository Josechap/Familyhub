const request = require('supertest');
const { app } = require('../app');

describe('Settings API', () => {
  describe('GET /api/settings', () => {
    it('should return settings object', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(typeof response.body).toBe('object');
    });

    it('should include default settings', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      // Default settings should be present
      expect(response.body).toHaveProperty('darkMode');
      expect(response.body).toHaveProperty('use24Hour');
      expect(response.body).toHaveProperty('weeklyGoal');
    });

    it('should not expose sensitive credentials', async () => {
      const response = await request(app)
        .get('/api/settings')
        .expect(200);

      // Ensure paprika credentials are not exposed
      expect(response.body).not.toHaveProperty('paprika_credentials');
      // Ensure google tokens are not directly exposed
      expect(response.body).not.toHaveProperty('google_tokens');
    });
  });

  describe('PUT /api/settings', () => {
    it('should update setting values', async () => {
      const testValue = 'test_value_' + Date.now();

      const response = await request(app)
        .put('/api/settings')
        .send({ test_setting: testValue })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify the setting was saved
      const getResponse = await request(app).get('/api/settings');
      expect(getResponse.body.test_setting).toBe(testValue);
    });

    it('should update multiple settings at once', async () => {
      const response = await request(app)
        .put('/api/settings')
        .send({
          darkMode: 'true',
          use24Hour: 'true',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify
      const getResponse = await request(app).get('/api/settings');
      expect(getResponse.body.darkMode).toBe('true');
      expect(getResponse.body.use24Hour).toBe('true');

      // Reset to defaults
      await request(app)
        .put('/api/settings')
        .send({ darkMode: 'false', use24Hour: 'false' });
    });
  });

  describe('GET /api/settings/family', () => {
    it('should return family members array', async () => {
      const response = await request(app)
        .get('/api/settings/family')
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

  describe('POST /api/settings/family', () => {
    let createdMemberId;

    it('should create a new family member', async () => {
      const response = await request(app)
        .post('/api/settings/family')
        .send({ name: 'Test Member', color: 'pastel-blue' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Member');
      expect(response.body).toHaveProperty('color', 'pastel-blue');
      expect(response.body).toHaveProperty('points', 0);

      createdMemberId = response.body.id;
    });

    afterAll(async () => {
      // Clean up - delete test member
      if (createdMemberId) {
        await request(app).delete(`/api/settings/family/${createdMemberId}`);
      }
    });
  });

  describe('PUT /api/settings/family/:id', () => {
    it('should update a family member', async () => {
      // First create a member to update
      const createResponse = await request(app)
        .post('/api/settings/family')
        .send({ name: 'Update Test', color: 'pastel-green' });

      const memberId = createResponse.body.id;

      // Update the member
      const response = await request(app)
        .put(`/api/settings/family/${memberId}`)
        .send({ name: 'Updated Name', color: 'pastel-pink' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Clean up
      await request(app).delete(`/api/settings/family/${memberId}`);
    });
  });

  describe('DELETE /api/settings/family/:id', () => {
    it('should delete a family member', async () => {
      // First create a member to delete
      const createResponse = await request(app)
        .post('/api/settings/family')
        .send({ name: 'Delete Test', color: 'pastel-yellow' });

      const memberId = createResponse.body.id;

      // Delete the member
      const response = await request(app)
        .delete(`/api/settings/family/${memberId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
