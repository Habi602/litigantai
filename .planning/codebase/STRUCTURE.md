# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
litigantai/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── main.py             # App entry point, CORS, router registration
│   │   ├── config.py           # Pydantic Settings (env vars via .env)
│   │   ├── database.py         # SQLAlchemy engine, SessionLocal, Base, get_db
│   │   ├── models/             # SQLAlchemy ORM models (11 files, 18+ tables)
│   │   ├── routers/            # API route handlers (10 files)
│   │   ├── schemas/            # Pydantic v2 request/response schemas (8 files)
│   │   └── services/           # Business logic (6 files)
│   ├── uploads/                # User-uploaded files (not committed)
│   │   └── {case_id}/
│   │       ├── {filename}      # Evidence files
│   │       └── bundles/
│   │           └── {bundle_id}.pdf
│   ├── storage.db              # SQLite database (not committed)
│   ├── seed_marketplace.py     # Demo data seed script
│   └── requirements.txt        # Python dependencies
├── bundling/                   # Standalone Flask utility (port 5000) — NOT integrated
│   ├── app.py                  # Flask: /analyze, /add-files, /bundle, /cleanup
│   ├── bundle_pdfs.py          # PDF assembly via pypdf + reportlab
│   └── templates/              # Jinja2 HTML templates
├── frontend/                   # Next.js 16 App Router frontend
│   └── src/
│       ├── app/                # Next.js App Router pages
│       │   ├── layout.tsx      # Root layout (Geist font, metadata)
│       │   ├── page.tsx        # Root redirect → /cases
│       │   ├── globals.css     # Global Tailwind styles
│       │   ├── login/          # Login/register page
│       │   ├── (litigation)/   # Litigant portal route group
│       │   │   ├── layout.tsx  # AuthProvider + LitigationSidebar + LitigationHeader
│       │   │   ├── cases/
│       │   │   │   ├── page.tsx           # Case list
│       │   │   │   ├── new/page.tsx       # Create new case
│       │   │   │   └── [id]/
│       │   │   │       ├── page.tsx       # Case detail (wizard + overview)
│       │   │   │       ├── evidence/[eid]/page.tsx  # Evidence viewer
│       │   │   │       └── bundle/[bundleId]/page.tsx  # Bundle builder
│       │   │   └── marketplace/
│       │   │       ├── page.tsx           # Browse listings
│       │   │       ├── [listingId]/page.tsx  # Listing detail
│       │   │       ├── my-listings/page.tsx  # My published listings
│       │   │       └── my-bids/page.tsx      # My bids on specialists
│       │   └── (specialist)/  # Specialist portal route group
│       │       ├── layout.tsx  # AuthProvider + SpecialistSidebar + SpecialistHeader
│       │       └── specialist/
│       │           ├── page.tsx              # Specialist dashboard
│       │           ├── profile/page.tsx      # Profile form
│       │           ├── cases/[id]/page.tsx   # Assigned case view
│       │           ├── opportunities/        # Browse open listings
│       │           ├── matches/page.tsx      # AI-matched listings
│       │           └── bids/page.tsx         # My submitted bids
│       ├── components/         # React components
│       │   ├── cases/          # Case-domain feature components (20 files)
│       │   ├── litigation/     # Litigant portal layout (LitigationSidebar, LitigationHeader)
│       │   ├── marketplace/    # Marketplace feature components (6 files)
│       │   ├── specialist/     # Specialist portal layout (SpecialistSidebar, SpecialistHeader)
│       │   ├── payments/       # Payments UI (stub)
│       │   ├── units/          # Misc shared components
│       │   └── ui/             # Primitive UI components (Badge, Button, Card, Input, Modal, Spinner, AreaSelector)
│       ├── context/
│       │   └── AuthContext.tsx  # JWT auth state (user, login, register, logout)
│       ├── hooks/              # Domain data hooks (11 files)
│       └── lib/
│           ├── api.ts          # Centralized HTTP client
│           ├── types.ts        # All TypeScript interfaces mirroring backend schemas
│           ├── utils.ts        # Utility helpers
│           └── lawAreas.ts     # Legal practice area constants
├── data/                       # Reserved (empty)
├── CLAUDE.md                   # Project instructions for AI assistants
├── PRD.md                      # Product requirements document
├── STATUS.md                   # Development status
└── TECH_SPEC.md                # Technical specification
```

## Directory Purposes

**`backend/app/models/`:**
- Purpose: SQLAlchemy ORM table definitions
- Contains: `user.py`, `case.py`, `evidence.py`, `key_fact.py`, `timeline_event.py`, `bundle.py`, `marketplace.py`, `collaboration.py`, `legal_analysis.py`, `statement_of_claim.py`, `__init__.py`
- Key files: `case.py` is the central model — relates to evidence, timeline, bundles, marketplace, legal analysis, collaboration, statement of claim

**`backend/app/routers/`:**
- Purpose: FastAPI route handlers, one file per domain
- Contains: `auth.py`, `cases.py`, `evidence.py`, `timeline.py`, `bundles.py`, `specialists.py`, `marketplace.py`, `legal_analysis.py`, `collaboration.py`, `statement_of_claim.py`
- Key files: `evidence.py` handles file upload and AI analysis trigger

**`backend/app/services/`:**
- Purpose: Business logic extracted from routers
- Contains: `ai_service.py` (Claude API calls), `auth.py` (JWT ops), `bundle_service.py` (PDF assembly), `collaboration_service.py` (access control), `file_service.py` (disk I/O), `marketplace_service.py` (matching logic)

**`backend/app/schemas/`:**
- Purpose: Pydantic v2 request/response serialization contracts
- Contains: `auth.py`, `case.py`, `bundle.py`, `evidence.py`, `legal_analysis.py`, `marketplace.py`, `statement_of_claim.py`, `timeline.py`

**`frontend/src/hooks/`:**
- Purpose: Domain data layer — each hook encapsulates API calls + React state for one domain
- Contains: `useCases.ts`, `useEvidence.ts`, `useBundle.ts`, `useTimeline.ts`, `useFacts.ts`, `useLegalAnalysis.ts`, `useStatementOfClaim.ts`, `useMarketplace.ts`, `useCollaboration.ts`, `useSpecialistProfile.ts`, `useSpecialistCases.ts`

**`frontend/src/components/cases/`:**
- Purpose: Feature panels for the case detail page
- Key files: `WizardBundleStep.tsx`, `StatementOfClaimPanel.tsx`, `LegalAnalysisPanel.tsx`, `FactsPanel.tsx`, `TimelineView.tsx`, `MyFilesPanel.tsx`, `BundleBuilder.tsx`, `BundleViewer.tsx`, `EvidenceUploader.tsx`, `EvidenceViewer.tsx`

**`frontend/src/components/ui/`:**
- Purpose: Stateless primitive components, no business logic
- Use for all basic interactive elements before creating custom variants

## Key File Locations

**Entry Points:**
- `backend/app/main.py`: FastAPI app, middleware, router registration
- `frontend/src/app/layout.tsx`: Root Next.js layout
- `frontend/src/app/page.tsx`: Root page (redirects to `/cases`)

**Configuration:**
- `backend/app/config.py`: All backend env vars via Pydantic Settings
- `backend/.env`: Secrets (not committed); requires `ANTHROPIC_API_KEY`, `SECRET_KEY`
- `frontend/src/app/globals.css`: Global Tailwind CSS config

**Auth:**
- `backend/app/services/auth.py`: JWT creation, verification, `get_current_user` dependency
- `frontend/src/context/AuthContext.tsx`: Frontend auth state provider
- `frontend/src/lib/api.ts`: Token attachment and 401 handling

**Type Contracts:**
- `frontend/src/lib/types.ts`: Single source of truth for all TypeScript interfaces — mirrors backend Pydantic schemas

**Database:**
- `backend/app/database.py`: Engine, `SessionLocal`, `Base`, `get_db` dependency
- `backend/storage.db`: SQLite file (not committed)

**AI Integration:**
- `backend/app/services/ai_service.py`: All Anthropic Claude API calls (evidence analysis, timeline generation, statement of claim generation)

**PDF Bundling:**
- `backend/app/services/bundle_service.py`: Full PDF assembly pipeline (create, reorder, add/remove evidence, links, highlights)

## Naming Conventions

**Backend Files:**
- Model files: snake_case noun, matches table name concept (`key_fact.py`, `timeline_event.py`)
- Router files: snake_case noun/domain (`statement_of_claim.py`, `legal_analysis.py`)
- Service files: `{domain}_service.py` for multi-function services; bare name for auth (`auth.py`)

**Frontend Files:**
- Hooks: `use{Domain}.ts` in camelCase (`useCases.ts`, `useStatementOfClaim.ts`)
- Components: PascalCase matching the component name (`BundleBuilder.tsx`, `LegalAnalysisPanel.tsx`)
- Pages: `page.tsx` (Next.js App Router convention)
- Layouts: `layout.tsx` (Next.js App Router convention)

**URL Routes:**
- Backend: `/api/v1/{domain}` (e.g. `/api/v1/cases`, `/api/v1/cases/{id}/evidence`)
- Frontend: `/{domain}` for litigant portal, `/specialist/{subpath}` for specialist portal

## Where to Add New Code

**New backend domain (e.g. new resource type):**
1. Model: `backend/app/models/{name}.py` — extend `Base`, use `Mapped[]` / `mapped_column()` style
2. Schema: `backend/app/schemas/{name}.py` — `ConfigDict(from_attributes=True)` on response models
3. Service (if needed): `backend/app/services/{name}_service.py`
4. Router: `backend/app/routers/{name}.py` — register with `APIRouter(prefix="/{name}", tags=["{name}"])`
5. Register router: `backend/app/main.py` — `app.include_router({name}.router, prefix="/api/v1")`
6. Add column migration note: use `ALTER TABLE` via sqlite3 if adding to existing table

**New frontend data domain:**
1. Add types: `frontend/src/lib/types.ts`
2. Create hook: `frontend/src/hooks/use{Domain}.ts` — follows pattern of `useCases.ts`
3. Create feature components: `frontend/src/components/{domain}/`
4. Add page if needed: `frontend/src/app/(litigation)/{path}/page.tsx` or `(specialist)/specialist/{path}/page.tsx`

**New UI primitive:**
- Add to `frontend/src/components/ui/`
- Keep stateless; accept className prop for extension

**New API call:**
- Always go through `frontend/src/lib/api.ts` using `api.get<T>`, `api.post<T>`, etc.
- Never use raw `fetch` directly in components or hooks

**New page in litigant portal:**
- Create under `frontend/src/app/(litigation)/`
- Auth protection is inherited from `(litigation)/layout.tsx` — no additional guards needed

**New page in specialist portal:**
- Create under `frontend/src/app/(specialist)/specialist/`
- Auth protection is inherited from `(specialist)/layout.tsx`

## Special Directories

**`backend/uploads/`:**
- Purpose: Runtime file storage for uploaded evidence and generated bundle PDFs
- Generated: Yes (created at runtime by `file_service.py` and `bundle_service.py`)
- Committed: No

**`backend/venv/`:**
- Purpose: Python virtual environment
- Generated: Yes
- Committed: No

**`frontend/.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes
- Committed: No

**`bundling/`:**
- Purpose: Standalone Flask utility for AI-assisted PDF bundling (port 5000)
- NOT integrated with the main FastAPI backend
- Has its own dependencies; run separately if needed

**`.planning/`:**
- Purpose: AI-assisted planning documents for development phases
- Committed: Yes

---

*Structure analysis: 2026-03-11*
