# NoahLaw — AI-Powered Litigation Platform & Legal Marketplace

## Project Overview

NoahLaw helps litigants-in-person (LIPs) manage legal cases with AI assistance, and connects them with legal specialists through a marketplace. Built as a full-stack web application with a FastAPI backend and Next.js frontend.

## Repo Structure

```
litigantai/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── main.py          # App entry point, CORS, router registration
│   │   ├── config.py         # Pydantic Settings (env vars)
│   │   ├── database.py       # SQLAlchemy engine + SessionLocal
│   │   ├── models/           # SQLAlchemy ORM models (9 files, 18 tables)
│   │   ├── routers/          # API route handlers (9 files)
│   │   ├── schemas/          # Pydantic request/response schemas (8 files)
│   │   └── services/         # Business logic layer (6 files)
│   ├── storage.db             # SQLite database
│   ├── seed_marketplace.py    # Seed script for demo data
│   └── requirements.txt       # Python dependencies
├── frontend/         # Next.js 16 + React 19 + TypeScript + Tailwind 4
│   └── src/
│       ├── app/               # Next.js App Router pages (12 routes)
│       ├── components/        # React components (layout, cases, marketplace, ui)
│       ├── context/           # AuthContext (JWT + user state)
│       ├── hooks/             # Custom data hooks (8 files)
│       └── lib/               # api.ts, types.ts, utils.ts
└── data/             # (empty, reserved for future data assets)
```

## How to Run

**Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload        # http://localhost:8000
```

**Frontend:**
```bash
cd frontend
PATH="/opt/homebrew/bin:$PATH" npm run dev   # http://localhost:3000
```
# node/npm are at /opt/homebrew/bin/ — not on Claude Code's default PATH

**Seed demo data:**
```bash
cd backend
python seed_marketplace.py
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI |
| ORM | SQLAlchemy 2.0 (`Mapped[]` / `mapped_column()` style) |
| Validation | Pydantic v2 (`model_config`, `ConfigDict`) |
| Database | SQLite (→ PostgreSQL in production) |
| Auth | JWT via `python-jose`, passwords via `passlib[bcrypt]` |
| AI | Anthropic Claude API (`anthropic` SDK) |
| Frontend framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript 5 + Tailwind CSS 4 |

## Architecture Patterns

- **Backend:** Routers → Services → Models (thin routers, business logic in services)
- **Frontend hooks:** Each domain has a custom hook (`useCases`, `useEvidence`, `useTimeline`, etc.) that encapsulates API calls and state
- **API client:** All HTTP calls go through `src/lib/api.ts` — never use raw `fetch` elsewhere
- **Imports:** Use `@/` path alias (maps to `src/`)
- **Auth flow:** JWT token stored in localStorage, passed via `Authorization: Bearer` header, managed by `AuthContext`

## Code Guidelines

1. **Delete orphaned code** — don't comment it out, delete it
2. **Reuse existing functions** — check hooks/services before writing new fetch calls
3. **Follow existing patterns** — match the style of neighboring files
4. **No hardcoded secrets** — use `.env` files and `config.py` / `process.env`
5. **All HTTP through `api.ts`** — the centralized API client handles auth headers and base URL
6. **SQLAlchemy 2.0 style** — use `Mapped[type]` and `mapped_column()`, not legacy `Column()`
7. **Pydantic v2 style** — use `model_config = ConfigDict(...)`, not `class Config:`
8. **JSX apostrophes** — use `&apos;` not `'` inside JSX text content (Next.js lint rule)
9. **SQLite column migrations** — `Base.metadata.create_all()` only creates missing tables, it does NOT add new columns to existing ones. After adding a `Mapped[]` field, run: `python -c "import sqlite3; c=sqlite3.connect('storage.db'); c.execute('ALTER TABLE <t> ADD COLUMN <col> <type> DEFAULT <val>'); c.commit()"`
10. **Drag-and-drop ref pattern** — never mutate a ref inside a `setState` updater (side-effect, may run multiple times in StrictMode). Capture `from = ref.current`, update `ref.current = target` *before* calling setState, then use the captured `from` in the pure updater.
11. **File download auth** — endpoints served as direct browser links (e.g. PDF downloads) cannot use `Depends(get_current_user)` — it only reads the `Authorization` header, which browsers don't send on `<a href>` navigation. Instead, accept `token: str = Query(...)` and call `get_user_from_token(token, db)` directly.

## Useful Commands

```bash
# TypeScript type-check (no npm required)
/opt/homebrew/bin/node frontend/node_modules/typescript/bin/tsc --noEmit

# Verify backend routes / schemas inline
cd backend && source venv/bin/activate && python -c "from app.routers.bundles import router; print([r.path for r in router.routes])"

# Check if dev servers are already running before starting them
lsof -i :3000   # frontend
lsof -i :8000   # backend
```

## Bundling Utility (`/bundling/`)

`/bundling/` is a **standalone Flask utility** (port 5000) — not integrated with the main FastAPI backend. It uses Claude to extract `title`, `date`, and `summary` from uploaded PDFs/images/text, proposes an AI-ordered bundle, and generates a PDF with an index page + footer overlays + hyperlinked index rows.

- `bundling/app.py` — Flask: `POST /analyze`, `POST /add-files`, `POST /bundle`, `POST /cleanup`
- `bundling/bundle_pdfs.py` — PDF assembly via `pypdf` + `reportlab`: styled index page, per-page footers, link annotations

This app is **not called by the main backend**. The main backend has its own bundle service (`backend/app/services/bundle_service.py`).

## After Making Changes

After completing any code change, always restart both dev servers:
```bash
# Kill existing servers
pkill -f "uvicorn app.main:app" 2>/dev/null; pkill -f "next dev" 2>/dev/null
# Restart backend
cd /Users/israelrussell/Desktop/litigantai/backend && source venv/bin/activate && uvicorn app.main:app --reload &
# Restart frontend
cd /Users/israelrussell/Desktop/litigantai/frontend && PATH="/opt/homebrew/bin:$PATH" npm run dev &
```
This prevents stale hot-reload state (e.g. React hooks order errors) from masking real bugs.

## Learning from Corrections

Treat every correction as a permanent rule for this project. If told "don't do X," that applies to all future work, not just the current task.
