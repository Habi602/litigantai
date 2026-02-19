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

## Bundling Utility (`/bundling/`)

`/bundling/` is a **standalone Flask utility** (port 5000) — not integrated with the main FastAPI backend. It uses Claude to extract `title`, `date`, and `summary` from uploaded PDFs/images/text, proposes an AI-ordered bundle, and generates a PDF with an index page + footer overlays + hyperlinked index rows.

- `bundling/app.py` — Flask: `POST /analyze`, `POST /add-files`, `POST /bundle`, `POST /cleanup`
- `bundling/bundle_pdfs.py` — PDF assembly via `pypdf` + `reportlab`: styled index page, per-page footers, link annotations

This app is **not called by the main backend**. The main backend has its own bundle service (`backend/app/services/bundle_service.py`).

## Learning from Corrections

Treat every correction as a permanent rule for this project. If told "don't do X," that applies to all future work, not just the current task.
