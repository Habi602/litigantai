# Phase 1 — Database Schemas

All tables for the NoahLaw platform. Organised by domain.  
**Status key:** ✅ Exists in codebase &nbsp;|&nbsp; 🔨 Needs building

---

## Domain 1 — User & Identity

### `users` ✅
Core authentication table. Every person on the platform has a row here.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| username | String(50) | Unique, indexed, not null | Used for login |
| hashed_password | String(255) | Not null | Never returned to frontend |
| full_name | String(100) | Default: "" | |
| is_active | Boolean | Default: true | Set false to ban a user |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `litigant_profiles` (one-to-one)
- → `specialist_profiles` (one-to-one)
- → `specialist_documents` (one-to-many)
- → `cases` (one-to-many, as owner)
- → `case_collaborators` (one-to-many)
- → `bids` (one-to-many, as specialist)
- → `conversations` (one-to-many, as participant_1 or participant_2)
- → `messages` (one-to-many, as sender)
- → `notifications` (one-to-many)

---

### `litigant_profiles` 🔨
Extended profile for users who are litigants-in-person. One per user.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, Unique, indexed | One profile per user |
| phone | String(30) | Nullable | |
| address_line_1 | String(200) | Nullable | |
| address_line_2 | String(200) | Nullable | |
| city | String(100) | Nullable | |
| postcode | String(20) | Nullable | |
| date_of_birth | Date | Nullable | |
| occupation | String(100) | Nullable | |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `users` (many-to-one)

---

### `specialist_profiles` ✅
Professional profile for lawyers and legal specialists. One per user.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, Unique, indexed | |
| practice_areas | JSON | Default: [] | e.g. ["family", "employment"] |
| sub_areas | JSON | Default: [] | More specific tags |
| custom_areas | JSON | Default: [] | Free-text areas the specialist adds |
| linkedin_url | String(500) | Nullable | |
| years_experience | Integer | Default: 0 | |
| bar_number | String(100) | Nullable | |
| jurisdiction | String(100) | Default: "" | e.g. "England & Wales" |
| bio | Text | Default: "" | |
| hourly_rate | Float | Nullable | In GBP |
| availability | String(20) | Default: "available" | available / busy / unavailable |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `users` (many-to-one)

---

### `specialist_documents` ✅
Uploaded credentials, CVs, and bar certificates for a specialist.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, indexed | |
| file_path | String(500) | Not null | Server-side path |
| original_filename | String(255) | Not null | |
| mime_type | String(100) | Not null | |
| category | String(50) | Default: "other" | cv / bar_certificate / other |
| description | Text | Nullable | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `users` (many-to-one)

---

## Domain 2 — Case Management

### `cases` ✅
The central entity. Every litigant has one or more cases.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, indexed | The litigant who owns this case |
| title | String(200) | Not null | |
| case_number | String(100) | Nullable | Court-assigned reference |
| case_type | String(50) | Default: "general" | employment / family / contract / general |
| description | Text | Nullable | |
| status | String(20) | Default: "active" | active / settled / closed |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships (cascade delete on all children):**
- → `evidence` (one-to-many)
- → `timeline_events` (one-to-many)
- → `bundles` (one-to-many)
- → `marketplace_listing` (one-to-one)
- → `case_legal_analysis` (one-to-one)
- → `case_collaborators` (one-to-many)
- → `case_notes` (one-to-many)
- → `case_documents` (one-to-many)
- → `statement_of_claim` (one-to-one)

---

### `evidence` ✅
Uploaded files (PDFs, images, documents) attached to a case.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| filename | String(255) | Not null | UUID-based stored name |
| file_path | String(500) | Not null | Server-side path |
| mime_type | String(100) | Not null | |
| file_category | String(50) | Not null | contract / email / photo / medical / other |
| file_size | Integer | Default: 0 | Bytes |
| extracted_text | Text | Nullable | Text pulled from PDF/image |
| ai_summary | Text | Nullable | Claude-generated summary |
| analysis_status | String(20) | Default: "pending" | pending / processing / done / failed |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships (cascade delete on all children):**
- → `cases` (many-to-one)
- → `key_facts` (one-to-many)
- → `timeline_events` (one-to-many)
- → `evidence_analysis_gaps` (one-to-many)

---

### `key_facts` ✅
Individual facts extracted from a piece of evidence by AI.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| evidence_id | Integer | FK → evidence.id, indexed | |
| fact_text | Text | Not null | |
| fact_type | String(50) | Default: "general" | date / person / amount / obligation / general |
| importance | String(20) | Default: "medium" | high / medium / low |
| extracted_date | String(50) | Nullable | Date referenced in the fact |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `evidence` (many-to-one)

---

### `timeline_events` ✅
Chronological events in a case, either AI-extracted or manually added.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| evidence_id | Integer | FK → evidence.id, Nullable | Source evidence if AI-extracted |
| event_date | String(50) | Nullable | ISO date string |
| date_precision | String(20) | Default: "exact" | exact / approximate / unknown |
| title | String(300) | Not null | |
| description | Text | Nullable | |
| event_type | String(50) | Default: "general" | hearing / filing / communication / general |
| people_involved | JSON | Nullable | List of names |
| relevance_score | Float | Default: 0.5 | 0.0–1.0, AI-assigned |
| is_critical | Boolean | Default: false | |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `cases` (many-to-one)
- → `evidence` (many-to-one, nullable)

---

## Domain 3 — Legal Documents

### `bundles` ✅
A compiled PDF bundle of selected evidence for court submission.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| title | String(300) | Not null | |
| version | Integer | Default: 1 | Increments on regeneration |
| status | String(20) | Default: "draft" | draft / generating / ready / failed |
| file_path | String(500) | Nullable | Path to generated PDF |
| file_size | Integer | Default: 0 | Bytes |
| total_pages | Integer | Default: 0 | |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships (cascade delete on all children):**
- → `cases` (many-to-one)
- → `bundle_pages` (one-to-many)
- → `bundle_links` (one-to-many)
- → `bundle_highlights` (one-to-many)

---

### `bundle_pages` ✅
Maps each page of the generated bundle back to its source evidence page.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| bundle_id | Integer | FK → bundles.id, indexed | |
| evidence_id | Integer | FK → evidence.id, indexed | |
| source_page_number | Integer | Not null | Page number within source file |
| bundle_page_number | Integer | Not null | Page number in final bundle |
| content_hash | String(64) | Not null | SHA-256 for dedup detection |
| is_duplicate_of | Integer | FK → bundle_pages.id, Nullable | Self-referential |
| section_title | String(300) | Nullable | |

**Relationships:**
- → `bundles` (many-to-one)
- → `evidence` (many-to-one)
- → `bundle_pages` (self-referential, duplicate source)

---

### `bundle_links` ✅
Hyperlink annotations within a bundle (e.g. index row → page).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| bundle_id | Integer | FK → bundles.id, indexed | |
| source_page | Integer | Not null | Page containing the link |
| target_page | Integer | Not null | Page the link points to |
| x | Float | Default: 0.0 | Link rect position |
| y | Float | Default: 0.0 | |
| width | Float | Default: 100.0 | |
| height | Float | Default: 20.0 | |
| label | String(200) | Nullable | |

**Relationships:**
- → `bundles` (many-to-one)

---

### `bundle_highlights` ✅
Coloured highlight annotations placed on bundle pages.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| bundle_id | Integer | FK → bundles.id, indexed | |
| page_number | Integer | Not null | |
| x | Float | Default: 0.0 | |
| y | Float | Default: 0.0 | |
| width | Float | Default: 100.0 | |
| height | Float | Default: 50.0 | |
| color | String(20) | Default: "yellow" | yellow / green / pink |
| note | Text | Nullable | Optional annotation text |

**Relationships:**
- → `bundles` (many-to-one)

---

### `statement_of_claim` ✅
The formal legal statement for a case — AI-generated or manually written.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK | |
| case_id | Integer | FK → cases.id (CASCADE), Unique, indexed | One per case |
| content | Text | Nullable | Full statement text |
| generated_by | String(10) | Default: "user" | "ai" or "user" |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `cases` (one-to-one)

---

## Domain 4 — AI Analysis

### `case_legal_analysis` ✅
AI-generated legal assessment of a case's strengths, weaknesses, and applicable law.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, Unique, indexed | One per case |
| legal_positioning | Text | Nullable | Overall AI assessment |
| strengths | JSON | Nullable | List of strength strings |
| weaknesses | JSON | Nullable | List of weakness strings |
| relevant_case_law | JSON | Nullable | List of {citation, relevance, summary} |
| relevant_legislation | JSON | Nullable | List of {statute, section, relevance} |
| open_questions | JSON | Nullable | List of unanswered questions |
| generated_at | DateTime | Default: now | |

**Relationships:**
- → `cases` (one-to-one)

---

### `evidence_analysis_gaps` ✅
Specific gaps or missing information identified by AI within a piece of evidence.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| evidence_id | Integer | FK → evidence.id, indexed | |
| gap_text | Text | Not null | Description of the gap |
| gap_type | String(30) | Default: "missing_info" | missing_info / contradiction / unclear |
| resolved | Boolean | Default: false | |
| resolved_by | Integer | FK → users.id, Nullable | |
| resolved_at | DateTime | Nullable | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `evidence` (many-to-one)
- → `users` (many-to-one, nullable — resolver)

---

## Domain 5 — Marketplace

### `marketplace_listings` ✅
A case published to the marketplace so specialists can bid on it.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| user_id | Integer | FK → users.id, indexed | The litigant who published |
| title | String(200) | Not null | |
| redacted_summary | Text | Default: "" | Shown to specialists — no PII |
| case_category | String(50) | Default: "other" | employment / family / contract / other |
| estimated_amount | Float | Nullable | Claim value in GBP |
| claim_or_defence | String(20) | Default: "claim" | "claim" or "defence" |
| status | String(20) | Default: "draft" | draft / open / closed / filled |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships (cascade delete on all children):**
- → `cases` (one-to-one)
- → `case_matches` (one-to-many)
- → `bids` (one-to-many)

---

### `case_matches` ✅
AI-recommended specialists for a marketplace listing.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| listing_id | Integer | FK → marketplace_listings.id, indexed | |
| specialist_id | Integer | FK → users.id, indexed | |
| relevance_score | Float | Default: 0.0 | 0.0–1.0 |
| rationale | Text | Default: "" | Why AI matched this specialist |
| matched_at | DateTime | Default: now | |
| notified | Boolean | Default: false | Whether specialist was notified |

**Relationships:**
- → `marketplace_listings` (many-to-one)
- → `users` (many-to-one, specialist)

---

### `bids` ✅
A specialist's proposal to help with a listed case.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| listing_id | Integer | FK → marketplace_listings.id, indexed | |
| specialist_id | Integer | FK → users.id, indexed | |
| message | Text | Default: "" | Cover message from specialist |
| price_structure | String(20) | Default: "hourly" | hourly / fixed / cfa |
| estimated_amount | Float | Default: 0.0 | In GBP |
| estimated_hours | Float | Nullable | For hourly bids |
| status | String(20) | Default: "pending" | pending / accepted / rejected / withdrawn |
| notified_accepted | Boolean | Default: true | Whether litigant was notified on acceptance |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `marketplace_listings` (many-to-one)
- → `users` (many-to-one, specialist)
- → `case_collaborators` (one-to-one, created on acceptance)

---

## Domain 6 — Collaboration

### `case_collaborators` ✅
Tracks which specialists have been granted access to a case (via an accepted bid).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| user_id | Integer | FK → users.id, indexed | The specialist |
| role | String(30) | Default: "specialist" | specialist / lawyer / paralegal |
| bid_id | Integer | FK → bids.id, Nullable | The bid that was accepted |
| joined_at | DateTime | Default: now | |

**Relationships:**
- → `cases` (many-to-one)
- → `users` (many-to-one)
- → `bids` (many-to-one, nullable)

---

### `case_notes` ✅
Inline notes left on a case or a specific piece of evidence by any collaborator.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| user_id | Integer | FK → users.id, indexed | Author |
| evidence_id | Integer | FK → evidence.id, Nullable | If note is about specific evidence |
| content | Text | Not null | |
| note_type | String(20) | Default: "note" | note / question / action |
| created_at | DateTime | Default: now | |
| updated_at | DateTime | Default: now, onupdate: now | |

**Relationships:**
- → `cases` (many-to-one)
- → `users` (many-to-one)
- → `evidence` (many-to-one, nullable)

---

### `case_documents` ✅
Supporting documents uploaded directly to a case (not evidence files).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| case_id | Integer | FK → cases.id, indexed | |
| user_id | Integer | FK → users.id, indexed | Uploader |
| filename | String(255) | Not null | |
| file_path | String(500) | Not null | |
| file_size | Integer | Default: 0 | Bytes |
| mime_type | String(100) | Not null | |
| description | Text | Nullable | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `cases` (many-to-one)
- → `users` (many-to-one)

---

## Domain 7 — Messaging

### `conversations` ✅
A direct message thread between two users, optionally linked to a case or listing.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| participant_1_id | Integer | FK → users.id, indexed | |
| participant_2_id | Integer | FK → users.id, indexed | |
| case_id | Integer | FK → cases.id, Nullable | |
| listing_id | Integer | FK → marketplace_listings.id, Nullable | |
| created_at | DateTime | Default: now | |
| last_message_at | DateTime | Nullable | Updated on each new message |

**Relationships (cascade delete on all children):**
- → `users` (many-to-one × 2, participant_1 and participant_2)
- → `messages` (one-to-many)

---

### `messages` ✅
An individual message within a conversation.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| conversation_id | Integer | FK → conversations.id, indexed | |
| sender_id | Integer | FK → users.id, indexed | |
| content | Text | Not null | |
| is_read | Boolean | Default: false | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `conversations` (many-to-one)
- → `users` (many-to-one, sender)

---

## Domain 8 — Notifications

### `notifications` 🔨
In-app notifications sent to a user when something relevant happens (bid accepted, new message, etc.)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, indexed | Recipient |
| type | String(50) | Not null | bid_received / bid_accepted / new_message / match_found / bid_rejected |
| title | String(200) | Not null | Short display title |
| body | Text | Nullable | Full notification text |
| related_entity_type | String(50) | Nullable | "bid" / "listing" / "conversation" / "case" |
| related_entity_id | Integer | Nullable | ID of the related row |
| is_read | Boolean | Default: false | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `users` (many-to-one)

---

## Domain 9 — Payments

### `payments` 🔨
A payment made by a litigant to a specialist for their services.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| bid_id | Integer | FK → bids.id, indexed | The bid this payment is for |
| payer_id | Integer | FK → users.id, indexed | The litigant |
| payee_id | Integer | FK → users.id, indexed | The specialist |
| amount | Float | Not null | In GBP |
| currency | String(3) | Default: "GBP" | ISO 4217 |
| status | String(20) | Default: "pending" | pending / succeeded / failed / refunded |
| stripe_payment_intent_id | String(200) | Nullable | From Stripe API |
| created_at | DateTime | Default: now | |
| paid_at | DateTime | Nullable | Set when status → succeeded |

**Relationships:**
- → `bids` (many-to-one)
- → `users` (many-to-one × 2, payer and payee)
- → `invoices` (one-to-one)

---

### `invoices` 🔨
A formal invoice generated when a payment is made.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| payment_id | Integer | FK → payments.id, Unique, Nullable | Linked once payment succeeds |
| case_id | Integer | FK → cases.id, indexed | |
| specialist_id | Integer | FK → users.id, indexed | |
| litigant_id | Integer | FK → users.id, indexed | |
| subtotal | Float | Not null | Before tax |
| tax | Float | Default: 0.0 | VAT if applicable |
| total | Float | Not null | |
| status | String(20) | Default: "draft" | draft / issued / paid / void |
| issued_at | DateTime | Nullable | |
| due_at | DateTime | Nullable | Payment due date |
| paid_at | DateTime | Nullable | |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `payments` (one-to-one, nullable)
- → `cases` (many-to-one)
- → `users` (many-to-one × 2, specialist and litigant)

---

## Domain 10 — Audit

### `audit_log` 🔨
Immutable log of significant actions taken on the platform (for compliance and debugging).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | Integer | PK, indexed | |
| user_id | Integer | FK → users.id, Nullable, indexed | Null if system action |
| entity_type | String(50) | Not null | "case" / "evidence" / "bid" / "bundle" / etc. |
| entity_id | Integer | Not null | ID of the affected row |
| action | String(30) | Not null | created / updated / deleted / downloaded / published |
| detail | JSON | Nullable | Changed fields or extra context |
| ip_address | String(45) | Nullable | Supports IPv6 |
| created_at | DateTime | Default: now | |

**Relationships:**
- → `users` (many-to-one, nullable)

---

## Summary

| # | Table | Domain | Status |
|---|-------|--------|--------|
| 1 | `users` | Identity | ✅ |
| 2 | `litigant_profiles` | Identity | 🔨 |
| 3 | `specialist_profiles` | Identity | ✅ |
| 4 | `specialist_documents` | Identity | ✅ |
| 5 | `cases` | Case mgmt | ✅ |
| 6 | `evidence` | Case mgmt | ✅ |
| 7 | `key_facts` | Case mgmt | ✅ |
| 8 | `timeline_events` | Case mgmt | ✅ |
| 9 | `bundles` | Legal docs | ✅ |
| 10 | `bundle_pages` | Legal docs | ✅ |
| 11 | `bundle_links` | Legal docs | ✅ |
| 12 | `bundle_highlights` | Legal docs | ✅ |
| 13 | `statement_of_claim` | Legal docs | ✅ |
| 14 | `case_legal_analysis` | AI analysis | ✅ |
| 15 | `evidence_analysis_gaps` | AI analysis | ✅ |
| 16 | `marketplace_listings` | Marketplace | ✅ |
| 17 | `case_matches` | Marketplace | ✅ |
| 18 | `bids` | Marketplace | ✅ |
| 19 | `case_collaborators` | Collaboration | ✅ |
| 20 | `case_notes` | Collaboration | ✅ |
| 21 | `case_documents` | Collaboration | ✅ |
| 22 | `conversations` | Messaging | ✅ |
| 23 | `messages` | Messaging | ✅ |
| 24 | `notifications` | Notifications | 🔨 |
| 25 | `payments` | Payments | 🔨 |
| 26 | `invoices` | Payments | 🔨 |
| 27 | `audit_log` | Audit | 🔨 |

**Total: 27 tables — 23 existing, 4 to build**
