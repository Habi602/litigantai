# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**AI / LLM:**
- Anthropic Claude API - Core AI capability used for evidence analysis, timeline generation, statement-of-claim drafting, and bundle ordering
  - SDK/Client: `anthropic` 0.79.0 (Python)
  - Model used: `claude-sonnet-4-20250514` (main backend), `claude-sonnet-4-6` (bundling utility)
  - Auth: `ANTHROPIC_API_KEY` env var
  - Main usage: `backend/app/services/ai_service.py` (evidence analysis, timeline consolidation, statement of claim generation)
  - Secondary usage: `backend/app/routers/bundles.py` (inline client construction — reads directly from `os.environ["ANTHROPIC_API_KEY"]`)
  - Bundling utility usage: `bundling/app.py` (document metadata extraction, bundle ordering)

## Data Storage

**Databases:**
- SQLite (development default)
  - File: `backend/storage.db`
  - Connection env var: `DATABASE_URL` (defaults to `sqlite:///./storage.db`)
  - Client: SQLAlchemy 2.0 via `backend/app/database.py`
  - Session factory: `SessionLocal`; dependency injection via `get_db()` generator
  - Production target: PostgreSQL (noted in codebase comments; same `DATABASE_URL` env var, different connection string)

- `documents.json` (bundling utility only)
  - File: `bundling/documents.json`
  - Purpose: Persistent cache of Claude-extracted document metadata (keyed by SHA-256 hash)
  - Not a database — flat JSON file managed in `bundling/app.py`

**File Storage:**
- Local filesystem only
  - Uploaded evidence files: `backend/uploads/` directory
  - Path configured via `UPLOAD_DIR` env var (default `uploads`)
  - Max upload size: `MAX_UPLOAD_SIZE_MB` env var (default 50 MB)
  - File download endpoints use `token` query parameter (not `Authorization` header) due to browser navigation constraints — see `backend/app/routers/bundles.py`

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication (no third-party auth provider)
  - Implementation: `backend/app/routers/auth.py`
  - Password hashing: `passlib[bcrypt]`
  - Token creation/validation: `python-jose[cryptography]`, HS256 algorithm
  - Token storage: Browser `localStorage` (key: `token`)
  - Token transmission: `Authorization: Bearer <token>` header
  - Context management: `frontend/src/context/AuthContext.tsx`
  - Token expiry: `ACCESS_TOKEN_EXPIRE_MINUTES` env var (default 1440 = 24 hours)
  - Auto-logout on 401: handled in `frontend/src/lib/api.ts`, redirects to `/login`

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- FastAPI/Uvicorn default stdout logging only
- No structured logging framework configured

## CI/CD & Deployment

**Hosting:**
- Not configured — local development only

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars (backend `backend/.env`):**
- `SECRET_KEY` — JWT signing secret (MUST be changed from default in production)
- `ANTHROPIC_API_KEY` — Required for all AI features; AI silently disabled if empty
- `DATABASE_URL` — Optional; defaults to SQLite

**Required env vars (bundling `bundling/.env`):**
- `ANTHROPIC_API_KEY` — Required; no fallback, raises `KeyError` if missing

**Secrets location:**
- `backend/.env` — backend secrets (not committed)
- `bundling/.env` — bundling utility secrets (not committed)
- No frontend `.env` detected; API base URL is hardcoded in `frontend/src/lib/api.ts`

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Internal Service Communication

**Main backend → Bundling utility:**
- No communication — they are independent services
- Main backend has its own bundle service: `backend/app/services/bundle_service.py`
- Bundling utility (`bundling/app.py`) runs separately on port 5000

**Frontend → Backend:**
- All HTTP calls go through `frontend/src/lib/api.ts` (centralized client)
- Base URL: `http://localhost:8000/api/v1` (hardcoded)
- Auth header injected automatically from `localStorage.getItem("token")`

---

*Integration audit: 2026-03-11*
