# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- Python 3.14.3 - Backend API, services, data models
- TypeScript 5.x - Frontend application (strict mode enabled)

**Secondary:**
- SQL - SQLite database queries (via SQLAlchemy ORM)

## Runtime

**Environment:**
- Python 3.14.3 (backend) — managed via virtualenv at `backend/venv/`
- Node.js 25.6.1 (frontend) — located at `/opt/homebrew/bin/node`

**Package Manager:**
- pip (backend) — `backend/requirements.txt`
- npm 11.9.0 (frontend) — `frontend/package.json`
- Lockfile: `frontend/package-lock.json` (present)

## Frameworks

**Core (Backend):**
- FastAPI 0.128.8 - REST API framework, all routes registered in `backend/app/main.py`
- SQLAlchemy 2.0.46 - ORM using `Mapped[]` / `mapped_column()` style (NOT legacy `Column()`)
- Pydantic 2.12.5 - Request/response validation using `model_config = ConfigDict(...)` style (NOT `class Config:`)
- pydantic-settings - Settings management via `BaseSettings` in `backend/app/config.py`
- Uvicorn 0.40.0 - ASGI server

**Core (Frontend):**
- Next.js 16.1.6 - App Router; pages under `frontend/src/app/`
- React 19.2.3 - UI rendering
- Tailwind CSS 4.x - Utility-first styling via `@tailwindcss/postcss`

**Standalone Bundling Utility:**
- Flask (latest) - Separate web app at `bundling/app.py`, port 5000
- NOT integrated with the main FastAPI backend

## Key Dependencies

**Critical (Backend):**
- `anthropic` 0.79.0 - Anthropic Claude API client; used in `backend/app/services/ai_service.py` and `backend/app/routers/bundles.py`
- `python-jose[cryptography]` 3.5.0 - JWT creation/validation in auth router
- `passlib[bcrypt]` 1.7.4 - Password hashing
- `python-multipart` - File upload support (multipart/form-data)
- `PyPDF2` 3.0.1 - PDF text extraction in evidence processing

**Infrastructure (Backend):**
- SQLite - Default database (`backend/storage.db`); `DATABASE_URL` env var controls connection

**PDF Generation (Bundling Utility):**
- `pypdf` - PDF assembly
- `reportlab` - PDF generation (index page, footers, annotations)
- `Pillow` - Image-to-PDF conversion

## Configuration

**Environment (Backend):**
- Configured via `backend/.env` file (loaded by `pydantic-settings`)
- Settings class: `backend/app/config.py`
- Required keys:
  - `SECRET_KEY` - JWT signing secret (defaults to insecure placeholder)
  - `DATABASE_URL` - Defaults to `sqlite:///./storage.db`
  - `ANTHROPIC_API_KEY` - Required for AI features; empty string disables AI
  - `ACCESS_TOKEN_EXPIRE_MINUTES` - Defaults to 1440 (24 hours)
  - `ALGORITHM` - JWT algorithm, defaults to `HS256`
  - `UPLOAD_DIR` - File upload directory, defaults to `uploads`
  - `MAX_UPLOAD_SIZE_MB` - Defaults to 50

**Environment (Frontend):**
- No `.env` file detected; `API_BASE` is hardcoded to `http://localhost:8000/api/v1` in `frontend/src/lib/api.ts`

**Environment (Bundling Utility):**
- `bundling/.env` loaded manually in `bundling/app.py` at startup
- Requires `ANTHROPIC_API_KEY`

**Build (Frontend):**
- `frontend/next.config.ts` - Minimal, no custom configuration
- `frontend/tsconfig.json` - Strict mode, `@/*` path alias maps to `src/`
- `frontend/postcss.config.mjs` - Tailwind CSS PostCSS plugin
- `frontend/eslint.config.mjs` - ESLint with `eslint-config-next`

## Platform Requirements

**Development:**
- macOS (node/npm at `/opt/homebrew/bin/` — not on default PATH; use `PATH="/opt/homebrew/bin:$PATH" npm run dev`)
- Python virtualenv: `cd backend && source venv/bin/activate`

**Production:**
- Backend: SQLite → PostgreSQL migration planned (change `DATABASE_URL`)
- Frontend: Standard Next.js deployment (Vercel or similar)
- CORS: Currently allows only `http://localhost:3000`; must be updated for production

---

*Stack analysis: 2026-03-11*
