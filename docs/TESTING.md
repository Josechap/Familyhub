# Testing Guide

This document describes the testing infrastructure for Familyhub OS.

## Overview

The server uses **Jest** with **supertest** for API testing. Tests cover all core API endpoints to ensure reliability and catch regressions.

## Quick Start

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
server/
├── tests/
│   ├── setup.js          # Test configuration and cleanup
│   ├── health.test.js    # Health endpoint tests
│   ├── recipes.test.js   # Recipes API tests
│   ├── tasks.test.js     # Tasks/chores API tests
│   ├── calendar.test.js  # Calendar events tests
│   ├── meals.test.js     # Meal planning tests
│   └── settings.test.js  # Settings and family member tests
├── app.js                # Express app (testable, no server start)
├── index.js              # Server entry point (starts listening)
└── jest.config.js        # Jest configuration
```

## Test Coverage

| API | Tests | Coverage | Description |
|-----|-------|----------|-------------|
| Health | 2 | 100% | Server health and status |
| Recipes | 5 | 57% | CRUD operations, favorites |
| Tasks | 10 | 72% | Chores, family members, analytics |
| Calendar | 5 | 73% | Events, dinner slots |
| Meals | 11 | 50% | Meal planning, shopping list |
| Settings | 9 | 65% | Configuration, family management |
| **Total** | **40** | **~29%** | Core API functionality |

Note: Coverage is lower for routes requiring external services (Google, Paprika, Sonos, Photos).

## Writing Tests

### Basic Test Structure

```javascript
const request = require('supertest');
const { app } = require('../app');

describe('API Name', () => {
  describe('GET /api/endpoint', () => {
    it('should return expected data', async () => {
      const response = await request(app)
        .get('/api/endpoint')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('expectedField');
    });
  });
});
```

### Testing POST/PUT/DELETE

```javascript
describe('POST /api/endpoint', () => {
  it('should create a resource', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ name: 'Test', value: 123 })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Testing Error Cases

```javascript
it('should return 404 for non-existent resource', async () => {
  const response = await request(app)
    .get('/api/endpoint/99999')
    .expect(404);

  expect(response.body).toHaveProperty('error');
});

it('should return 400 for invalid input', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ invalid: 'data' })
    .expect(400);

  expect(response.body).toHaveProperty('error');
});
```

## Test Environment

Tests run with `NODE_ENV=test`, which:
- Suppresses console logging
- Skips Sonos route (does network discovery on import)
- Skips static file serving
- Uses the same database (be careful with destructive tests)

## Best Practices

### 1. Clean Up After Tests
If your test creates data, clean it up:

```javascript
it('should create and then delete', async () => {
  // Create
  const createResponse = await request(app)
    .post('/api/resource')
    .send({ name: 'Test' });

  const id = createResponse.body.id;

  // Test...

  // Clean up
  await request(app).delete(`/api/resource/${id}`);
});
```

### 2. Use Unique Test Data
Avoid conflicts with existing data:

```javascript
const testValue = 'test_' + Date.now();
```

### 3. Test Both Success and Error Cases
```javascript
describe('GET /api/resource/:id', () => {
  it('should return resource when exists', async () => { /* ... */ });
  it('should return 404 when not found', async () => { /* ... */ });
});
```

### 4. Restore State After Toggles
```javascript
it('should toggle status', async () => {
  // Toggle
  await request(app).put('/api/resource/1/toggle');

  // Toggle back to restore original state
  await request(app).put('/api/resource/1/toggle');
});
```

## Skipped Routes

The following routes are not fully tested because they require external services:

| Route | Reason |
|-------|--------|
| `/api/google/*` | Requires Google OAuth tokens |
| `/api/paprika/*` | Requires Paprika account credentials |
| `/api/sonos/*` | Requires Sonos devices on network |
| `/api/photos/*` | Requires local photo directory |
| `/api/google/photos/*` | Requires Google Photos OAuth |

To test these, you would need to:
1. Mock the external services
2. Use integration tests with real credentials (not recommended in CI)

## Continuous Integration

To run tests in CI (e.g., GitHub Actions):

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd server && npm ci
      - name: Run tests
        run: cd server && npm test
```

## Troubleshooting

### Tests hang or timeout
- Check for unclosed database connections
- Look for async operations without `await`
- Use `--detectOpenHandles` flag: `npm test -- --detectOpenHandles`

### "Cannot log after tests are done"
- An async operation is still running after tests complete
- The Sonos route does this (which is why it's skipped in test mode)

### Database state issues
- Tests use the real database
- Make sure tests clean up after themselves
- Consider using a separate test database for isolation

## Adding New Tests

1. Create a new file in `server/tests/` named `<feature>.test.js`
2. Import the app: `const { app } = require('../app');`
3. Write describe/it blocks for each endpoint
4. Run tests to verify: `npm test`
5. Check coverage: `npm run test:coverage`
