# Product Requirements Document — NoahLaw

## Background

Access to legal representation in the UK and globally is expensive and opaque. Litigants-in-person (LIPs) — people representing themselves in court — face overwhelming complexity: managing evidence, understanding legal procedures, building timelines, and preparing court bundles. Meanwhile, legal specialists struggle to find clients whose cases match their expertise.

NoahLaw bridges this gap with an AI-powered litigation platform that helps LIPs manage their cases and a marketplace that connects them with affordable legal specialists.

## Business Problem

**For Litigants:**
- Case management is fragmented across emails, physical documents, and notes
- Evidence analysis requires legal expertise they don't have
- Court bundle preparation is manual and error-prone
- Finding affordable, relevant legal help is difficult

**For Legal Specialists:**
- Finding clients with matching case types is inefficient
- No standardized way to bid on cases or showcase expertise
- Client intake involves significant manual screening

## Target Users

### Primary: Litigants-in-Person (MVP — Phase 1)
- Self-representing individuals in civil, employment, family, housing, immigration, or personal injury cases
- Need guidance on case strength, evidence gaps, and procedural steps
- Budget-conscious, seeking affordable legal assistance

### Secondary: Legal Specialists (Phase 2)
- Solicitors, barristers, paralegals, legal consultants, McKenzie Friends
- Specialize in specific practice areas
- Want to find matching clients efficiently

## User Stories

### Litigant Stories (Implemented)

| ID | Story | Status |
|----|-------|--------|
| L1 | As a litigant, I can register and log in so my case data is private | Done |
| L2 | As a litigant, I can create and manage multiple cases with type, description, and status | Done |
| L3 | As a litigant, I can upload evidence files and have AI extract key facts and summaries | Done |
| L4 | As a litigant, I can view an auto-generated timeline of events from my evidence | Done |
| L5 | As a litigant, I can build court bundles with page numbering and cross-references | Done |
| L6 | As a litigant, I can get AI-powered legal analysis showing strengths, weaknesses, and relevant law | Done |
| L7 | As a litigant, I can publish my case to the marketplace to find specialist help | Done |
| L8 | As a litigant, I can review bids from specialists and accept the best match | Done |

### Specialist Stories (Not Built)

| ID | Story | Status |
|----|-------|--------|
| S1 | As a specialist, I can create a profile with practice areas, experience, and rates | Partial (backend + form exists) |
| S2 | As a specialist, I can browse AI-matched cases relevant to my expertise | Backend only |
| S3 | As a specialist, I can submit bids with proposed pricing and approach | Backend only |
| S4 | As a specialist, I can collaborate on accepted cases with notes and documents | Backend only |
| S5 | As a specialist, I can have a dedicated dashboard showing my active cases and bids | Not built |

### Platform Stories (Not Built)

| ID | Story | Status |
|----|-------|--------|
| P1 | As an admin, I can manage users and moderate marketplace listings | Not built |
| P2 | The platform processes payments securely between litigants and specialists | Not built |
| P3 | Users receive real-time notifications for bids, matches, and collaboration updates | Not built |

## Functional Requirements

### Authentication & User Management
- Email/username + password registration and login
- JWT-based session management
- Role-based access (litigant vs specialist)

### Case Management
- CRUD operations for cases
- Case types: civil, employment, family, housing, immigration, personal_injury, other
- Case statuses: active, closed, archived

### Evidence Management
- File upload (PDF, images, documents)
- AI-powered text extraction and analysis
- Key fact extraction with importance scoring
- Evidence gap detection

### Timeline Generation
- Auto-generate timeline events from analyzed evidence
- Manual event creation and editing
- Critical event flagging
- Date precision tracking (exact, month, year)

### Court Bundle Builder
- Select evidence to include in bundles
- Auto-generate paginated PDF bundles
- Hyperlink cross-references between pages
- Highlight and annotate bundle pages

### Legal Analysis
- AI-generated legal positioning assessment
- Strengths and weaknesses identification
- Relevant case law and legislation citations
- Open questions and evidence gap detection

### Marketplace
- Publish cases with redacted summaries
- AI-powered specialist matching (relevance scoring + rationale)
- Specialist bidding system (message, pricing, estimated hours)
- Bid acceptance workflow

### Collaboration
- Add collaborators to cases (via accepted bids)
- Shared case notes (general, evidence-specific, legal, action items)
- Document sharing within case context

### Specialist Profiles
- Practice areas, jurisdiction, bar number
- Years of experience, hourly rate
- Availability status and bio

## Non-Functional Requirements

### Performance
- API response times < 500ms for CRUD operations
- AI analysis operations may take 10-30s (async-friendly)
- Frontend should show loading states for all async operations

### Security
- Passwords hashed with bcrypt
- JWT tokens for stateless auth
- CORS restricted to known origins
- No secrets in client-side code
- File uploads validated by type and size

### Scalability
- SQLite sufficient for MVP; migrate to PostgreSQL for production
- Stateless backend supports horizontal scaling
- File storage abstraction for future S3 migration

### Accessibility
- Semantic HTML throughout
- Keyboard-navigable UI
- Responsive design (mobile-friendly)
