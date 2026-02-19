# Technical Specification — NoahLaw

## System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser    │◄───►│  Next.js :3000    │◄───►│  FastAPI :8000    │
│              │     │  (App Router)     │     │  (REST API)       │
└─────────────┘     └──────────────────┘     └────────┬─────────┘
                                                       │
                                              ┌────────┴─────────┐
                                              │                  │
                                        ┌─────┴─────┐   ┌───────┴───────┐
                                        │  SQLite    │   │ Anthropic API │
                                        │ storage.db │   │ (Claude)      │
                                        └───────────┘   └───────────────┘
```

- **Frontend** (Next.js 16): Server-side rendering + client components. Communicates with backend via REST.
- **Backend** (FastAPI): Stateless API server. Handles auth, business logic, file I/O, and AI orchestration.
- **Database** (SQLite): Single-file DB at `backend/storage.db`. All tables auto-created via SQLAlchemy `create_all()`.
- **AI** (Anthropic Claude): Called server-side from `ai_service.py` for evidence analysis, legal analysis, timeline generation, and specialist matching.

## Data Model

### 18 Tables

#### Core
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `users` | id, username, hashed_password, full_name, is_active | → specialist_profiles, cases |
| `cases` | id, user_id (FK→users), title, case_number, case_type, status | → evidence, timeline_events, bundles, legal_analysis, marketplace_listings, collaborators |

#### Evidence & Analysis
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `evidence` | id, case_id (FK→cases), filename, file_path, mime_type, extracted_text, ai_summary, analysis_status | → key_facts, timeline_events, analysis_gaps |
| `key_facts` | id, evidence_id (FK→evidence), fact_text, fact_type, importance | |
| `timeline_events` | id, case_id, evidence_id, event_date, title, event_type, relevance_score, is_critical | |
| `case_legal_analysis` | id, case_id (FK→cases), legal_positioning, strengths (JSON), weaknesses (JSON), relevant_case_law (JSON), relevant_legislation (JSON) | |
| `evidence_analysis_gaps` | id, evidence_id (FK→evidence), gap_text, gap_type, resolved | |

#### Bundles
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `bundles` | id, case_id (FK→cases), title, status, file_path, total_pages | → bundle_pages, bundle_links, bundle_highlights |
| `bundle_pages` | id, bundle_id, evidence_id, source_page_number, bundle_page_number, section_title | |
| `bundle_links` | id, bundle_id, source_page, target_page, x, y, width, height, label | |
| `bundle_highlights` | id, bundle_id, page_number, x, y, width, height, color, note | |

#### Marketplace
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `specialist_profiles` | id, user_id (FK→users), practice_areas (JSON), years_experience, bar_number, jurisdiction, hourly_rate, availability | |
| `marketplace_listings` | id, case_id (FK→cases), user_id, title, redacted_summary, case_category, status | → case_matches, bids |
| `case_matches` | id, listing_id (FK→marketplace_listings), specialist_id (FK→specialist_profiles), relevance_score, rationale | |
| `bids` | id, listing_id, specialist_id, message, price_structure, estimated_amount, estimated_hours, status | |

#### Collaboration
| Table | Key Columns | Relationships |
|-------|------------|---------------|
| `case_collaborators` | id, case_id (FK→cases), user_id (FK→users), role, bid_id | |
| `case_notes` | id, case_id, user_id, evidence_id, content, note_type | |
| `case_documents` | id, case_id, user_id, filename, file_path, description | |

## API Design

All endpoints prefixed with `/api/v1`. Authentication via `Authorization: Bearer <jwt>` header.

### Auth (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /login | Login, returns JWT |
| POST | /register | Create account |
| GET | /me | Get current user |

### Cases (`/api/v1/cases`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List user's cases |
| POST | / | Create case |
| GET | /{case_id} | Get case details |
| PUT | /{case_id} | Update case |
| DELETE | /{case_id} | Delete case |

### Evidence (`/api/v1/evidence`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List evidence for a case |
| POST | / | Upload evidence file |
| GET | /{evidence_id} | Get evidence details |
| DELETE | /{evidence_id} | Delete evidence |
| GET | /{evidence_id}/file | Download file |
| POST | /{evidence_id}/analyze | Trigger AI analysis |

### Timeline (`/api/v1/timeline`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List timeline events |
| POST | /generate | AI-generate timeline from evidence |
| PUT | /{event_id} | Update event |
| DELETE | /{event_id} | Delete event |

### Bundles (`/api/v1/bundles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | List bundles |
| POST | / | Create bundle |
| GET | /{bundle_id} | Get bundle details |
| DELETE | /{bundle_id} | Delete bundle |
| POST | /{bundle_id}/evidence | Add evidence to bundle |
| DELETE | /{bundle_id}/evidence | Remove evidence |
| GET | /{bundle_id}/file | Download PDF |
| POST | /{bundle_id}/regenerate | Regenerate PDF |
| POST | /{bundle_id}/links | Add hyperlink |
| DELETE | /{bundle_id}/links/{link_id} | Remove hyperlink |
| POST | /{bundle_id}/highlights | Add highlight |
| DELETE | /{bundle_id}/highlights/{id} | Remove highlight |

### Legal Analysis (`/api/v1/legal-analysis`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cases/{case_id}/legal-analysis | Get/generate legal analysis |
| GET | /evidence/{evidence_id}/gaps | Get evidence gaps |
| PUT | /evidence/gaps/{gap_id}/resolve | Mark gap resolved |

### Marketplace (`/api/v1/marketplace`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /listings | Browse all listings |
| GET | /my-listings | User's listings |
| GET | /my-listings-enriched | Listings with collaboration data |
| GET | /my-matches | Specialist's matched cases |
| GET | /my-bids | Specialist's bids |
| GET | /listings/{listing_id} | Listing details |
| POST | /cases/{case_id}/publish | Publish case to marketplace |
| DELETE | /listings/{listing_id} | Unpublish listing |
| GET | /listings/{listing_id}/bids | Get bids for listing |
| POST | /listings/{listing_id}/bids | Submit bid |
| PUT | /bids/{bid_id}/accept | Accept bid |
| PUT | /bids/{bid_id}/withdraw | Withdraw bid |

### Specialists (`/api/v1/specialists`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /profile | Create profile |
| GET | /profile | Get own profile |
| PUT | /profile | Update profile |
| GET | / | List all specialists |
| GET | /{specialist_id} | Get specialist details |

### Collaboration (`/api/v1/collaboration`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /cases/{case_id}/collaborators | List collaborators |
| GET | /cases/{case_id}/notes | List notes |
| POST | /cases/{case_id}/notes | Create note |
| PUT | /notes/{note_id} | Update note |
| DELETE | /notes/{note_id} | Delete note |
| GET | /cases/{case_id}/documents | List documents |
| POST | /cases/{case_id}/documents | Upload document |
| GET | /my-cases | Cases I collaborate on |

## AI Integration

Five AI-powered features, all using Anthropic Claude via `backend/app/services/ai_service.py`:

| Feature | Trigger | Input | Output |
|---------|---------|-------|--------|
| Evidence Analysis | POST /evidence/{id}/analyze | Extracted text from uploaded file | AI summary, key facts (with types + importance), evidence gaps |
| Timeline Generation | POST /timeline/generate | All evidence texts for a case | Timeline events with dates, descriptions, relevance scores |
| Legal Analysis | GET /legal-analysis/cases/{id} | Case details + all evidence summaries | Legal positioning, strengths, weaknesses, case law, legislation, open questions |
| Specialist Matching | Triggered on marketplace publish | Listing details + specialist profiles | Relevance scores + match rationale per specialist |
| Gap Detection | Part of evidence analysis | Individual evidence text | Missing information, contradictions, areas needing clarification |

## Frontend Page Map

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing / gate page | Done |
| `/login` | Login form | Done |
| `/cases` | Case list dashboard | Done |
| `/cases/new` | Create case form | Done |
| `/cases/[id]` | Case detail (tabs: summary, evidence, timeline, bundles, legal analysis, collaboration) | Done |
| `/cases/[id]/evidence/[eid]` | Evidence detail + AI analysis results | Done |
| `/cases/[id]/bundle/[bundleId]` | Bundle viewer with annotations | Done |
| `/marketplace` | Browse marketplace listings | Done |
| `/marketplace/[listingId]` | Listing detail + bid submission | Done |
| `/marketplace/my-listings` | User's published listings | Done |
| `/marketplace/my-bids` | User's submitted bids | Done |
| `/specialist/profile` | Specialist profile form | Done |

## Security Considerations

### Current Implementation
- **JWT:** Default secret key in `config.py` — must override via `SECRET_KEY` env var in production
- **CORS:** Allows `http://localhost:3000` — needs restriction in production
- **Token storage:** JWT in `localStorage` (vulnerable to XSS; consider `httpOnly` cookies)
- **File uploads:** Stored on local filesystem in `backend/uploads/`
- **No rate limiting:** API endpoints are unprotected against abuse
- **No CSRF protection:** Relies on JWT Bearer tokens (stateless, so CSRF is less relevant but still worth reviewing)

### Recommendations for Production
- Rotate JWT secret, reduce token expiry
- Add rate limiting (e.g., `slowapi`)
- Migrate token to `httpOnly` secure cookies
- Add input sanitization middleware
- Implement file type validation beyond MIME type
- Add request logging and audit trail

## Future Technical Requirements

| Feature | Technology | Phase |
|---------|-----------|-------|
| Specialist portal | New Next.js route group + components | Phase 2 |
| Payment processing | Stripe API integration | Phase 3 |
| Real-time notifications | WebSocket (FastAPI WebSocket + client) | Phase 3 |
| Backend testing | pytest + httpx (AsyncClient) | Phase 2 |
| Frontend testing | Vitest + React Testing Library | Phase 2 |
| Containerization | Docker + docker-compose | Phase 2 |
| CI/CD | GitHub Actions | Phase 2 |
| Production DB | PostgreSQL (SQLAlchemy dialect swap) | Phase 2 |
| File storage | AWS S3 or compatible object storage | Phase 3 |
