# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Layered monolith with two separate user-facing portals (litigant portal, specialist portal) backed by a single REST API.

**Key Characteristics:**
- Backend follows Routers → Services → Models (thin routers, business logic in services)
- Frontend uses domain-scoped custom hooks as the data layer between components and the API client
- All HTTP calls are centralized through a single typed API client (`src/lib/api.ts`)
- Route-level auth guards are enforced in Next.js layout components, not in individual pages
- AI analysis runs synchronously in the request cycle (no background task queue)

## Backend Layers

**Routers (HTTP boundary):**
- Purpose: Parse request, call auth dependency, delegate to service or ORM, return schema
- Location: `backend/app/routers/`
- Contains: FastAPI `APIRouter` instances; thin handlers with `Depends(get_current_user)` and `Depends(get_db)`
- Depends on: Services, Models, Schemas
- Used by: FastAPI app registered in `backend/app/main.py`
- Pattern: Routers do NOT contain business logic; they validate access then call service functions or query ORM directly for simple CRUD

**Services (business logic):**
- Purpose: Orchestrate multi-model operations, AI calls, file operations, PDF assembly
- Location: `backend/app/services/`
- Contains: `ai_service.py`, `auth.py`, `bundle_service.py`, `collaboration_service.py`, `file_service.py`, `marketplace_service.py`
- Depends on: Models, `config.settings`, external SDKs (anthropic)
- Used by: Routers

**Models (data):**
- Purpose: SQLAlchemy ORM definitions; schema of the SQLite database
- Location: `backend/app/models/`
- Contains: 11 model files covering 18+ tables
- Depends on: `backend/app/database.py` (`Base`)
- Used by: Routers and Services

**Schemas (validation contracts):**
- Purpose: Pydantic v2 models for request/response serialization
- Location: `backend/app/schemas/`
- Contains: 8 files mirroring the router domains
- Depends on: Nothing (pure Pydantic)
- Used by: Routers (`response_model=`, `payload: SchemaType`)

## Frontend Layers

**Pages (route handlers):**
- Purpose: Orchestrate multiple hooks, manage UI state (views, active sections), render panels
- Location: `frontend/src/app/(litigation)/` and `frontend/src/app/(specialist)/`
- Contains: Next.js App Router page components
- Depends on: Hooks, UI components, feature components

**Hooks (data layer):**
- Purpose: Encapsulate API calls + local state for a domain; expose actions and state to pages
- Location: `frontend/src/hooks/`
- Contains: 11 hook files (`useCases`, `useEvidence`, `useBundle`, `useTimeline`, `useFacts`, `useLegalAnalysis`, `useStatementOfClaim`, `useMarketplace`, `useCollaboration`, `useSpecialistProfile`, `useSpecialistCases`)
- Depends on: `src/lib/api.ts`, `src/lib/types.ts`
- Used by: Pages and feature components

**Feature Components:**
- Purpose: Domain-specific panels and cards that own their own data fetching via hooks
- Location: `frontend/src/components/cases/`, `frontend/src/components/marketplace/`, `frontend/src/components/specialist/`, `frontend/src/components/litigation/`
- Depends on: Hooks, UI primitives

**UI Primitives:**
- Purpose: Stateless presentational building blocks
- Location: `frontend/src/components/ui/`
- Contains: `Badge`, `Button`, `Card`, `Input`, `Modal`, `Spinner`, `AreaSelector`
- Depends on: Nothing except Tailwind classes

## Data Flow

**Standard API Request (frontend → backend):**

1. User interaction triggers action in a page or feature component
2. Page/component calls a hook method (e.g. `createCase(data)`)
3. Hook calls `api.post<T>(path, data)` via `src/lib/api.ts`
4. `api.ts` attaches `Authorization: Bearer <token>` from `localStorage` and calls `fetch`
5. FastAPI router handler receives request; `Depends(get_current_user)` decodes JWT and loads user
6. Router calls service function or performs ORM query with the SQLAlchemy session (`Depends(get_db)`)
7. Response serialized through Pydantic schema; JSON returned to `api.ts`
8. Hook updates local React state; component re-renders

**Evidence AI Analysis Flow:**

1. User uploads file(s) via `EvidenceUploader` → `api.upload` → `POST /cases/{id}/evidence`
2. Router saves file via `file_service.save_file()`, extracts text via `file_service.extract_text()`, creates `Evidence` row
3. User triggers analysis: `POST /cases/{id}/evidence/{eid}/analyze`
4. Router calls `ai_service.analyze_evidence(evidence, db)` synchronously
5. AI service calls Anthropic Claude API (model `claude-sonnet-4-20250514`) with text or base64 image
6. Response parsed as JSON; `KeyFact` and `TimelineEvent` rows created in DB
7. `evidence.analysis_status` updated to `"completed"` or `"failed"`

**Bundle Assembly Flow:**

1. User selects evidence → `POST /cases/{id}/bundles` with `evidence_ids`
2. `bundle_service.create_bundle()` iterates evidence, reads each as `PdfReader` (converting images to PDF)
3. `BundlePage` rows created with SHA-256 hash for deduplication
4. `_generate_bundle_pdf()` assembles pages via PyPDF2, writes to `backend/uploads/{case_id}/bundles/{bundle_id}.pdf`
5. Bundle served via `GET /cases/{id}/bundles/{bid}/download?token=<jwt>` (query-token auth pattern)

**Auth Flow:**

1. Login: `POST /auth/login` → JWT returned → stored in `localStorage`
2. All subsequent requests: `api.ts` reads token from `localStorage`, sets `Authorization` header
3. 401 response: `api.ts` clears `localStorage.token` and redirects to `/login`
4. File/PDF downloads (browser navigation): use `?token=<jwt>` query param, handled by `get_user_from_token()`
5. Route protection: Next.js layout components (`(litigation)/layout.tsx`, `(specialist)/layout.tsx`) use `useAuth()` and redirect to `/login` if no user

**State Management:**
- No global state store (no Redux/Zustand)
- Auth state: `AuthContext` (React Context) wrapping each route group's layout
- Domain data: individual hooks with `useState` + `useEffect` + `useCallback`
- UI state (active panels, wizard steps): local `useState` in page components

## Key Abstractions

**`api.ts` (HTTP client):**
- Purpose: Single typed HTTP client; handles auth headers, 401 redirect, JSON serialization
- Location: `frontend/src/lib/api.ts`
- Pattern: `api.get<T>`, `api.post<T>`, `api.put<T>`, `api.patch<T>`, `api.delete<T>`, `api.upload<T>`
- Rule: ALL HTTP calls must go through this client, never raw `fetch`

**`get_current_user` (auth dependency):**
- Purpose: FastAPI dependency that decodes JWT and loads `User` from DB
- Location: `backend/app/services/auth.py`
- Pattern: `current_user: User = Depends(get_current_user)` on every protected route
- Exception: File download endpoints use `get_user_from_token(token, db)` directly with query param

**`can_access_case` (authorization):**
- Purpose: Returns True if user owns case OR is a `CaseCollaborator`
- Location: `backend/app/services/collaboration_service.py`
- Pattern: Called at top of any read endpoint for case-level resources

**`AuthContext` (frontend auth state):**
- Purpose: Provides `user`, `loading`, `login`, `register`, `logout` to all pages under a route group
- Location: `frontend/src/context/AuthContext.tsx`
- Pattern: Each route group layout wraps children in `<AuthProvider>` independently

## Entry Points

**Backend:**
- Location: `backend/app/main.py`
- Triggers: `uvicorn app.main:app --reload`
- Responsibilities: Creates FastAPI app, registers CORS middleware, calls `Base.metadata.create_all()`, includes all 10 routers under `/api/v1`

**Frontend:**
- Location: `frontend/src/app/layout.tsx` (root), `frontend/src/app/page.tsx` (redirects to `/cases`)
- Route groups: `(litigation)` for litigant portal, `(specialist)` for specialist portal
- Each group has its own `layout.tsx` that wraps `AuthProvider` and renders the appropriate sidebar/header

## Error Handling

**Strategy:** Errors propagate to hook/component level; no global error boundary enforced

**Backend Patterns:**
- `HTTPException(status_code=404, detail="...")` for not-found
- `HTTPException(status_code=403, detail="...")` for access violations
- `HTTPException(status_code=400, detail="...")` for bad input
- AI service wraps Claude API call in `try/except`; sets `evidence.analysis_status = "failed"` on error

**Frontend Patterns:**
- Hooks catch errors in `try/catch` and expose via `error: string | null` state
- `api.ts` throws `ApiError(status, detail)` on non-2xx responses
- 401 responses redirect to `/login` automatically in `api.ts`

## Cross-Cutting Concerns

**Logging:** No structured logging framework; Python exceptions surface via uvicorn stdout

**Validation:**
- Backend: Pydantic v2 schemas on request body; FastAPI dependency injection handles DB access
- Frontend: No form validation library; inline checks in handlers

**Authentication:**
- Backend: JWT via `python-jose` (HS256); `passlib[bcrypt]` for password hashing
- Frontend: `AuthContext` manages token lifecycle; layout guards prevent unauthenticated page access

**File Storage:**
- Uploaded files stored on local filesystem under `backend/uploads/{case_id}/`
- Bundle PDFs stored under `backend/uploads/{case_id}/bundles/`
- No cloud storage integration

---

*Architecture analysis: 2026-03-11*
