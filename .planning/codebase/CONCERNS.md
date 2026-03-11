# Codebase Concerns

**Analysis Date:** 2026-03-11

## Tech Debt

**Hardcoded localhost URLs (multiple files):**
- Issue: `http://localhost:8000/api/v1` is hardcoded in several files outside the central `api.ts`. This will break in any non-localhost environment.
- Files:
  - `frontend/src/lib/api.ts:1` — `const API_BASE = "http://localhost:8000/api/v1"`
  - `frontend/src/hooks/useBundle.ts:96` — raw `fetch` with hardcoded localhost for DELETE with body
  - `frontend/src/hooks/useBundle.ts:152` — `getPdfUrl()` builds localhost URL directly
  - `frontend/src/components/cases/WizardBundleStep.tsx:40` — bundle PDF URL builder
  - `frontend/src/components/cases/MyFilesPanel.tsx:12` — bundle PDF URL builder
  - `frontend/src/components/cases/EvidenceViewer.tsx:3` — `const API_BASE = "http://localhost:8000/api/v1"`
- Impact: Zero changes needed for dev, but deployment to any staging/production host fails silently. PDF and file serving breaks entirely.
- Fix approach: Extract `NEXT_PUBLIC_API_BASE` env var. Replace all hardcoded strings. The `api.ts` constant should become `const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1"`. The file URL builders should reference the same constant.

**`api.ts` lacks DELETE-with-body support:**
- Issue: The `api.delete` helper does not accept a request body. The bundle evidence removal endpoint (`DELETE /bundles/{id}/evidence`) requires a JSON body. `useBundle.ts` works around this with an inline raw `fetch` call to `localhost:8000` that bypasses the API client entirely.
- Files: `frontend/src/hooks/useBundle.ts:89-108`, `frontend/src/lib/api.ts:89`
- Impact: Auth token management, error handling, and base URL changes are not applied to this request. Breaking the API client contract increases maintenance risk.
- Fix approach: Add `api.deleteWithBody<T>(path, data)` method to `api.ts` using `{ method: "DELETE", body: JSON.stringify(data) }`. Update `useBundle.ts` to use it.

**No database migration tooling:**
- Issue: The project uses `Base.metadata.create_all()` on startup instead of Alembic. Adding new columns to existing tables requires manual `ALTER TABLE` SQL as documented in `CLAUDE.md`. There is no migration history, rollback capability, or schema versioning.
- Files: `backend/app/main.py:7`, `backend/app/database.py`
- Impact: Schema changes in production require manual intervention. Risk of schema drift between environments. Cannot reliably roll back schema changes.
- Fix approach: Add Alembic to `requirements.txt`. Run `alembic init migrations` and configure to use the existing `Settings.DATABASE_URL`. Generate initial migration from current models. Remove manual `ALTER TABLE` workaround from `CLAUDE.md`.

**Unpinned dependencies in `requirements.txt`:**
- Issue: `backend/requirements.txt` has no version pins for any package (e.g., `fastapi`, `sqlalchemy`, `anthropic`, `PyPDF2`). Key packages like `pdfplumber`, `anthropic`, `Pillow`, and `python-docx` are not even listed — they are imported at runtime and installed as transitive dependencies.
- Files: `backend/requirements.txt`
- Impact: `pip install` produces non-reproducible builds. Upstream breaking changes can silently break PDF processing, AI analysis, or auth. `pdfplumber`, `anthropic`, `Pillow`, and `python-docx` should be explicit direct dependencies.
- Fix approach: Pin all dependencies with `pip freeze > requirements.txt`. Add `pdfplumber`, `anthropic`, `Pillow`, and `python-docx` as explicit entries.

**`is_active` flag is not enforced:**
- Issue: `User.is_active` exists on the model and is included in `UserResponse`, but `get_current_user` and `get_user_from_token` never check it. A deactivated user can still authenticate and perform all operations.
- Files: `backend/app/models/user.py:17`, `backend/app/services/auth.py:33-74`
- Impact: Account suspension/deactivation has no effect.
- Fix approach: Add `if not user.is_active: raise credentials_exception` check in both `get_current_user` and `get_user_from_token`.

**`datetime.utcnow` deprecated throughout models:**
- Issue: All 11 model files use `datetime.utcnow` as the `default` for `DateTime` columns. `datetime.utcnow()` is deprecated in Python 3.12+ and will be removed in a future version.
- Files: `backend/app/models/bundle.py`, `backend/app/models/case.py`, `backend/app/models/user.py`, `backend/app/models/timeline_event.py`, `backend/app/models/key_fact.py`, `backend/app/models/legal_analysis.py`, `backend/app/models/collaboration.py`, `backend/app/models/marketplace.py`, `backend/app/routers/legal_analysis.py:80`
- Impact: Deprecation warnings on Python 3.12+. Will break on Python 3.14+ if not addressed.
- Fix approach: Replace `default=datetime.utcnow` with `default=lambda: datetime.now(timezone.utc)` and `onupdate=lambda: datetime.now(timezone.utc)`. Import `timezone` from `datetime`.

**Duplicate JWT decode logic:**
- Issue: `get_user_from_token` and `get_current_user` in `backend/app/services/auth.py` contain identical JWT decode and user lookup code. Only the injection mechanism differs.
- Files: `backend/app/services/auth.py:33-74`
- Impact: Bug fixes or changes must be applied twice.
- Fix approach: Refactor `get_current_user` to call `get_user_from_token` after extracting the token string from the OAuth2 scheme.

**Evidence count uses lazy-loaded relationship instead of COUNT query:**
- Issue: `list_cases` and `get_case` in `backend/app/routers/cases.py` compute `evidence_count` using `len(case.evidence)`, which triggers SQLAlchemy lazy loading — fetching all evidence rows just to count them.
- Files: `backend/app/routers/cases.py:35`, `backend/app/routers/cases.py:65`
- Impact: For cases with many evidence items this loads potentially hundreds of rows from disk on every case list request.
- Fix approach: Replace `len(case.evidence)` with a `db.query(func.count(Evidence.id)).filter(Evidence.case_id == case.id).scalar()` or use a SQLAlchemy `column_property`.

---

## Security Considerations

**Server-side file paths exposed in API responses:**
- Risk: `EvidenceResponse`, bundle schemas, and `CaseDocumentResponse` include `file_path` — the raw filesystem path (e.g., `uploads/7/abc123_contract.pdf`). This leaks the server's directory structure.
- Files: `backend/app/schemas/evidence.py:10`, `backend/app/schemas/bundle.py:95`, `backend/app/schemas/collaboration.py:48`
- Current mitigation: None.
- Recommendations: Remove `file_path` from all API response schemas. Files should only be accessible via the authenticated `/file` endpoints.

**Extracted document text exposed in API response:**
- Risk: `EvidenceResponse` includes the full `extracted_text` field (up to 100,000 characters of document content). This is returned on every list-evidence call, including to specialist collaborators.
- Files: `backend/app/schemas/evidence.py:14`
- Current mitigation: None. Collaborators with read access receive full extracted text.
- Recommendations: Move `extracted_text` to `EvidenceDetailResponse` only. Remove it from the list endpoint response schema.

**`SECRET_KEY` has an insecure default:**
- Issue: `backend/app/config.py:5` sets `SECRET_KEY: str = "super-secret-key-change-in-production"`. If the `.env` file is missing or `SECRET_KEY` is not set, the insecure default is used silently with no warning.
- Files: `backend/app/config.py:5`
- Current mitigation: None.
- Recommendations: Remove the default. If `SECRET_KEY` is unset, raise a `ValueError` at startup: `@validator("SECRET_KEY") def key_must_be_set(cls, v): ...` or use `Field(...)` with no default.

**`ANTHROPIC_API_KEY` accessed via `os.environ` in one location, bypassing `settings`:**
- Issue: `backend/app/routers/bundles.py:295` accesses the API key via `os.environ["ANTHROPIC_API_KEY"]` directly instead of `settings.ANTHROPIC_API_KEY`. This raises `KeyError` if the key is not set, rather than the informative `RuntimeError` from `_get_client()`.
- Files: `backend/app/routers/bundles.py:295`
- Current mitigation: None.
- Recommendations: Replace `os.environ["ANTHROPIC_API_KEY"]` with `settings.ANTHROPIC_API_KEY` and use `_get_client()` from `ai_service`.

**No rate limiting on auth endpoints:**
- Issue: `POST /api/v1/auth/login` and `POST /api/v1/auth/register` have no rate limiting or brute-force protection.
- Files: `backend/app/routers/auth.py`
- Current mitigation: None.
- Recommendations: Add `slowapi` or a custom middleware to limit login attempts per IP. Consider lockout after N failed attempts.

**Token exposed as URL query parameter:**
- Issue: File download endpoints (`/evidence/{id}/file`, `/bundles/{id}/file`) accept the JWT as a `?token=` query parameter. Tokens in URLs appear in server logs, browser history, and HTTP Referer headers.
- Files: `backend/app/routers/evidence.py:131-136`, `backend/app/routers/bundles.py:154-171`
- Current mitigation: This is a known architectural trade-off (documented in `CLAUDE.md`) due to browser navigation not sending `Authorization` headers.
- Recommendations: Consider using short-lived, single-use signed download tokens instead of the full JWT, or implement a cookie-based auth layer for file serving.

**Specialist matching grants bid-placement capability by unverified role:**
- Issue: Any authenticated user can submit a bid if they have a `CaseMatch` record. Specialist status is determined solely by having a `SpecialistProfile`, which any user can create via `POST /specialists/profile`. There is no verification step.
- Files: `backend/app/services/marketplace_service.py:178-221`, `backend/app/routers/specialists.py`
- Current mitigation: None.
- Recommendations: Add a verification/approval workflow for specialist profiles or at minimum document that this is intentional.

---

## Performance Bottlenecks

**Synchronous AI calls block request threads:**
- Issue: All Anthropic API calls (`analyze_evidence`, `generate_timeline`, `generate_statement_of_claim`, `generate_redacted_summary`, `match_specialists`) are synchronous and block the FastAPI request thread. A single call can take 5-30 seconds.
- Files: `backend/app/services/ai_service.py`, `backend/app/services/marketplace_service.py`, `backend/app/routers/bundles.py:294-326`
- Impact: While one AI call is in flight, the worker thread is blocked. Under concurrent usage (multiple users analyzing evidence simultaneously), Uvicorn worker pool is exhausted.
- Fix approach: Move AI operations to a background task queue (e.g., Celery + Redis, or FastAPI `BackgroundTasks` for simple cases). Return a `202 Accepted` with a status field and poll for completion — the `analysis_status` field already supports this pattern for evidence analysis.

**Specialist matching makes N separate Claude API calls per listing publish:**
- Issue: `match_specialists` calls `_score_specialist` (one Claude API call) for each of up to 20 matched specialists. Publishing a listing can trigger 20 sequential API calls, each taking seconds.
- Files: `backend/app/services/marketplace_service.py:99-140`, `backend/app/services/marketplace_service.py:143-175`
- Impact: Publishing a case to the marketplace can take 30-60+ seconds before the HTTP response returns.
- Fix approach: Run scoring calls in parallel (asyncio or threading), or use a single batched Claude call that scores all specialists at once. Move into a background task.

**Bundle PDF regeneration on every annotation change:**
- Issue: Creating or deleting a single link or highlight triggers a full `_generate_bundle_pdf` call, which re-reads and re-assembles all evidence files from disk.
- Files: `backend/app/routers/bundles.py:204-209`, `backend/app/routers/bundles.py:241-247`, `backend/app/services/bundle_service.py:535-566`
- Impact: For large bundles (many pages), annotation changes are slow and CPU/disk intensive.
- Fix approach: Defer regeneration with a debounce mechanism, or apply annotations as a PDF overlay layer separately from the base bundle assembly.

**N+1 queries in `my_listings_enriched`:**
- Issue: `GET /marketplace/my-listings-enriched` loops over listings and executes 4 separate queries per listing (accepted bid lookup, specialist user lookup, notes count, documents count). For a user with 10 listings this is ~40 queries.
- Files: `backend/app/routers/marketplace.py:74-107`
- Impact: Slow marketplace listing page for power users.
- Fix approach: Use a single query with `joinedload`/`selectinload` for bids, or compute counts in a single aggregated query.

**`list_bids` executes N+2 queries per bid (N+1 pattern):**
- Issue: `_bid_to_response` runs two queries (User lookup + SpecialistProfile lookup) per bid. `GET /marketplace/listings/{id}/bids` executes `2N + 1` queries for N bids.
- Files: `backend/app/routers/marketplace.py:30-41`, `backend/app/routers/marketplace.py:189-205`
- Impact: Slow bid listing for popular marketplace entries.
- Fix approach: Use `joinedload(Bid.specialist)` and preload specialist profiles in a single query.

---

## Fragile Areas

**Bundle page numbering and reorder logic:**
- Files: `backend/app/services/bundle_service.py:278-513`
- Why fragile: `add_evidence_to_bundle` manually shifts page numbers for existing pages, then calls `_renumber_pages` to normalize. If any step fails mid-transaction (e.g., `db.flush()` error inside a loop), the bundle page numbers can be inconsistent. The `reorder_bundle` function deletes all annotations (links + highlights) when reordering, which may be surprising to users.
- Safe modification: Always call `_renumber_pages` after any page insertion/deletion. Test with multi-page PDFs. Consider wrapping the entire operation in a savepoint.
- Test coverage: No automated tests exist.

**`_parse_json_response` in `ai_service.py` silently degrades on malformed AI output:**
- Issue: If Claude returns malformed JSON that cannot be parsed, `_parse_json_response` returns `{"summary": <raw text>, "key_facts": [], "timeline_events": []}`. This means key facts and timeline events are silently discarded without any error being logged.
- Files: `backend/app/services/ai_service.py:301-314`
- Why fragile: Silent data loss. The calling code has no way to distinguish a successful empty result from a parse failure.
- Safe modification: Log the parse failure before returning the fallback dict.

**`except Exception: pass` swallows all errors in critical paths:**
- Issue: Multiple `except Exception:` blocks without logging silently discard errors and continue with degraded state (`bundle.status = "error"`, skipped specialists, etc.).
- Files:
  - `backend/app/services/bundle_service.py:112` — bundle creation failure, stores `None` as `file_path` without logging reason
  - `backend/app/services/marketplace_service.py:133` — specialist scoring failure skipped silently
  - `backend/app/services/bundle_service.py:325`, `:401`, `:485`, `:544`, `:561`, `:575`
  - `backend/app/routers/bundles.py:207`, `:245`
- Impact: Debugging failures in production requires inspecting DB state rather than reading logs. Errors in `match_specialists` mean listings silently get fewer or zero matches.
- Fix approach: At minimum `import logging; logger = logging.getLogger(__name__); logger.exception("message")` inside each bare `except` block.

**Filename not sanitized before use in file path:**
- Issue: `file_service.save_file` uses the raw uploaded filename in the filesystem path: `safe_name = f"{uuid.uuid4().hex}_{filename}"`. A filename containing path separators (e.g., `../../etc/passwd`) could potentially escape the upload directory on some OS/Python versions.
- Files: `backend/app/services/file_service.py:46`
- Current mitigation: The UUID prefix makes path traversal less likely but not impossible. FastAPI may strip some path chars at the boundary.
- Fix approach: Apply `Path(filename).name` to strip directory components before constructing `safe_name`.

---

## Scaling Limits

**SQLite as the production database:**
- Current capacity: Single-file SQLite at `backend/storage.db`. Handles low concurrent read/write traffic.
- Limit: SQLite uses file-level write locking. Under concurrent writes (multiple users uploading evidence, AI analysis callbacks writing results simultaneously), write contention causes slowdowns and potential `database is locked` errors.
- Scaling path: Migrate to PostgreSQL. `config.py` already supports `DATABASE_URL` configuration. Change `connect_args` — remove `check_same_thread` (SQLite-only) and optionally add a connection pool size.

**Uploaded files stored on local disk:**
- Current capacity: Files written to `backend/uploads/{case_id}/`. Scales to available disk on the server.
- Limit: Does not work in multi-instance (horizontal scaling) deployments. Files uploaded to one instance are not visible to other instances.
- Scaling path: Replace `file_service.save_file` with an S3-compatible object storage client. The `file_path` column would store object keys instead of filesystem paths.

**No upload size validation before reading entire file into memory:**
- Issue: `upload_evidence` calls `content = await upload.read()` which reads the entire file into RAM before checking size against `MAX_UPLOAD_SIZE_MB`.
- Files: `backend/app/routers/evidence.py:62-67`
- Impact: A 500MB upload buffers 500MB of RAM before being rejected. Under concurrent large uploads, memory exhaustion is possible.
- Fix approach: Use streaming upload with `UploadFile.read(chunk_size)` in a loop and reject early when the accumulated size exceeds the limit.

---

## Dependencies at Risk

**`PyPDF2` (deprecated):**
- Risk: PyPDF2 was deprecated and superseded by `pypdf`. `bundle_service.py` imports directly from `PyPDF2.generic` using low-level objects. The library is no longer actively maintained.
- Impact: Security vulnerabilities and bugs will not be patched upstream.
- Files: `backend/app/services/bundle_service.py:1-15`
- Migration plan: Replace with `pypdf` (a maintained fork/rewrite). Most APIs are compatible but `PyPDF2.generic` imports need to be updated to `pypdf.generic`.

**`python-jose` JWT library:**
- Risk: `python-jose` has had known CVEs in older versions related to algorithm confusion attacks. It is less actively maintained than alternatives.
- Impact: Potential JWT validation bypass if not pinned to a patched version.
- Files: `backend/app/services/auth.py:4`
- Migration plan: Consider `PyJWT` as a well-maintained alternative, or pin `python-jose` to `>=3.3.0`.

---

## Missing Critical Features

**No background task queue for AI operations:**
- Problem: All AI analysis runs synchronously in the HTTP request lifecycle. Long-running operations (evidence analysis, timeline generation, marketplace publishing with matching) block the response for 10-60 seconds.
- Blocks: Reliable multi-user usage, evidence analysis on large files, marketplace publishing UX.

**No email notifications:**
- Problem: `CaseMatch.notified` field exists in the model and is set to `False` on creation, but no notification mechanism is implemented. Specialists are never informed when they are matched to a new listing.
- Files: `backend/app/models/marketplace.py:83`, `backend/app/services/marketplace_service.py:128`
- Blocks: Core marketplace workflow — specialists have no way to know they have new matches without manually checking the UI.

**Payments are not implemented:**
- Problem: A `frontend/src/components/payments/` directory exists but is empty. There is no payment flow for the bid acceptance workflow — once a bid is accepted, there is no mechanism to handle financial transactions.
- Files: `frontend/src/components/payments/` (empty directory)
- Blocks: Commercial operation of the marketplace.

---

## Test Coverage Gaps

**No automated tests for any backend code:**
- What's not tested: All 10 API routers, all 6 services, all 11 models. No pytest fixtures, no test database, no test client setup.
- Files: Entire `backend/app/` directory
- Risk: Any regression in auth, bundle assembly, marketplace workflow, or AI parsing goes undetected until production.
- Priority: High

**No automated tests for any frontend code:**
- What's not tested: All hooks (`useCases`, `useBundle`, `useMarketplace`, etc.), all components, all API interactions.
- Files: Entire `frontend/src/` directory
- Risk: UI regressions and hook state management bugs are only caught manually.
- Priority: High

**Bundle page numbering logic has no test coverage:**
- What's not tested: `create_bundle`, `reorder_bundle`, `add_evidence_to_bundle`, `remove_evidence_from_bundle`, `_renumber_pages`, `_remap_links`.
- Files: `backend/app/services/bundle_service.py`
- Risk: Page numbering bugs corrupt legal document bundles silently. This is the most algorithmically complex code in the project.
- Priority: High

---

*Concerns audit: 2026-03-11*
