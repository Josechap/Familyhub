const request = require('supertest');
const { app } = require('../app');

describe('Frontend API route contract', () => {
  it('serves the dashboard today aggregate used by Dashboard and Screensaver', async () => {
    const response = await request(app)
      .get('/api/dashboard/today')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('date');
    expect(response.body).toHaveProperty('todayEvents');
    expect(response.body).toHaveProperty('nextEvents');
    expect(response.body).toHaveProperty('todayMeals');
    expect(response.body).toHaveProperty('dueRoutines');
    expect(response.body).toHaveProperty('announcements');
    expect(response.body).toHaveProperty('prepAgenda');
    expect(response.body).toHaveProperty('shopping');
    expect(response.body).toHaveProperty('integrations');
    expect(response.body.integrations).toHaveProperty('googleCalendar');
    expect(response.body.integrations).toHaveProperty('googleTasks');
    expect(Array.isArray(response.body.todayEvents)).toBe(true);
    expect(Array.isArray(response.body.nextEvents)).toBe(true);
    expect(Array.isArray(response.body.dueRoutines)).toBe(true);
  });

  it('serves persistent shopping items used by meal planning', async () => {
    const response = await request(app)
      .get('/api/shopping-items')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('uncheckedCount');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('serves announcements used by dashboard and settings workflows', async () => {
    const response = await request(app)
      .get('/api/announcements')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('serves prep templates used by calendar prep workflows', async () => {
    const response = await request(app)
      .get('/api/prep-templates')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('serves Google Photos routes before the generic Google router', async () => {
    const response = await request(app)
      .get('/api/google/photos/status')
      .expect('Content-Type', /json/);

    expect([200, 401, 503]).toContain(response.status);
    expect(response.status).not.toBe(404);
  });
});
