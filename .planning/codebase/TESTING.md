# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- None configured — no Jest, Vitest, pytest, or other test runner is installed or configured
- `frontend/package.json` has no test script and no test dependencies
- `backend/requirements.txt` does not include `pytest` or any testing library
- No `jest.config.*`, `vitest.config.*`, `pytest.ini`, `setup.cfg`, or `conftest.py` found

**Assertion Library:**
- None

**Run Commands:**
```bash
# No test commands available — testing infrastructure not set up
```

## Test File Organization

**Location:**
- No test files exist anywhere in the codebase
- No `__tests__/` directories, no `*.test.ts`, no `*.spec.ts`, no `test_*.py`, no `*_test.py`

**Naming:**
- Not applicable — no tests exist

## Test Structure

No tests exist to analyze. The project has zero test coverage.

## Mocking

**Framework:** None

No mocking infrastructure exists. No mock files, fixtures, or factory patterns are in place.

## Fixtures and Factories

**Test Data:**
- `backend/seed_marketplace.py` — a seed script for demo/development data only, not a test fixture
- No test factories or fixture builders

**Location:**
- `backend/seed_marketplace.py` — standalone seed script, run manually

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:** Not present

**Integration Tests:** Not present

**E2E Tests:** Not present

## What Exists Instead of Tests

**Manual verification approach (documented in CLAUDE.md):**
- TypeScript type-checking as a form of static validation:
  ```bash
  /opt/homebrew/bin/node frontend/node_modules/typescript/bin/tsc --noEmit
  ```
- Backend route/schema inspection via Python one-liners:
  ```bash
  cd backend && source venv/bin/activate && python -c "from app.routers.bundles import router; print([r.path for r in router.routes])"
  ```
- ESLint for frontend code quality:
  ```bash
  cd frontend && eslint
  ```

**Dev seed data:** `backend/seed_marketplace.py` creates specialist profiles, listings, and bids for manual browser testing.

## Recommendations for Adding Tests

If tests are added, these are the natural entry points based on the codebase structure:

**Backend (Python/FastAPI):**
- Use `pytest` + `httpx` (via `httpx.AsyncClient`) with FastAPI's `TestClient`
- Place tests in `backend/tests/` with `conftest.py` for a test SQLite database fixture
- Priority areas: `bundle_service.py` (complex PDF page logic), `auth.py` (token validation), router authorization guards

**Frontend (TypeScript/React):**
- Use Vitest + React Testing Library (compatible with Next.js App Router)
- Install: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`
- Priority areas: custom hooks (mock `api.ts`), UI components (`Button`, `Modal`, `Badge`)
- Mock pattern would use `vi.mock("@/lib/api")` to stub API calls in hook tests

**Key files that would benefit most from tests:**
- `backend/app/services/bundle_service.py` — page numbering, dedup, reordering logic
- `backend/app/services/auth.py` — JWT encode/decode, password hashing
- `frontend/src/hooks/useCases.ts` — optimistic update logic
- `frontend/src/lib/api.ts` — 401 redirect, error parsing

---

*Testing analysis: 2026-03-11*
