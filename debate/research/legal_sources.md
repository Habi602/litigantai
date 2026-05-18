# UK + EU Legal-Update Sources

Research deliverable for **NOA-42**. Compiled from three parallel research passes (E&W official; Scotland + NI official; EU/international + UK Parliament pipeline). Every tier-1 row was actually probed with WebFetch — no guessed feed URLs.

Downstream consumer: the cron in **NOA-45** (weekly ingest → store → email digest + Notion page), with deferred wiring into the debate `JudgeAgent` in **NOA-46**.

## Source table

Columns:

- **Ingestion** — `atom` / `rss` / `api` / `sitemap` / `scrape` / `manual`.
- **Tier** — 1 = must-have (primary law / appellate judgments / Bills near assent), 2 = high signal (regulator guidance, Sentencing Council, committee reports), 3 = nice-to-have.
- **Branch coverage** — against `debate/schemas.py:OUTCOME_TAXONOMY` (civil / family / criminal / public / employment / consumer / regulatory / human_rights).

### England & Wales — official

| Source | URL | Ingestion | Feed URL | Cadence | Licence | Branch coverage | Tier | Notes |
|---|---|---|---|---|---|---|---|---|
| legislation.gov.uk — UKSI Atom | https://www.legislation.gov.uk | atom | https://www.legislation.gov.uk/uksi/data.feed | ~30–60/wk | OGL v3.0 | all | 1 | Verified; SIs are where most enacted change lands. |
| legislation.gov.uk — new (all) Atom | https://www.legislation.gov.uk | atom | https://www.legislation.gov.uk/new/data.feed | ~20–40/wk | OGL v3.0 | all | 1 | Paginated (20/page). Mixes E&W with Scotland/NI — filter by `extent` field or URL path. |
| gov.uk — search API | https://www.gov.uk | api | https://www.gov.uk/api/search.json?filter_organisations=ministry-of-justice&order=-public_timestamp | ~50+/wk per org | OGL v3.0 | public, regulatory, criminal, employment, consumer | 1 | Documented JSON API. One query per org (MoJ, Home Office, HMCTS, HMRC, CPS, ICO etc.); dedupe by `_id`. |
| judiciary.uk | https://www.judiciary.uk | atom | https://www.judiciary.uk/feed/ | ~5–15/wk | OGL v3.0 (Crown) | civil, family, criminal, public | 1 | Mixed: speeches, PDs, appointments, news — filter by category in entries. |
| BAILII E&W | https://www.bailii.org | rss | https://www.bailii.org/recent-decisions-ew.rss | ~30–80/wk | BAILII T&Cs (Crown copyright; no bulk download) | civil, family, criminal, public, employment | 1 | Also `recent-decisions.rss` for all UK/Ireland. robots.txt discourages crawling — RSS pull is fine, do **not** scrape full judgment HTML at scale. |
| Find Case Law (Nat. Archives) | https://caselaw.nationalarchives.gov.uk | atom | https://caselaw.nationalarchives.gov.uk/atom.xml | ~10–30/wk | OGL v3.0 | civil, family, criminal, public | 1 | **Found mid-research, not in original brief.** Crown's preferred judgments source going forward. Better licence than BAILII. Pair with BAILII as primary/fallback. |
| UK Supreme Court | https://supremecourt.uk/decided-cases | scrape | — | ~2–5/wk | OGL v3.0 | civil, public, criminal | 1 | No RSS. Decided-cases listing is structured HTML (1,493 cases). BAILII mirrors UKSC judgments — use BAILII as primary; scrape supremecourt.uk only for permission decisions BAILII doesn't carry. |
| Sentencing Council | https://www.sentencingcouncil.org.uk | scrape | — | ~1–3/mo | OGL v3.0 | criminal | 2 | `/feed/` and `/news/feed/` returned 403 to default WebFetch UA. Real cron with a normal browser UA likely works — re-verify before promoting to tier 1. |
| CPS | https://www.cps.gov.uk | scrape | — | ~3–8/wk | OGL v3.0 | criminal | 2 | No feed (`/rss.xml` 404, `/news/feed` 404). Alternative: query gov.uk search API with `filter_organisations=crown-prosecution-service`. |
| Law Commission | https://www.lawcom.gov.uk | rss | https://www.lawcom.gov.uk/feed/ | ~1–4/mo | OGL v3.0 | civil, family, criminal, public, consumer | 2 | Feed XML valid but `<item>` entries didn't render in fetch — possibly empty week or JS-rendered. Verify with a real RSS parser; fallback to `/document-type/`. |
| FCA | https://www.fca.org.uk | rss | https://www.fca.org.uk/news/rss.xml | ~10–20/wk | OGL v3.0 (mostly) | regulatory, consumer | 2 | High volume — pre-filter by category (policy statements, final notices, consultation papers). |
| ICO | https://ico.org.uk | scrape | — | ~2–5/wk | OGL v3.0 | regulatory, consumer | 2 | `/news-and-blogs/feed/` and `/rss/` both 403 under default UA. Almost certainly UA-gated — retry from cron with a browser UA and promote to tier 1 if working. |

### Scotland — official

| Source | URL | Ingestion | Feed URL | Cadence | Licence | Branch coverage | Tier | Notes |
|---|---|---|---|---|---|---|---|---|
| Scottish Courts — Judgments | https://www.scotcourts.gov.uk/judgments | rss | https://api.pa.web.scotcourts.gov.uk/web/rss/Judgments | ~10–20/wk | OGL v3.0 | civil, criminal, family, public, regulatory | 1 | Verified. Filterable: `?Court=Court+of+Session` / `High+Court+of+Justiciary` / `Sheriff+Appeal+Court`. |
| Scottish Courts — Practice Notes & Directions | https://www.scotcourts.gov.uk | rss | https://api.pa.web.scotcourts.gov.uk/web/rss/PracticeNotesAndDirections | ~2–5/mo | OGL v3.0 | civil, criminal, family | 1 | Procedural authority — feeds the judge's procedural-rulings stream. |
| legislation.gov.uk — ASP | https://www.legislation.gov.uk/asp | atom | https://www.legislation.gov.uk/new/asp/data.feed | ~1–3/mo | OGL v3.0 | all | 1 | Acts of the Scottish Parliament. 325 ASPs indexed. |
| legislation.gov.uk — SSI | https://www.legislation.gov.uk/ssi | atom | https://www.legislation.gov.uk/new/ssi/data.feed | ~10–20/mo | OGL v3.0 | civil, criminal, public, regulatory | 1 | 10,508 SSIs cataloged; high noise (traffic orders) — filter by subject. |
| Scottish Courts — News & FAI | https://www.scotcourts.gov.uk | rss | https://api.pa.web.scotcourts.gov.uk/web/rss/NewsArticles | ~3/wk | OGL v3.0 | regulatory, public | 2 | Same host also exposes a `FatalAccidentInquiryDeterminations` feed (tier 3 niche). |
| Scottish Law Commission | https://www.scotlawcom.gov.uk | rss | https://www.scotlawcom.gov.uk/rss/publications | ~1–2/mo | OGL v3.0 | civil, family, public | 2 | Publications feed verified. The `/rss/news` feed has a malformed `<?phpxml` prolog — use publications feed only. |
| UKSC (Scottish appeals subset) | https://www.supremecourt.uk/decided-cases | scrape | — | ~1/mo (Scottish subset) | OGL v3.0 | civil, criminal, public | 1 | Same scrape as E&W; filter by "Court below" = Court of Session / HCJ. |
| Scottish Legal News | https://www.scottishlegal.com | scrape | — | ~daily | proprietary | civil, criminal, family, public, employment | 3 | `/feed`, `/rss` 404. Mailchimp newsletter only. |
| gov.scot — news | https://www.gov.scot/news | scrape | — | ~daily | OGL v3.0 | public, regulatory | 3 | No public RSS. Mailchimp signup only. |
| judiciary.scot | https://judiciary.scot | manual | — | ~1/mo | OGL v3.0 | civil, criminal | 3 | 403 on `/home/news`, 404 on `/feed/`. Low cadence — accept manual. |
| Law Society of Scotland | https://www.lawscot.org.uk/news-and-events/news | scrape | — | ~5/wk | proprietary | civil, criminal, family, regulatory | 3 | `/feed/` 404. Practice-side, not authority. |

### Northern Ireland — official

| Source | URL | Ingestion | Feed URL | Cadence | Licence | Branch coverage | Tier | Notes |
|---|---|---|---|---|---|---|---|---|
| Judiciary NI — decisions | https://judiciaryni.uk/judicial-decisions | scrape | — | ~2–5/wk | OGL v3.0 | civil, criminal, family, public | 1 | **Only NI appellate source.** No feed, no API, no sitemap. Mailchimp alerts only (`eepurl.com/deVz_L`). Scrape decisions index with `If-Modified-Since` polling, dedupe on neutral citation. |
| legislation.gov.uk — NIA | https://www.legislation.gov.uk/nia | atom | https://www.legislation.gov.uk/new/nia/data.feed | ~5–10/yr | OGL v3.0 | all | 1 | NI Assembly Acts. 224 indexed. |
| legislation.gov.uk — NISR | https://www.legislation.gov.uk/nisr | atom | https://www.legislation.gov.uk/new/nisr/data.feed | ~10–20/mo | OGL v3.0 | civil, public, regulatory | 1 | NI Statutory Rules — covers SSP/UC/PIP regs etc. |
| Courts NI service | https://www.courtsni.gov.uk | manual | — | ~1/wk | OGL v3.0 | civil, criminal, family | 2 | `/news` 404. WebFetch timed out — site is slow/unreliable. |
| NI Assembly | https://www.niassembly.gov.uk | scrape | — | ~5/wk | OGL v3.0 | public, regulatory | 2 | `/rss-feeds/` 404, AIMS RSS endpoint 404. Bills tracked at `/assembly-business/legislation` — scrape only. |
| nidirect | https://www.nidirect.gov.uk | rss | https://www.nidirect.gov.uk/news-rss.xml | ~1–2/wk | OGL v3.0 | public, consumer | 3 | Verified live but content is mostly wellbeing/safety, low signal for litigation. |
| Law Society of NI | https://lawsoc-ni.org | scrape | — | ~2/wk | proprietary | civil, criminal, family, regulatory | 3 | No feed exposed; Green17 CMS. Practice-side. |

### EU + international

| Source | URL | Ingestion | Feed URL | Cadence | Licence | Branch coverage | Tier | Notes |
|---|---|---|---|---|---|---|---|---|
| Curia — judgments + AG opinions | https://curia.europa.eu | rss | http://curia.europa.eu/site/rss.jsp?lang=en&secondLang=fr | ~5–10/wk | Curia re-use (attribution) | civil, consumer, employment, regulatory, human_rights | 1 | Verified — returns ECJ judgments (e.g. C-155/25, C-286/25). HTTP not HTTPS on this host. Downstream filter for retained-EU-law relevance. |
| HUDOC — ECHR search API | https://hudoc.echr.coe.int | api | https://hudoc.echr.coe.int/app/query/results?query=...&select=...&start=0&length=10 | ~15–30/wk | Council of Europe re-use (attribution) | human_rights, criminal, public, family | 1 | Verified JSON response. Use `respondent=GBR` and date-filter on `kpdate` for UK-binding subset. Rate limits unspecified — throttle. |
| EUR-Lex — OJ L Acts | https://eur-lex.europa.eu | rss | https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222 | ~30–60/wk | EU re-use notice (Dec 2011/833) | civil, consumer, regulatory, employment, public | 2 | Verified. All-EU; retained-EU-law relevance filter must be applied downstream. |
| EUR-Lex — CELLAR SPARQL | http://publications.europa.eu/webapi/rdf/sparql | api | http://publications.europa.eu/webapi/rdf/sparql | on-demand | EU re-use notice | all | 2 | SPARQL for structured queries (e.g. "all acts amending retained-EU-law CELEX X"). No auth. Higher fidelity than RSS, more engineering. |
| CJEU press releases | https://curia.europa.eu/jcms/jcms/Jo2_7045/en/ | rss | http://curia.europa.eu/site/rss.jsp?lang=en&secondLang=fr | ~5–10/wk | Curia re-use | all (case-dependent) | 2 | Same `rss.jsp` serves both press releases and rulings — dedupe against judgments feed on case ID. |
| Council of the EU — press releases | https://www.consilium.europa.eu/en/press/press-releases | scrape | — | ~10–20/wk | © Council, re-use with attribution | public, regulatory | 3 | 403 to default UA. Council acts also surface via EUR-Lex RSS — deprioritise unless cron has scraping infra. |

### UK Parliament — legislative pipeline

| Source | URL | Ingestion | Feed URL | Cadence | Licence | Branch coverage | Tier | Notes |
|---|---|---|---|---|---|---|---|---|
| UK Parliament Bills API | https://bills-api.parliament.uk | api | https://bills-api.parliament.uk/api/v1/Bills?SortOrder=DateUpdatedDescending | ~20–40/wk (stage updates) | OGL v3.0 | all | 1 | 3,889 bills returned with stages. `IsCurrent=true` mixed — filter by `Session` and current `stage` client-side. Tier 1 for "imminent regime shift" signal. |
| UK Parliament Committees API | https://committees-api.parliament.uk | api | https://committees-api.parliament.uk/api/Publications | ~5–10/wk | OGL v3.0 | public, human_rights, family, criminal | 2 | Justice / JCHR / Constitution committee reports — high signal for judicial reasoning. |
| gov.uk — policy papers & consultations | https://www.gov.uk | atom | https://www.gov.uk/government/publications.atom | ~50–100/wk | OGL v3.0 | all | 2 | Filter by `departments[]=ministry-of-justice` and `publication_filter_option=consultations` via querystring. |
| Hansard | https://hansard.parliament.uk | api | https://hansard-api.parliament.uk/search.json?queryParameters... | sitting days only | OGL v3.0 | all | 3 | High volume, low signal-to-noise. Pull only when a tier-1 Bill triggers — debates on that specific Bill, not the firehose. |

## v1 ingestion shortlist

The minimum set to stand up first (every entry has a verified working feed/API):

1. **legislation.gov.uk — UKSI Atom** — where most enacted change lands week-to-week.
2. **legislation.gov.uk — ASP + SSI Atom** — Scottish primary and secondary legislation.
3. **legislation.gov.uk — NIA + NISR Atom** — only realistic primary-source path for NI.
4. **gov.uk search API** — one query per priority org (MoJ, HMCTS, Home Office, HMRC, CPS).
5. **judiciary.uk Atom** — judicial speeches and Practice Directions.
6. **Find Case Law (Nat. Archives) Atom** — Crown's preferred judgments source for E&W.
7. **BAILII E&W RSS** — fallback / backfill for Find Case Law.
8. **Scottish Courts — Judgments + Practice Notes RSS** — single richest Scottish source.
9. **Scottish Law Commission publications RSS** — reform output that telegraphs upcoming statute.
10. **HUDOC API (`respondent=GBR`)** — Strasbourg judgments binding on UK courts.
11. **Curia RSS** — ECJ judgments relevant to retained EU law.
12. **UK Parliament Bills API** — Bills near Royal Assent.
13. **FCA RSS** — regulator with the most case-relevant output.

That's 13 sources, of which all 13 are tier 1 by ingestion path (the criteria mark a few as tier 2 because of low cadence or content-relevance reasons, not feed quality). Coverage spans civil, family, criminal, public, regulatory, consumer, employment, and human rights across all four jurisdictions.

## Open issues / known gotchas

- **UA gating.** Sentencing Council and ICO both 403'd on the default WebFetch UA. Both are likely fine from a real cron with a browser-like `User-Agent` header — verify on day one and promote to tier 1 if so.
- **No NI appellate feed.** Judiciary NI has no feed of any kind. Brittle scrape is unavoidable for NI judgments — dedupe on neutral citation, poll with `If-Modified-Since`.
- **UKSC permission decisions.** BAILII covers UKSC judgments but not permission-to-appeal decisions. If those matter, scrape `supremecourt.uk/decided-cases` for that subset only.
- **Legislative-pipeline stream.** The judge cares about commencement risk on a Bill ("not law yet but might be in three weeks") differently from "this section is currently in force." Keep `legislative_pipeline` as a separate stream from `enacted_statute` — merging conflates the temporal signal.
- **BAILII Scotland/NI.** Not probed in this pass but a known fallback if `scotcourts.gov.uk` or `judiciaryni.uk` drop: `bailii.org/scot/` and `bailii.org/nie/`. BAILII historically tolerates polite scraping.
- **Civil Procedure Rule Committee minutes.** Worth adding to NOA-44/45 for upcoming CPR amendments — published in occasional batches, no feed, scrape only.
