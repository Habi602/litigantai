# Project Status — NoahLaw

> Last updated: 2026-02-18

## Folder Structure

```
litigantai/
├── .claude/
│   └── settings.json              # Claude Code hooks (safety guardrails)
├── backend/
│   ├── .env                       # Environment variables (SECRET_KEY, DB, ANTHROPIC_API_KEY)
│   ├── requirements.txt           # Python dependencies
│   ├── seed_marketplace.py        # Seed script for demo specialists + listings
│   ├── storage.db                 # SQLite database
│   ├── venv/                      # Python virtual environment
│   └── app/
│       ├── __init__.py
│       ├── main.py                # FastAPI app, CORS config, router registration
│       ├── config.py              # Pydantic Settings (reads .env)
│       ├── database.py            # SQLAlchemy engine, SessionLocal, Base
│       ├── seed.py                # DB seeding utility
│       ├── models/
│       │   ├── __init__.py
│       │   ├── user.py            # users table
│       │   ├── case.py            # cases table
│       │   ├── evidence.py        # evidence table
│       │   ├── key_fact.py        # key_facts table
│       │   ├── timeline_event.py  # timeline_events table
│       │   ├── bundle.py          # bundles, bundle_pages, bundle_links, bundle_highlights
│       │   ├── legal_analysis.py  # case_legal_analysis, evidence_analysis_gaps
│       │   ├── collaboration.py   # case_collaborators, case_notes, case_documents
│       │   └── marketplace.py     # specialist_profiles, marketplace_listings, case_matches, bids
│       ├── routers/
│       │   ├── __init__.py
│       │   ├── auth.py            # /api/v1/auth — login, register, me
│       │   ├── cases.py           # /api/v1/cases — CRUD
│       │   ├── evidence.py        # /api/v1/evidence — upload, analyze, download
│       │   ├── timeline.py        # /api/v1/timeline — list, generate, edit
│       │   ├── bundles.py         # /api/v1/bundles — create, manage, PDF
│       │   ├── legal_analysis.py  # /api/v1/legal-analysis — analysis, gaps
│       │   ├── marketplace.py     # /api/v1/marketplace — listings, bids, matches
│       │   ├── specialists.py     # /api/v1/specialists — profiles
│       │   └── collaboration.py   # /api/v1/collaboration — notes, documents, collaborators
│       ├── schemas/
│       │   ├── auth.py
│       │   ├── case.py
│       │   ├── evidence.py
│       │   ├── timeline.py
│       │   ├── bundle.py
│       │   ├── marketplace.py
│       │   ├── legal_analysis.py
│       │   └── collaboration.py
│       └── services/
│           ├── auth.py            # Password hashing, JWT creation/verification
│           ├── ai_service.py      # Anthropic Claude integration (5 AI features)
│           ├── file_service.py    # File upload/download handling
│           ├── bundle_service.py  # PDF bundle generation
│           ├── marketplace_service.py  # AI specialist matching
│           └── collaboration_service.py # Collaboration utilities
├── frontend/
│   ├── package.json               # Next.js 16.1.6, React 19.2.3, Tailwind 4, TS 5
│   ├── tsconfig.json              # Path aliases (@/ → src/)
│   ├── next.config.ts
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── node_modules/
│   ├── .next/                     # Build output
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root layout
│       │   ├── page.tsx           # Landing page
│       │   ├── globals.css        # Global styles + Tailwind
│       │   ├── login/
│       │   │   └── page.tsx       # Login page
│       │   └── (litigation)/
│       │       ├── layout.tsx     # Sidebar + header layout
│       │       ├── cases/
│       │       │   ├── page.tsx           # Cases list
│       │       │   ├── new/page.tsx       # Create case
│       │       │   └── [id]/
│       │       │       ├── page.tsx       # Case detail (tabbed)
│       │       │       ├── evidence/
│       │       │       │   └── [eid]/page.tsx  # Evidence detail
│       │       │       └── bundle/
│       │       │           └── [bundleId]/page.tsx  # Bundle viewer
│       │       ├── marketplace/
│       │       │   ├── page.tsx           # Browse listings
│       │       │   ├── [listingId]/page.tsx # Listing detail
│       │       │   ├── my-listings/page.tsx # My listings
│       │       │   └── my-bids/page.tsx   # My bids
│       │       └── specialist/
│       │           └── profile/page.tsx   # Specialist profile form
│       ├── components/
│       │   ├── layout/
│       │   │   └── Header.tsx
│       │   ├── litigation/
│       │   │   ├── LitigationHeader.tsx
│       │   │   └── LitigationSidebar.tsx
│       │   ├── cases/             # 15 components (BundleBuilder, BundleViewer, CaseCard, CaseForm, CaseSummary, CollaborationPanel, EvidenceGapsList, EvidenceList, EvidenceUploader, EvidenceViewer, KeyFactsList, LegalAnalysisPanel, PublishToMarketplace, TimelineEventCard, TimelineView)
│       │   ├── marketplace/       # 7 components (BidCard, EnrichedListingCard, LawyerCard, ListingCard, ListingDetail, SpecialistCard, SpecialistProfileForm)
│       │   └── ui/                # 6 components (Badge, Button, Card, Input, Modal, Spinner)
│       ├── context/
│       │   └── AuthContext.tsx     # JWT auth state management
│       ├── hooks/
│       │   ├── useCases.ts
│       │   ├── useEvidence.ts
│       │   ├── useTimeline.ts
│       │   ├── useBundle.ts
│       │   ├── useLegalAnalysis.ts
│       │   ├── useMarketplace.ts
│       │   ├── useCollaboration.ts
│       │   └── useSpecialistProfile.ts
│       └── lib/
│           ├── api.ts             # Centralized API client (base URL + auth headers)
│           ├── types.ts           # TypeScript type definitions
│           └── utils.ts           # Utility functions
├── data/                          # Empty (reserved for future data assets)
├── hello.py                       # Orphan test file (should be deleted)
├── CLAUDE.md                      # Project brain for Claude Code
├── PRD.md                         # Product requirements document
├── TECH_SPEC.md                   # Technical specification
├── STATUS.md                      # This file
└── .gitignore
```

## What's Done

### Backend — Complete
- **9 routers** covering all API domains (auth, cases, evidence, timeline, bundles, legal analysis, marketplace, specialists, collaboration)
- **9 model files** defining 18 database tables
- **8 schema files** with Pydantic v2 request/response models
- **6 services** (auth, AI, file handling, bundles, marketplace matching, collaboration)
- **5 AI features** (evidence analysis, timeline generation, legal analysis, specialist matching, gap detection)
- **JWT authentication** with registration and login
- **File upload/download** system
- **Seed script** for demo data

### Frontend — Complete (Litigant Portal)
- **12 routes** with full Next.js App Router setup
- **Landing page** with auth gate
- **Login/registration** with AuthContext
- **Case management** — list, create, detail with tabbed interface
- **Evidence** — upload, view, trigger AI analysis, view results
- **Timeline** — auto-generated from evidence, manual editing
- **Bundles** — builder, viewer with annotations (links + highlights)
- **Legal analysis** — AI-generated strengths/weaknesses/case law
- **Marketplace** — browse listings, publish cases, view/submit bids
- **Collaboration** — notes, documents, collaborator list
- **Specialist profile** — creation and editing form
- **28+ components** across cases, marketplace, and UI categories
- **8 custom hooks** for data fetching and state management
- **Centralized API client** with auth header injection

## What's NOT Done

### Phase 2 — Specialist Portal
- [ ] Specialist dashboard (active cases, bid status, earnings)
- [ ] Specialist-specific case view (after bid acceptance)
- [ ] Specialist onboarding flow
- [ ] Case collaboration from specialist perspective
- [ ] Profile verification system

### Phase 2 — Developer Infrastructure
- [ ] Backend tests (pytest + httpx)
- [ ] Frontend tests (Vitest + React Testing Library)
- [ ] Docker + docker-compose
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] PostgreSQL migration
- [ ] API documentation (auto-generated from FastAPI, but needs review)

### Phase 3 — Platform Features
- [ ] Payment processing (Stripe)
- [ ] Real-time notifications (WebSocket)
- [ ] Admin panel
- [ ] Email notifications
- [ ] File storage migration (local → S3)

## Known Issues

| Issue | Severity | Location |
|-------|----------|----------|
| No unified git repo | High | Project root — no `.git/` initialized |
| Orphan `hello.py` | Low | `/hello.py` — test file, should be deleted |
| Hardcoded JWT default secret | Medium | `backend/app/config.py` — default `SECRET_KEY` if env var missing |
| `datetime.utcnow()` deprecated | Low | Backend models — Python 3.12+ deprecates `utcnow()`, use `datetime.now(UTC)` |
| `anthropic` not in requirements.txt | Medium | `backend/requirements.txt` — missing despite being used in `ai_service.py` |
| No error boundaries | Medium | Frontend — unhandled API errors can crash React tree |
| No loading skeletons | Low | Frontend — only spinner, no skeleton UI for better perceived performance |
| localStorage JWT | Medium | Frontend — XSS-vulnerable; consider httpOnly cookies for production |
