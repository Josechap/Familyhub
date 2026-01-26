const request = require('supertest');
const { app } = require('../app');

describe('Calendar API', () => {
  describe('GET /api/calendar', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/api/calendar')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Calendar API');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/calendar/events', () => {
    it('should return an array of events', async () => {
      const response = await request(app)
        .get('/api/calendar/events')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return events with proper structure', async () => {
      const response = await request(app)
        .get('/api/calendar/events')
        .expect(200);

      if (response.body.length > 0) {
        const event = response.body[0];
        expect(event).toHaveProperty('id');
        expect(event).toHaveProperty('title');
        expect(event).toHaveProperty('date');
      }
    });
  });

  describe('GET /api/calendar/dinner', () => {
    it('should return an array of dinner slots', async () => {
      const response = await request(app)
        .get('/api/calendar/dinner')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/calendar/events', () => {
    it('should create a new event', async () => {
      const newEvent = {
        title: 'Test Event',
        date: '2026-01-27',
        startHour: 14,
        duration: 1,
        member: 'Dad',
        color: 'pastel-blue',
      };

      const response = await request(app)
        .post('/api/calendar/events')
        .send(newEvent)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });
});
