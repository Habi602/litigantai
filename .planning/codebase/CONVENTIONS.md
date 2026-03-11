# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- React components: PascalCase, `.tsx` — `CaseCard.tsx`, `FactsPanel.tsx`, `WizardBundleStep.tsx`
- Next.js pages: lowercase `page.tsx` inside route directories — `app/(litigation)/cases/page.tsx`
- Custom hooks: camelCase prefixed with `use`, `.ts` — `useCases.ts`, `useEvidence.ts`, `useMarketplace.ts`
- Backend routers: snake_case — `bundle_service.py`, `legal_analysis.py`
- Backend models/schemas/services: snake_case matching the domain — `case.py`, `bundle.py`

**Functions:**
- Frontend: camelCase — `fetchCases`, `handleNewCase`, `handleDelete`, `uploadFiles`
- Backend Python: snake_case — `create_bundle`, `hash_pdf_page`, `get_current_user`
- Private helpers (Python): underscore-prefixed — `_get_case`, `_get_bundle`, `_generate_bundle_pdf`, `_add_link_annotation`
- Event handlers: `handle` prefix — `handleDelete`, `handleFinish`, `handleSave`

**Variables:**
- Frontend: camelCase — `caseData`, `activeStep`, `bundleId`, `isNewCase`
- Backend: snake_case — `case_id`, `bundle_page_num`, `hash_to_page_id`
- Boolean flags: `is` prefix — `isNewCase`, `isPublished`, `is_active`, `is_critical`, `is_duplicate_of`
- Loading states: `loading`, `saving`, `deleting`, `publishing` — always boolean

**Types (TypeScript):**
- Interfaces: PascalCase — `Case`, `Evidence`, `BundleCreate`, `AuthContextType`
- Request/create shapes: `{Entity}Create` suffix — `CaseCreate`, `BidCreate`, `BundleCreate`
- Response shapes: `{Entity}Response` suffix in Python schemas — `BundleResponse`, `BundleDetailResponse`
- Extended types: `{Entity}Detail` or `{Entity}Enriched` — `EvidenceDetail`, `MarketplaceListingEnriched`
- Union types / string literals: PascalCase type alias — `Step`, `View`, `Section`

**Constants:**
- Frontend: SCREAMING_SNAKE_CASE — `STEPS`, `STEP_LABELS`, `DASHBOARD_SECTIONS`, `IMPORTANCE_ORDER`
- Backend Python: SCREAMING_SNAKE_CASE — `IMAGE_MIME_TYPES`, `COLOR_MAP`

## Code Style

**Formatting:**
- No Prettier config detected; ESLint from `eslint-config-next` (core-web-vitals + typescript) via `eslint.config.mjs`
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- Target: ES2017, module resolution: bundler

**Linting:**
- ESLint 9 with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Key enforced rule: use `&apos;` not `'` inside JSX text content (Next.js lint rule)
- Run: `eslint` (from `frontend/`)

**TypeScript:**
- Strict mode — no implicit `any`, strict null checks
- `noEmit: true` — TypeScript only for type-checking, not compilation
- Path alias `@/` maps to `frontend/src/`

## Import Organization

**Frontend order (observed consistently):**
1. React/Next.js imports — `useState`, `useEffect`, `useCallback`, `useRouter`, `useParams`
2. Internal hooks — `@/hooks/useCases`, `@/hooks/useEvidence`
3. Internal components — `@/components/ui/Button`, `@/components/cases/CaseCard`
4. Types — `@/lib/types`
5. Utilities — `@/lib/api`, `@/lib/utils`

**Path Aliases:**
- Use `@/` for all internal imports — never use relative `../` paths
- Example: `import { api } from "@/lib/api"` not `import { api } from "../../lib/api"`

**Backend order (observed consistently):**
1. Standard library — `datetime`, `os`, `hashlib`, `io`, `json`, `pathlib`
2. Third-party — `fastapi`, `sqlalchemy`, `pydantic`, `anthropic`, `PyPDF2`
3. Internal app — `app.config`, `app.database`, `app.models.*`, `app.schemas.*`, `app.services.*`

## Error Handling

**Frontend hooks pattern** — catch errors and store in local `error` state:
```typescript
const [error, setError] = useState<string | null>(null);
try {
  setLoading(true);
  const data = await api.get<T>(path);
  setError(null);
} catch (e) {
  setError(e instanceof Error ? e.message : "Failed to fetch X");
} finally {
  setLoading(false);
}
```

**Frontend components** — render error inline as red text, never throw:
```tsx
if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
```

**Frontend action handlers** — catch and set local error state with descriptive strings:
```typescript
} catch (e) {
  setPublishError(e instanceof Error ? e.message : "Failed to publish. Please try again.");
}
```

**Backend routers** — raise `HTTPException` directly for known error cases:
```python
raise HTTPException(status_code=404, detail="Case not found")
raise HTTPException(status_code=400, detail=str(e))
```

**Backend services** — raise `ValueError` for business-logic errors; routers catch and convert to `HTTPException`:
```python
raise ValueError("Evidence file not found")  # in service
# router catches:
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
```

**Backend AI/PDF operations** — catch `Exception` broadly and set status to `"error"`, never propagate:
```python
try:
    _generate_bundle_pdf(db, bundle)
    bundle.status = "ready"
except Exception:
    bundle.status = "error"
```

**`api.ts` global handler** — auto-redirects to `/login` on 401 and clears token:
```typescript
if (res.status === 401) {
  localStorage.removeItem("token");
  window.location.href = "/login";
  throw new ApiError(401, "Unauthorized");
}
```

## Logging

**Framework:** None — no logging library configured on backend or frontend

**Patterns:**
- Backend: `print()` used only in seed scripts (`backend/app/seed.py`), not in production app code
- Frontend: no `console.log` / `console.warn` / `console.error` in source files
- AI/PDF error details are silently swallowed in services; status field is set to `"error"` as the only signal

## Comments

**When to Comment:**
- Function-level docstrings on all service functions in Python — single line, describes what the function does
- Inline section headers using `# ── Section name ──` banners in large TSX files
- Inline comments for non-obvious logic (dedup detection, PDF annotation building)
- Never comment out dead code — delete it

**Docstrings (Python):**
```python
def create_bundle(db: Session, case_id: int, title: str, evidence_ids: list[int]) -> Bundle:
    """Create a new bundle from selected evidence."""
```

**Inline banners (TSX):**
```tsx
// ── Page header ──────────────────────────────────────────────────────────────
// ── Overview ─────────────────────────────────────────────────────────────────
// ── Wizard ───────────────────────────────────────────────────────────────────
```

## Function Design

**Size:** Keep functions small; extract private helpers for complex sub-operations (e.g., `_get_pdf_reader`, `_add_link_annotation`, `_renumber_pages`, `_remap_links`)

**Parameters:** Functions accept primitives or typed objects — use `db: Session` as first param in all backend service functions

**Return Values:**
- Backend services return ORM model instances (SQLAlchemy `Mapped` objects), not raw dicts
- Frontend hooks return named object: `return { data, loading, error, fetchFn, mutateFn }`
- Mutation functions in hooks return the created/updated object for use by the caller

## Module Design

**Frontend Exports:**
- Named exports only — no default exports from hooks, components, or utilities
- Pages use `export default function PageName()` (Next.js requirement)
- All types in `src/lib/types.ts` — no co-located type files except in `context/`

**React Component Pattern:**
- All interactive components require `"use client"` directive at top of file
- Props interfaces defined inline above component: `interface ComponentProps { ... }`
- Sub-components defined in the same file when tightly coupled (e.g., `FactRow` inside `FactsPanel.tsx`)
- Lookup maps (Record types) defined at module scope as constants, not inside render

**Backend Module Pattern:**
- Routers import services as a module: `from app.services import bundle_service` then call `bundle_service.create_bundle(...)`
- Private helper functions `_get_case`, `_get_bundle` defined at top of each router file as authorization guards
- `model_config = {"from_attributes": True}` required on all Pydantic response schemas that serialize ORM objects

## Data and State Patterns

**Optimistic updates in hooks:** After successful mutation, update local state immediately without re-fetching:
```typescript
const createCase = async (data: CaseCreate) => {
  const created = await api.post<Case>("/cases", data);
  setCases((prev) => [created, ...prev]);  // prepend new item
  return created;
};
const deleteCase = async (id: number) => {
  await api.delete(`/cases/${id}`);
  setCases((prev) => prev.filter((c) => c.id !== id));
};
```

**Loading state pattern:** Every hook exposes `loading: boolean` initialized to `true`, set to `false` in `finally`:
```typescript
const [loading, setLoading] = useState(true);
// ...
} finally { setLoading(false); }
```

**Tailwind CSS:**
- Use `cn()` utility from `@/lib/utils` to conditionally join class names
- Inline conditional classes with template strings for simple cases
- Variant lookup objects (Records) preferred over long ternary chains

**SQLAlchemy session pattern:**
- `db.add(obj)` → `db.flush()` → work with IDs → `db.commit()` → `db.refresh(obj)` → return
- Use `db.flush()` to get auto-generated IDs before `db.commit()`

---

*Convention analysis: 2026-03-11*
