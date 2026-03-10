# Familyhub End-to-End Codebase Review (2026-03-10)

## Scope and method

This review covered:
- Backend architecture, routing, persistence, and API safety.
- Frontend architecture, state management, UI composition, and API client behavior.
- Test maturity and quality gates.
- Build, lint, and operational/deployment readiness.

Commands executed:
- `npm test` (server)
- `npm test -- --detectOpenHandles` (server)
- `npm run lint` (client)
- `npm run build` (client)

---

## Executive summary

Familyhub is functionally rich and has meaningful backend test coverage (40 passing API tests), but it is currently bottlenecked by frontend quality gates and maintainability hot spots. The codebase is in a "works, but scale/polish risk" state:

- **Backend reliability:** Good baseline (tests present and passing).
- **Frontend reliability:** Weak (no tests + lint errors currently fail CI-quality checks).
- **Security/operations:** Needs hardening for production-facing deployments.
- **Maintainability:** Several oversized modules and mixed responsibilities increase change risk.

**Overall recommendation:** Prioritize a short stabilization sprint focused on frontend quality gates, API hardening, and module decomposition before adding major new features.

---

## What is working well

1. **Backend tests are established and passing.**
   - Jest + supertest coverage exists across health, tasks, meals, calendar, recipes, and settings.

2. **Server app separation is solid.**
   - `app.js` exports the app for tests while `index.js` handles process startup.

3. **SQLite access is parameterized consistently.**
   - Most SQL operations use prepared statements (good baseline against SQL injection in query values).

4. **Frontend build succeeds and has at least partial chunk splitting.**
   - Separate chunk is emitted for `TaskAnalytics`.

---

## Key findings and recommendations

### P0 (do first)

### 1) Frontend quality gate is failing

- `npm run lint` fails with multiple errors in production code (unused vars + hook memoization/dependency issues).
- This creates drift between intended and actual behavior and weakens confidence in refactors.

**Recommendation**
- Make lint green as a release blocker.
- Fix unused values and resolve React hook memoization warnings/errors in `TemperatureDial`.
- Add CI step that runs frontend lint + backend tests on every PR.

### 2) Critical destructive endpoint has no authorization guard

- `POST /api/settings/reset-database` clears core tables and sequences with no auth/role checks.
- In a network-accessible deployment, this is a high-impact risk.

**Recommendation**
- Gate the endpoint behind admin auth (at minimum, shared secret or local-only check; ideally session/token-based auth with CSRF protection if browser-invoked).
- Add explicit audit logs for reset actions.
- Disable the endpoint in production by default unless explicitly enabled.

### 3) Frontend has no automated tests

- There are no client test files in the repository.
- UI regressions are currently caught late/manual.

**Recommendation**
- Add Vitest + React Testing Library.
- Start with high-value tests: Dashboard data rendering, Settings persistence flow, and task toggle UI behavior.
- Add a smoke Playwright E2E for "load dashboard + call health route + basic navigation".

---

### P1 (next)

### 4) API layer uses inconsistent error-handling strategy

- `client/src/lib/api.js` mixes throwing errors with silent fallbacks (`return []`, `return { connected: false }`).
- This inconsistency makes UI state unpredictable and complicates error UX.

**Recommendation**
- Define a consistent contract:
  - Either all API methods throw and slices/components map to user-facing errors, or
  - All methods return `{ data, error }` style results.
- Centralize fetch wrapper with timeout, JSON parsing safety, and normalized errors.

### 5) Large modules are reducing maintainability

- `Settings.jsx` (~873 lines), `google.js` route (~519 lines), `api.js` (~491 lines), and `Dashboard.jsx` (~354 lines) have broad responsibilities.

**Recommendation**
- Split by feature boundaries:
  - `Settings`: integrations, family members, appearance, screensaver sections.
  - `api.js`: domain clients (`calendarApi`, `tasksApi`, `settingsApi`, etc.).
  - `google.js`: token/session utilities vs route handlers.
- Use folder-level index exports to keep imports ergonomic.

### 6) Backend input validation is too permissive

- Several write endpoints accept body fields directly without schema validation (e.g., tasks/settings create/update paths).

**Recommendation**
- Introduce request schemas (Zod/Joi/express-validator).
- Validate types/ranges for points, IDs, dates, and enum fields.
- Return structured 400 errors for invalid payloads.

### 7) Production security middleware is minimal

- Server currently uses CORS and JSON parsing but does not appear to use baseline hardening middleware (helmet/rate limiting).

**Recommendation**
- Add `helmet` and an API rate limiter.
- Add request-size limits and standardized trust-proxy/cookie policies as applicable.
- Revisit CORS allowlisting to avoid broad pattern matching where possible.

---

### P2 (optimization and cleanup)

### 8) Database seeding is always evaluated at startup and uses random event generation

- Startup path seeds data when member count is zero and includes randomized data generation.

**Recommendation**
- Move seed logic into explicit scripts (`npm run db:seed`) and keep startup deterministic.
- For first-run UX in production, gate sample seed via environment flag.

### 9) Dependency hygiene issue: duplicate SQLite drivers

- Both `better-sqlite3` and `sqlite3` are declared; runtime code uses `better-sqlite3`.

**Recommendation**
- Remove unused `sqlite3` dependency to reduce install size/surface area.

### 10) Weather integration and settings secret handling need tightening

- Weather API key appears to be stored in general settings and used directly for outbound requests.

**Recommendation**
- Treat API keys as sensitive: encrypt at rest (or move to env-managed secret where feasible).
- Add response caching for weather endpoint to reduce third-party calls and improve UI responsiveness.

---

## 30-day action plan

### Week 1: Stability and release safety
- Fix all frontend lint errors and enforce lint/test in CI.
- Add auth guard + production disable switch for reset endpoint.
- Add schema validation for top 5 write endpoints.

### Week 2: Frontend test baseline
- Set up Vitest + RTL.
- Add at least 8-12 tests across Dashboard, Settings, Tasks interactions.

### Week 3: Refactor high-risk modules
- Break up `Settings.jsx` and `api.js`.
- Extract reusable API client with normalized errors.

### Week 4: Security and ops hardening
- Add helmet + rate limiting.
- Remove unused dependencies and formalize seed strategy.
- Add weather caching and secret handling improvements.

---

## Success criteria

- Frontend lint passes with zero errors.
- CI runs backend tests + frontend lint on every PR.
- Reset endpoint cannot be invoked without explicit admin authorization.
- At least 10 frontend tests added and passing.
- Largest frontend modules reduced by at least 30% LOC via decomposition.
- Unused runtime dependency (`sqlite3`) removed.
