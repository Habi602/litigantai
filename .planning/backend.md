# NoahLaw — Backend Build Plan

## How to use this document
Work through each phase in order. Before starting a phase, answer the architecture questions together. Each phase ends with a testing & validation checklist — nothing moves forward until it passes.

---

## Phase 1 — Database Schema Design
**Goal:** Know exactly what tables exist, what they contain, and how they relate before writing any code.

### Architecture questions to answer first
- What are the two user roles and what data is unique to each?
- Which tables need to be deleted when a parent is deleted (cascade)?
- Which fields should be required vs optional?
- Where do uploaded files live — local disk or cloud storage?
- Do we need soft deletes (mark as deleted) or hard deletes?

### Steps
1. List all tables and their purpose
2. Define columns (name, type, required/optional, default value)
3. Define foreign keys and relationships
4. Define unique constraints
5. Produce `DATABASE.md` as the source of truth

### Testing & Validation
- [ ] Every table has a primary key
- [ ] Every foreign key points to an existing table
- [ ] No circular dependencies between required fields
- [ ] All file-storage fields are just paths (strings), not the files themselves
- [ ] `DATABASE.md` reviewed and approved

---

## Phase 2 — Models (SQLAlchemy)
**Goal:** Translate the schema into Python classes so the database tables are created automatically when the app starts.

### Architecture questions to answer first
- Which tables already exist in the codebase and which need to be created from scratch?
- How do we handle adding columns to existing tables (ALTER TABLE vs drop & recreate)?
- Do we use SQLite for development and PostgreSQL for production?

### Steps
1. Create one Python file per domain in `backend/app/models/`
2. Write SQLAlchemy `Mapped[]` / `mapped_column()` class for each table
3. Add relationships between models
4. Register all models in `backend/app/database.py`
5. Run the app — confirm tables are created in `storage.db`

### Testing & Validation
- [ ] App starts without errors
- [ ] All tables visible in `storage.db` (check with SQLite browser or `sqlite3` CLI)
- [ ] All columns match `DATABASE.md`
- [ ] All foreign key constraints are present
- [ ] Inserting a parent row then deleting it cascades correctly to child rows

---

## Phase 3 — Schemas (Pydantic)
**Goal:** Define what data is allowed in and out of every API endpoint — the "contract" between frontend and backend.

### Architecture questions to answer first
- For each table, what fields should the frontend be able to set on create vs update?
- What fields should never be returned to the frontend (e.g. `hashed_password`)?
- Do we need separate schemas for list views (fewer fields) vs detail views (all fields)?

### Steps
1. Create one Pydantic schema file per domain in `backend/app/schemas/`
2. For each table write: `Create`, `Update`, and `Response` schema classes
3. Use `model_config = ConfigDict(from_attributes=True)` on all Response schemas
4. Mark sensitive fields (passwords, file paths) as excluded from responses

### Testing & Validation
- [ ] Every model field from `DATABASE.md` is covered in at least one schema
- [ ] `hashed_password` and raw file paths never appear in any `Response` schema
- [ ] Required fields missing from a request body raise a `422` error
- [ ] Extra unknown fields in a request body are ignored (not crash)

---

## Phase 4 — Services (Business Logic)
**Goal:** Write the functions that actually do the work — query the database, run AI calls, process files.

### Architecture questions to answer first
- What operations does each domain need (create, read, update, delete, plus custom actions)?
- Which operations require an AI call to Claude?
- Which operations require reading or writing files from disk?
- What happens if a file upload succeeds but the database write fails?

### Steps
1. Create one service file per domain in `backend/app/services/`
2. Each function takes a `db: Session` and the data it needs, returns a model or raises `HTTPException`
3. File operations: save file first, then write to DB; on DB failure, delete the file
4. AI operations: call Claude, store result in DB, return to caller

### Testing & Validation
- [ ] Each service function can be called directly in a Python shell and returns the expected result
- [ ] Database session is never left open after an error
- [ ] File cleanup happens on failure (no orphaned files on disk)
- [ ] AI calls have a timeout and return a meaningful error if Claude is unavailable

---

## Phase 5 — Routers (API Endpoints)
**Goal:** Expose the service functions as HTTP endpoints that the frontend can call.

### Architecture questions to answer first
- What is the URL structure for each domain? (e.g. `/cases/{id}/evidence`)
- Which endpoints require the user to be logged in?
- Which endpoints should only be accessible to the owner of the resource?
- Which endpoints return a list vs a single item?

### Steps
1. Create one router file per domain in `backend/app/routers/`
2. Each route calls one service function and returns a Pydantic `Response` schema
3. Add `Depends(get_current_user)` to all protected routes
4. Register all routers in `backend/app/main.py`
5. Test every route via FastAPI's auto-generated docs at `http://localhost:8000/docs`

### Testing & Validation
- [ ] `GET /docs` shows every endpoint with correct request/response shapes
- [ ] Unauthenticated requests to protected endpoints return `401`
- [ ] A user cannot read or modify another user's data (returns `403` or `404`)
- [ ] All CRUD operations work end-to-end via `/docs`
- [ ] Frontend `api.ts` client can hit every new endpoint without CORS errors

---

## Phase 6 — File Storage
**Goal:** Handle uploads and downloads of PDFs, images, and generated bundles reliably.

### Architecture questions to answer first
- Are files stored on local disk (fine for dev) or S3/cloud (needed for production)?
- How are files named to avoid collisions? (UUIDs recommended)
- How does the frontend download a file — direct link or API endpoint?
- How do we protect file downloads so only authorised users can access them?

### Steps
1. Define a base upload directory in `config.py`
2. Write a shared `save_file()` utility that generates a UUID filename and saves to disk
3. Write download endpoints that accept a `token` query param (not `Authorization` header — browsers don't send it on `<a href>` clicks)
4. For production: swap local disk for S3-compatible storage

### Testing & Validation
- [ ] Upload a PDF — confirm file appears on disk with a UUID name
- [ ] Download the file via the endpoint — confirm the correct file is returned
- [ ] Attempt to download another user's file — confirm `403`
- [ ] Delete the DB record — confirm the file is also deleted from disk
- [ ] Upload a non-PDF to a PDF-only endpoint — confirm `400` error

---

## Phase 7 — Authentication & Permissions
**Goal:** Ensure every user can only see and modify their own data.

### Architecture questions to answer first
- What data does the JWT token carry (user ID, role, expiry)?
- How long should tokens last before expiring?
- How do we handle the two roles (litigant vs specialist) — separate token claims or separate user flags?

### Steps
1. JWT token issued on login, contains `user_id` and `role`
2. `get_current_user()` dependency reads and validates token on every protected request
3. Service functions check `current_user.id == resource.user_id` before returning data
4. Role checks: certain endpoints only for `specialist`, others only for `litigant`

### Testing & Validation
- [ ] Login returns a JWT token
- [ ] Token sent in `Authorization: Bearer` header grants access
- [ ] Expired token returns `401`
- [ ] Tampered token returns `401`
- [ ] Litigant-only endpoints return `403` when called by a specialist, and vice versa

---

## Phase 8 — Seeding & Migrations
**Goal:** Populate the database with realistic demo data, and handle schema changes safely as the app evolves.

### Architecture questions to answer first
- What demo data is needed to demonstrate every feature end-to-end?
- How do we add a new column to an existing table without losing data?

### Steps
1. Write/update `seed_marketplace.py` to cover all new tables
2. For schema changes: use `ALTER TABLE` SQL statements (SQLAlchemy `create_all` does not add new columns)
3. Document every migration as a numbered SQL command in `.planning/migrations.md`

### Testing & Validation
- [ ] `python seed_marketplace.py` runs without errors on a fresh database
- [ ] All seeded data is visible in the frontend
- [ ] Adding a new column via `ALTER TABLE` preserves existing rows
- [ ] Running seed twice does not create duplicate records

---

## Phase 9 — API Testing
**Goal:** Confirm every endpoint works correctly under normal and edge-case conditions.

### Architecture questions to answer first
- Do we write automated tests or test manually via `/docs`?
- What are the most critical user journeys to test end-to-end?

### Steps
1. Test happy path for every endpoint (correct data → success response)
2. Test validation errors (missing fields, wrong types → `422`)
3. Test auth errors (no token, wrong user → `401`/`403`)
4. Test the two most important end-to-end journeys:
   - Litigant creates case → uploads evidence → generates bundle → posts to marketplace → accepts bid
   - Specialist browses marketplace → places bid → gets accepted → messages litigant

### Testing & Validation
- [ ] Every endpoint returns the documented response shape
- [ ] No endpoint crashes with a 500 error on bad input
- [ ] End-to-end journey 1 completes successfully
- [ ] End-to-end journey 2 completes successfully
- [ ] Frontend shows no console errors during these journeys

---

## Phase 10 — Deployment
**Goal:** Put the backend on a public server so the frontend (Vercel) can reach it.

### Architecture questions to answer first
- Are we staying on Render or moving to another provider?
- Do we switch from SQLite to PostgreSQL for production?
- Where do uploaded files live in production (Render disk is ephemeral — files are lost on redeploy)?

### Steps
1. Swap SQLite connection string for PostgreSQL in production `config.py`
2. Set all secrets (API keys, DB URL, JWT secret) as environment variables — never in code
3. Point Vercel frontend `NEXT_PUBLIC_API_URL` to the Render backend URL
4. Run seed script once against the production database

### Testing & Validation
- [ ] Backend URL is reachable from a browser (`/docs` loads)
- [ ] Frontend on Vercel successfully calls the Render backend
- [ ] File uploads work (files are not lost on redeploy — use persistent storage or S3)
- [ ] JWT auth works end-to-end in production
- [ ] No secrets are visible in the codebase or Vercel/Render logs

---

## Current Status

| Phase | Status |
|-------|--------|
| 1 — Schema Design | 🔄 In progress |
| 2 — Models | ✅ Partially built (22 tables exist) |
| 3 — Schemas | ✅ Partially built |
| 4 — Services | ✅ Partially built |
| 5 — Routers | ✅ Partially built |
| 6 — File Storage | ✅ Partially built (local disk only) |
| 7 — Auth & Permissions | ✅ Built |
| 8 — Seeding & Migrations | ✅ Partially built |
| 9 — API Testing | ❌ Not started |
| 10 — Deployment | ✅ Live on Render + Vercel |
