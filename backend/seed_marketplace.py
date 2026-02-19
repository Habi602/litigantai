"""Seed script for Legal Marketplace: creates users, cases, evidence,
specialist profiles, listings, matches, and bids with realistic data."""

from datetime import datetime, timedelta

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Case, Evidence, KeyFact,
    SpecialistProfile, MarketplaceListing, CaseMatch, Bid,
    CaseLegalAnalysis, EvidenceAnalysisGap,
    CaseCollaborator, CaseNote, CaseDocument,
)
from app.services.auth import hash_password


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_or_create_user(db, username, full_name):
    """Return existing user or create a new one with password123."""
    user = db.query(User).filter(User.username == username).first()
    if user:
        print(f"  User '{username}' already exists (id={user.id})")
        return user
    user = User(
        username=username,
        hashed_password=hash_password("password123"),
        full_name=full_name,
    )
    db.add(user)
    db.flush()
    print(f"  Created user '{username}' (id={user.id})")
    return user


def get_or_create_case(db, user_id, title, case_type, description):
    """Return existing case (by title+user) or create a new one."""
    case = (
        db.query(Case)
        .filter(Case.user_id == user_id, Case.title == title)
        .first()
    )
    if case:
        print(f"  Case '{title}' already exists (id={case.id})")
        return case
    case = Case(
        user_id=user_id,
        title=title,
        case_type=case_type,
        description=description,
        status="active",
    )
    db.add(case)
    db.flush()
    print(f"  Created case '{title}' (id={case.id})")
    return case


# ---------------------------------------------------------------------------
# Main seed function
# ---------------------------------------------------------------------------

def seed_marketplace():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ==================================================================
        # 1. Clear existing marketplace data (allows re-running)
        # ==================================================================
        print("Clearing existing marketplace data...")
        db.query(CaseNote).delete()
        db.query(CaseDocument).delete()
        db.query(CaseCollaborator).delete()
        db.query(EvidenceAnalysisGap).delete()
        db.query(CaseLegalAnalysis).delete()
        db.query(Bid).delete()
        db.query(CaseMatch).delete()
        db.query(MarketplaceListing).delete()
        db.query(SpecialistProfile).delete()
        # Clear seed evidence (identified by placeholder path) and their key facts
        seed_evidence = db.query(Evidence).filter(
            Evidence.file_path.like("uploads/placeholder/%")
        ).all()
        for ev in seed_evidence:
            db.query(KeyFact).filter(KeyFact.evidence_id == ev.id).delete()
            db.delete(ev)
        db.commit()
        print("  Done.\n")

        # ==================================================================
        # 2. Users
        # ==================================================================
        print("Creating users...")
        litigant1 = get_or_create_user(db, "litigant1", "Sarah Mitchell")
        litigant2 = get_or_create_user(db, "litigant2", "James Thornton")
        litigant3 = get_or_create_user(db, "litigant3", "Amira Patel")
        specialist1 = get_or_create_user(db, "specialist1", "Dr. Eleanor Vance")
        specialist2 = get_or_create_user(db, "specialist2", "Marcus Webb")
        specialist3 = get_or_create_user(db, "specialist3", "Fatima Al-Rashid")
        specialist4 = get_or_create_user(db, "specialist4", "Oliver Chen")
        specialist5 = get_or_create_user(db, "specialist5", "Rebecca Stone")
        db.commit()
        print()

        # ==================================================================
        # 3. Cases
        # ==================================================================
        print("Creating cases...")
        case1 = get_or_create_case(
            db, litigant1.id,
            "Unfair Dismissal — Tech Corp",
            "employment",
            "Unfair dismissal claim against Tech Corp Ltd following "
            "termination without proper procedure or notice period.",
        )
        case2 = get_or_create_case(
            db, litigant1.id,
            "Breach of Commercial Lease",
            "contract",
            "Dispute over landlord's breach of a commercial lease "
            "agreement for retail premises on High Street.",
        )
        case3 = get_or_create_case(
            db, litigant2.id,
            "Road Traffic Accident Claim",
            "personal_injury",
            "Personal injury claim arising from a road traffic accident "
            "on the M25 motorway in adverse weather conditions.",
        )
        case4 = get_or_create_case(
            db, litigant3.id,
            "Partnership Dispute — Restaurant Business",
            "commercial",
            "Commercial dispute between partners of a restaurant business "
            "regarding profit sharing and management decisions.",
        )
        case5 = get_or_create_case(
            db, litigant3.id,
            "Workplace Discrimination Claim",
            "employment",
            "Employment discrimination claim based on racial discrimination "
            "and failure to provide reasonable workplace adjustments.",
        )
        db.commit()
        print()

        # ==================================================================
        # 4. Evidence & Key Facts (2-3 per case)
        # ==================================================================
        print("Creating evidence & key facts...")

        evidence_data = [
            # --- Case 1 ---
            {
                "case_id": case1.id,
                "filename": "termination_letter.pdf",
                "file_path": "uploads/placeholder/termination_letter.pdf",
                "mime_type": "application/pdf",
                "file_category": "correspondence",
                "file_size": 45_000,
                "ai_summary": (
                    "Termination letter dated 15 March 2025 from Tech Corp Ltd "
                    "HR department. The letter states immediate dismissal for "
                    "'gross misconduct' but provides no specific details of the "
                    "alleged misconduct. No prior warnings were referenced."
                ),
                "key_facts": [
                    ("Employee terminated with immediate effect on 15/03/2025", "date", "high", "2025-03-15"),
                    ("No disciplinary procedure followed prior to dismissal", "legal", "high", None),
                    ("Letter cites 'gross misconduct' without specifics", "claim", "medium", None),
                ],
            },
            {
                "case_id": case1.id,
                "filename": "employment_contract.pdf",
                "file_path": "uploads/placeholder/employment_contract.pdf",
                "mime_type": "application/pdf",
                "file_category": "contract",
                "file_size": 120_000,
                "ai_summary": (
                    "Employment contract between the claimant and Tech Corp Ltd "
                    "dated January 2022. Stipulates a 3-month notice period and "
                    "requires a formal disciplinary procedure before termination. "
                    "Annual salary of £65,000 with benefits package."
                ),
                "key_facts": [
                    ("Contract requires 3-month notice period for termination", "legal", "high", None),
                    ("Formal disciplinary procedure mandated before dismissal", "legal", "high", None),
                ],
            },
            # --- Case 2 ---
            {
                "case_id": case2.id,
                "filename": "lease_agreement.pdf",
                "file_path": "uploads/placeholder/lease_agreement.pdf",
                "mime_type": "application/pdf",
                "file_category": "contract",
                "file_size": 200_000,
                "ai_summary": (
                    "Commercial lease agreement for Unit 4, 12 High Street. "
                    "10-year term commencing April 2020. Landlord obligations "
                    "include structural maintenance and insurance of the building. "
                    "Rent review clause every 3 years."
                ),
                "key_facts": [
                    ("Lease commenced April 2020 for a 10-year term", "date", "medium", "2020-04-01"),
                    ("Landlord responsible for structural maintenance", "legal", "high", None),
                    ("Rent review every 3 years per clause 14.2", "financial", "medium", None),
                ],
            },
            {
                "case_id": case2.id,
                "filename": "surveyor_report.pdf",
                "file_path": "uploads/placeholder/surveyor_report.pdf",
                "mime_type": "application/pdf",
                "file_category": "expert_report",
                "file_size": 350_000,
                "ai_summary": (
                    "Independent surveyor's report documenting significant "
                    "structural defects in the leased premises including roof "
                    "leaks and subsidence. Estimates repair costs at £45,000. "
                    "Concludes defects arose from landlord's failure to maintain."
                ),
                "key_facts": [
                    ("Estimated repair cost £45,000 for structural defects", "financial", "high", None),
                    ("Defects attributed to landlord's failure to maintain", "legal", "high", None),
                ],
            },
            # --- Case 3 ---
            {
                "case_id": case3.id,
                "filename": "police_report.pdf",
                "file_path": "uploads/placeholder/police_report.pdf",
                "mime_type": "application/pdf",
                "file_category": "official_document",
                "file_size": 80_000,
                "ai_summary": (
                    "Metropolitan Police accident report for incident on "
                    "12 November 2024 on the M25 near Junction 8. The other "
                    "driver was found to have been using a mobile phone at "
                    "the time of the collision. Weather conditions: heavy rain."
                ),
                "key_facts": [
                    ("Accident occurred 12/11/2024 on M25 near Junction 8", "date", "high", "2024-11-12"),
                    ("Other driver using mobile phone at time of collision", "liability", "high", None),
                ],
            },
            {
                "case_id": case3.id,
                "filename": "medical_report.pdf",
                "file_path": "uploads/placeholder/medical_report.pdf",
                "mime_type": "application/pdf",
                "file_category": "medical",
                "file_size": 150_000,
                "ai_summary": (
                    "Medical report from consultant orthopaedic surgeon. "
                    "Claimant sustained whiplash injury (Grade II), lumbar "
                    "spine strain, and soft tissue damage to the left knee. "
                    "Prognosis: full recovery expected within 12-18 months."
                ),
                "key_facts": [
                    ("Whiplash injury Grade II with lumbar spine strain", "medical", "high", None),
                    ("Full recovery expected within 12-18 months", "medical", "medium", None),
                    ("Ongoing physiotherapy required 2x per week", "medical", "medium", None),
                ],
            },
            # --- Case 4 ---
            {
                "case_id": case4.id,
                "filename": "partnership_agreement.pdf",
                "file_path": "uploads/placeholder/partnership_agreement.pdf",
                "mime_type": "application/pdf",
                "file_category": "contract",
                "file_size": 95_000,
                "ai_summary": (
                    "Partnership agreement for 'Spice Garden' restaurant "
                    "dated June 2021. Three partners with equal shares. "
                    "Agreement specifies profit distribution quarterly and "
                    "requires unanimous consent for expenditures over £5,000."
                ),
                "key_facts": [
                    ("Three equal partners with 33.3% share each", "financial", "high", None),
                    ("Unanimous consent required for expenditures over £5,000", "legal", "high", None),
                ],
            },
            {
                "case_id": case4.id,
                "filename": "bank_statements.pdf",
                "file_path": "uploads/placeholder/bank_statements.pdf",
                "mime_type": "application/pdf",
                "file_category": "financial",
                "file_size": 280_000,
                "ai_summary": (
                    "Business bank statements from January to December 2024 "
                    "showing multiple unauthorized withdrawals totalling "
                    "£32,000 by one partner. Several payments to unknown "
                    "third-party accounts without corresponding invoices."
                ),
                "key_facts": [
                    ("Unauthorized withdrawals of £32,000 during 2024", "financial", "high", None),
                    ("Payments to unknown third parties without invoices", "financial", "high", None),
                    ("Business turnover £480,000 in 2024", "financial", "medium", None),
                ],
            },
            # --- Case 5 ---
            {
                "case_id": case5.id,
                "filename": "grievance_letter.pdf",
                "file_path": "uploads/placeholder/grievance_letter.pdf",
                "mime_type": "application/pdf",
                "file_category": "correspondence",
                "file_size": 35_000,
                "ai_summary": (
                    "Formal grievance letter submitted to HR on 5 September "
                    "2025 detailing incidents of racial discrimination by "
                    "line manager over a 6-month period. Includes specific "
                    "dates and witnesses for each incident."
                ),
                "key_facts": [
                    ("Grievance filed 05/09/2025 citing racial discrimination", "date", "high", "2025-09-05"),
                    ("Six separate incidents documented over 6 months", "claim", "high", None),
                ],
            },
            {
                "case_id": case5.id,
                "filename": "email_chain.pdf",
                "file_path": "uploads/placeholder/email_chain.pdf",
                "mime_type": "application/pdf",
                "file_category": "correspondence",
                "file_size": 25_000,
                "ai_summary": (
                    "Chain of emails between the claimant and colleagues "
                    "corroborating discriminatory remarks made during team "
                    "meetings. Two colleagues confirm they witnessed the "
                    "incidents and are willing to provide statements."
                ),
                "key_facts": [
                    ("Two colleagues willing to provide witness statements", "witness", "high", None),
                    ("Emails corroborate discriminatory remarks in meetings", "evidence", "high", None),
                    ("HR acknowledged grievance but took no action for 8 weeks", "procedural", "medium", None),
                ],
            },
            {
                "case_id": case5.id,
                "filename": "performance_reviews.pdf",
                "file_path": "uploads/placeholder/performance_reviews.pdf",
                "mime_type": "application/pdf",
                "file_category": "employment",
                "file_size": 60_000,
                "ai_summary": (
                    "Performance reviews from 2023-2025 showing consistently "
                    "high ratings (4/5 or above) until the line manager "
                    "changed in March 2025. Subsequent review in July 2025 "
                    "dropped to 2/5 with vague criticism."
                ),
                "key_facts": [
                    ("Consistently rated 4/5 or above from 2023 to early 2025", "evidence", "high", None),
                    ("Rating dropped to 2/5 after new line manager in March 2025", "evidence", "high", None),
                ],
            },
        ]

        for ev_data in evidence_data:
            kf_list = ev_data.pop("key_facts")
            evidence = Evidence(
                analysis_status="completed",
                extracted_text="[Extracted text placeholder]",
                **ev_data,
            )
            db.add(evidence)
            db.flush()

            for fact_text, fact_type, importance, extracted_date in kf_list:
                kf = KeyFact(
                    evidence_id=evidence.id,
                    fact_text=fact_text,
                    fact_type=fact_type,
                    importance=importance,
                    extracted_date=extracted_date,
                )
                db.add(kf)

        db.commit()
        print(f"  Created {len(evidence_data)} evidence items with key facts.\n")

        # ==================================================================
        # 5. Specialist Profiles
        # ==================================================================
        print("Creating specialist profiles...")
        profiles_data = [
            {
                "user_id": specialist1.id,
                "practice_areas": ["employment", "contract"],
                "years_experience": 18,
                "bar_number": "EW-2007-4521",
                "jurisdiction": "England & Wales",
                "bio": (
                    "Dr. Eleanor Vance is a leading employment law specialist "
                    "with 18 years of experience. She has successfully represented "
                    "clients in over 200 employment tribunal cases including unfair "
                    "dismissal, discrimination, and whistleblowing claims. Former "
                    "lecturer in Employment Law at King's College London."
                ),
                "hourly_rate": 350.0,
                "availability": "available",
            },
            {
                "user_id": specialist2.id,
                "practice_areas": ["personal_injury", "criminal"],
                "years_experience": 12,
                "bar_number": "EW-2013-7834",
                "jurisdiction": "England & Wales",
                "bio": (
                    "Marcus Webb specialises in personal injury litigation with "
                    "a focus on road traffic accidents and workplace injuries. "
                    "He has recovered over £15 million in compensation for clients "
                    "and is a member of the Association of Personal Injury Lawyers."
                ),
                "hourly_rate": 275.0,
                "availability": "available",
            },
            {
                "user_id": specialist3.id,
                "practice_areas": ["property", "commercial"],
                "years_experience": 15,
                "bar_number": "EW-2010-3156",
                "jurisdiction": "England & Wales",
                "bio": (
                    "Fatima Al-Rashid is a highly regarded property and commercial "
                    "law specialist. She advises on complex commercial leases, "
                    "partnership disputes, and business acquisitions. Recognised "
                    "by Legal 500 as a Rising Star in Commercial Litigation."
                ),
                "hourly_rate": 400.0,
                "availability": "available",
            },
            {
                "user_id": specialist4.id,
                "practice_areas": ["employment", "immigration"],
                "years_experience": 8,
                "bar_number": "EW-2017-9012",
                "jurisdiction": "England & Wales",
                "bio": (
                    "Oliver Chen practises employment and immigration law, "
                    "with particular expertise in cases involving overseas "
                    "workers' rights, visa-related employment disputes, and "
                    "workplace discrimination. Fluent in Mandarin and Cantonese."
                ),
                "hourly_rate": 225.0,
                "availability": "busy",
            },
            {
                "user_id": specialist5.id,
                "practice_areas": ["family", "property"],
                "years_experience": 22,
                "bar_number": "EW-2003-1478",
                "jurisdiction": "England & Wales",
                "bio": (
                    "Rebecca Stone is a senior solicitor with over two decades "
                    "of experience in family and property law. She handles "
                    "complex property disputes, inheritance claims, and landlord-"
                    "tenant matters with a reputation for thorough preparation."
                ),
                "hourly_rate": 300.0,
                "availability": "available",
            },
        ]

        for p in profiles_data:
            db.add(SpecialistProfile(**p))
        db.commit()
        print(f"  Created {len(profiles_data)} specialist profiles.\n")

        # ==================================================================
        # 6. Marketplace Listings (one per case)
        # ==================================================================
        print("Creating marketplace listings...")

        listings_data = [
            {
                "case_id": case1.id,
                "user_id": litigant1.id,
                "title": "Unfair Dismissal — Tech Corp",
                "case_category": "employment",
                "estimated_amount": 50000.0,
                "claim_or_defence": "claim",
                "status": "accepted",
                "redacted_summary": (
                    "[REDACTED] was employed by Tech Corp Ltd as a Senior Software Engineer "
                    "from January 2022 until their dismissal on 15 March 2025. The employment "
                    "contract stipulated a 3-month notice period and required formal disciplinary "
                    "procedures before any termination.\n\n"
                    "On 15 March 2025, [REDACTED] received a termination letter citing 'gross "
                    "misconduct' but providing no specific details of the alleged misconduct. "
                    "No prior warnings had been issued and no disciplinary hearing was conducted.\n\n"
                    "[REDACTED] seeks compensation for unfair dismissal including lost earnings "
                    "(annual salary £65,000 plus benefits), notice pay for the 3-month contractual "
                    "period, and damages for the manner of dismissal. The estimated value of the "
                    "claim is approximately £50,000.\n\n"
                    "Key issues include the employer's failure to follow its own disciplinary "
                    "procedure, the lack of specific allegations, and the absence of any prior "
                    "performance concerns documented in the claimant's employment record."
                ),
            },
            {
                "case_id": case2.id,
                "user_id": litigant1.id,
                "title": "Breach of Commercial Lease",
                "case_category": "property",
                "estimated_amount": 75000.0,
                "claim_or_defence": "claim",
                "status": "published",
                "redacted_summary": (
                    "[REDACTED] is the tenant of commercial premises at [REDACTED ADDRESS], "
                    "High Street under a 10-year lease commencing April 2020. The landlord is "
                    "contractually responsible for structural maintenance and building insurance.\n\n"
                    "An independent surveyor's report has identified significant structural defects "
                    "including roof leaks and signs of subsidence, with estimated repair costs of "
                    "£45,000. The surveyor attributes these defects to the landlord's failure to "
                    "carry out required maintenance.\n\n"
                    "[REDACTED] has suffered business losses due to water damage to stock and "
                    "temporary closure for emergency repairs. Total losses including repair costs "
                    "and business interruption are estimated at £75,000.\n\n"
                    "The tenant seeks specific performance of the landlord's repair obligations, "
                    "damages for breach of covenant, and compensation for consequential business losses."
                ),
            },
            {
                "case_id": case3.id,
                "user_id": litigant2.id,
                "title": "Road Traffic Accident Claim",
                "case_category": "personal_injury",
                "estimated_amount": 35000.0,
                "claim_or_defence": "claim",
                "status": "published",
                "redacted_summary": (
                    "On 12 November 2024, [REDACTED] was involved in a road traffic accident "
                    "on the M25 motorway near Junction 8. The collision occurred during heavy "
                    "rain when the other vehicle crossed into [REDACTED]'s lane.\n\n"
                    "The Metropolitan Police report confirms the other driver was using a mobile "
                    "phone at the time of the collision. Liability is expected to be "
                    "straightforward given the police findings.\n\n"
                    "[REDACTED] sustained a Grade II whiplash injury, lumbar spine strain, and "
                    "soft tissue damage to the left knee. The consultant orthopaedic surgeon "
                    "estimates full recovery within 12-18 months with ongoing physiotherapy "
                    "required twice weekly.\n\n"
                    "The claim covers general damages for pain and suffering, special damages "
                    "for medical expenses and physiotherapy, loss of earnings during recovery, "
                    "and vehicle repair costs. Estimated total: £35,000."
                ),
            },
            {
                "case_id": case4.id,
                "user_id": litigant3.id,
                "title": "Partnership Dispute — Restaurant Business",
                "case_category": "commercial",
                "estimated_amount": 80000.0,
                "claim_or_defence": "claim",
                "status": "published",
                "redacted_summary": (
                    "[REDACTED] is one of three equal partners in a restaurant business "
                    "('Spice Garden') established in June 2021. The partnership agreement "
                    "requires unanimous consent for expenditures exceeding £5,000 and provides "
                    "for quarterly profit distribution.\n\n"
                    "Business bank statements reveal unauthorized withdrawals totalling £32,000 "
                    "during 2024 by one partner, including payments to unknown third-party "
                    "accounts without corresponding invoices or partner approval.\n\n"
                    "[REDACTED] seeks an account of partnership dealings, recovery of misappropriated "
                    "funds, and either dissolution of the partnership or removal of the offending "
                    "partner. The business turnover was £480,000 in 2024.\n\n"
                    "Key issues include breach of fiduciary duty, unauthorized use of partnership "
                    "funds, and potential fraud. The estimated value of the dispute including "
                    "partnership share and damages is approximately £80,000."
                ),
            },
            {
                "case_id": case5.id,
                "user_id": litigant3.id,
                "title": "Workplace Discrimination Claim",
                "case_category": "employment",
                "estimated_amount": 60000.0,
                "claim_or_defence": "claim",
                "status": "published",
                "redacted_summary": (
                    "[REDACTED] has been employed by [REDACTED EMPLOYER] since 2021 and filed "
                    "a formal grievance on 5 September 2025 citing racial discrimination by "
                    "their line manager over a period of approximately 6 months.\n\n"
                    "Six separate incidents have been documented, with specific dates and "
                    "witnesses identified for each. Two colleagues have confirmed they witnessed "
                    "discriminatory remarks during team meetings and are willing to provide "
                    "formal statements.\n\n"
                    "[REDACTED]'s performance reviews show consistently high ratings (4/5 or "
                    "above) from 2023 until March 2025 when the line manager changed. A "
                    "subsequent review in July 2025 dropped to 2/5 with vague, unsubstantiated "
                    "criticism — suggesting retaliatory conduct.\n\n"
                    "HR acknowledged the grievance but took no action for 8 weeks. [REDACTED] "
                    "seeks compensation for discrimination, injury to feelings (Vento band), "
                    "and consequential losses estimated at £60,000."
                ),
            },
        ]

        listings = []
        for ld in listings_data:
            listing = MarketplaceListing(**ld)
            db.add(listing)
            db.flush()
            listings.append(listing)
        db.commit()
        print(f"  Created {len(listings)} marketplace listings.\n")

        listing1, listing2, listing3, listing4, listing5 = listings

        # ==================================================================
        # 7. Case Matches
        # ==================================================================
        print("Creating case matches...")
        matches_data = [
            # Case 1 — employment
            {"listing_id": listing1.id, "specialist_id": specialist1.id, "relevance_score": 0.95,
             "rationale": "Dr. Vance has 18 years of employment law experience with extensive tribunal representation. Strong match for unfair dismissal claims.",
             "notified": True},
            {"listing_id": listing1.id, "specialist_id": specialist4.id, "relevance_score": 0.82,
             "rationale": "Oliver Chen practises employment law with focus on workplace rights. Relevant experience though less specialised in dismissal cases.",
             "notified": True},
            # Case 2 — property
            {"listing_id": listing2.id, "specialist_id": specialist3.id, "relevance_score": 0.88,
             "rationale": "Fatima Al-Rashid specialises in property and commercial law including complex lease disputes. Strong match for landlord-tenant matters.",
             "notified": True},
            {"listing_id": listing2.id, "specialist_id": specialist5.id, "relevance_score": 0.75,
             "rationale": "Rebecca Stone handles property disputes and landlord-tenant matters. Relevant background though primary focus is family law.",
             "notified": True},
            # Case 3 — personal injury
            {"listing_id": listing3.id, "specialist_id": specialist2.id, "relevance_score": 0.92,
             "rationale": "Marcus Webb is a dedicated personal injury specialist with focus on RTA claims. Over £15M recovered for clients. Excellent match.",
             "notified": True},
            # Case 4 — commercial
            {"listing_id": listing4.id, "specialist_id": specialist3.id, "relevance_score": 0.90,
             "rationale": "Fatima Al-Rashid advises on partnership disputes and commercial litigation. Recognised by Legal 500. Strong match for this case.",
             "notified": True},
            # Case 5 — employment/discrimination
            {"listing_id": listing5.id, "specialist_id": specialist1.id, "relevance_score": 0.91,
             "rationale": "Dr. Vance has extensive experience with employment discrimination claims and tribunal representation. Strong match.",
             "notified": True},
            {"listing_id": listing5.id, "specialist_id": specialist4.id, "relevance_score": 0.85,
             "rationale": "Oliver Chen practises employment law with particular expertise in workplace discrimination cases. Good match.",
             "notified": True},
        ]

        for m in matches_data:
            db.add(CaseMatch(**m))
        db.commit()
        print(f"  Created {len(matches_data)} case matches.\n")

        # ==================================================================
        # 8. Bids
        # ==================================================================
        print("Creating bids...")
        bids_data = [
            # Case 1 — Dr. Vance (accepted)
            {
                "listing_id": listing1.id, "specialist_id": specialist1.id,
                "price_structure": "hourly", "estimated_amount": 8750.0,
                "estimated_hours": 25.0, "status": "accepted",
                "message": (
                    "I have extensive experience in unfair dismissal claims and have "
                    "successfully represented over 200 clients at employment tribunals. "
                    "Given the clear procedural failings by the employer, I believe this "
                    "case has strong prospects. I propose 25 hours at my standard rate "
                    "to take this through to tribunal if necessary."
                ),
            },
            # Case 1 — Oliver Chen (rejected)
            {
                "listing_id": listing1.id, "specialist_id": specialist4.id,
                "price_structure": "fixed", "estimated_amount": 5500.0,
                "estimated_hours": None, "status": "rejected",
                "message": (
                    "I can offer a competitive fixed fee for this unfair dismissal case. "
                    "My employment law practice covers dismissal claims and I am confident "
                    "in achieving a favourable outcome. The fixed fee covers all work up "
                    "to and including tribunal hearing."
                ),
            },
            # Case 2 — Fatima Al-Rashid (pending)
            {
                "listing_id": listing2.id, "specialist_id": specialist3.id,
                "price_structure": "hourly", "estimated_amount": 12000.0,
                "estimated_hours": 30.0, "status": "pending",
                "message": (
                    "Commercial lease disputes are a core part of my practice. The surveyor's "
                    "report provides strong evidence of landlord breach. I would pursue specific "
                    "performance alongside damages for business losses. Estimated 30 hours to "
                    "resolve through negotiation or court proceedings."
                ),
            },
            # Case 2 — Rebecca Stone (pending)
            {
                "listing_id": listing2.id, "specialist_id": specialist5.id,
                "price_structure": "fixed", "estimated_amount": 9000.0,
                "estimated_hours": None, "status": "pending",
                "message": (
                    "I have handled numerous landlord-tenant property disputes over my 22-year "
                    "career. I propose a fixed fee covering all work through to resolution. "
                    "My approach would focus on early negotiation to minimise costs while "
                    "preparing for court if needed."
                ),
            },
            # Case 3 — Marcus Webb (pending, contingency)
            {
                "listing_id": listing3.id, "specialist_id": specialist2.id,
                "price_structure": "contingency", "estimated_amount": 15000.0,
                "estimated_hours": 40.0, "status": "pending",
                "message": (
                    "This RTA claim has clear liability given the police report. I specialise "
                    "in personal injury claims and have recovered over £15 million for my "
                    "clients. I propose a contingency arrangement — you pay nothing unless we "
                    "win. Estimated case duration: 40 hours over 6-9 months."
                ),
            },
            # Case 4 — Fatima Al-Rashid (pending)
            {
                "listing_id": listing4.id, "specialist_id": specialist3.id,
                "price_structure": "hourly", "estimated_amount": 16000.0,
                "estimated_hours": 40.0, "status": "pending",
                "message": (
                    "Partnership disputes require careful handling to protect your interests "
                    "while preserving the business value. The unauthorized withdrawals suggest "
                    "potential fraud. I would pursue forensic accounting alongside legal action. "
                    "Estimated 40 hours given the complexity of the financial records."
                ),
            },
            # Case 5 — Dr. Vance (pending)
            {
                "listing_id": listing5.id, "specialist_id": specialist1.id,
                "price_structure": "hourly", "estimated_amount": 10500.0,
                "estimated_hours": 30.0, "status": "pending",
                "message": (
                    "Workplace discrimination claims require sensitive and thorough preparation. "
                    "The documented incidents, witness support, and performance review evidence "
                    "provide a strong foundation. I would aim for settlement at conciliation "
                    "but prepare fully for tribunal. Estimated 30 hours."
                ),
            },
            # Case 5 — Oliver Chen (withdrawn)
            {
                "listing_id": listing5.id, "specialist_id": specialist4.id,
                "price_structure": "hourly", "estimated_amount": 6750.0,
                "estimated_hours": 30.0, "status": "withdrawn",
                "message": (
                    "I have relevant experience in workplace discrimination cases, particularly "
                    "those involving racial discrimination. Unfortunately, due to a scheduling "
                    "conflict, I must withdraw this bid. I wish you the best with your case."
                ),
            },
        ]

        for b in bids_data:
            db.add(Bid(**b))
        db.commit()
        print(f"  Created {len(bids_data)} bids.\n")

        # ==================================================================
        # 9. Legal Analysis (one per case)
        # ==================================================================
        print("Creating legal analysis data...")

        legal_analyses = [
            {
                "case_id": case1.id,
                "legal_positioning": (
                    "This is a strong unfair dismissal claim under the Employment Rights Act 1996. "
                    "The claimant was dismissed for alleged 'gross misconduct' without any prior "
                    "disciplinary procedure, in direct breach of both the employer's contractual "
                    "obligations and the ACAS Code of Practice on Disciplinary and Grievance Procedures. "
                    "The employer failed to specify the nature of the alleged misconduct, provide "
                    "opportunity to respond, or follow any form of investigation. The claimant's "
                    "employment contract expressly requires a formal disciplinary procedure and a "
                    "3-month notice period, neither of which were honoured."
                ),
                "strengths": [
                    "Clear contractual breach — contract requires formal disciplinary procedure before termination",
                    "No prior warnings or performance concerns documented in employment record",
                    "Termination letter fails to specify the nature of alleged gross misconduct",
                    "3-month notice period contractually required but not provided",
                    "Strong documentary evidence supporting procedural failures",
                ],
                "weaknesses": [
                    "Employer may produce evidence of misconduct not yet disclosed",
                    "Claimant's length of service (3 years) limits basic award calculation",
                    "No evidence yet gathered from colleagues or witnesses",
                ],
                "relevant_case_law": [
                    {
                        "citation": "Williams v Leeds United FC [2015] EWHC 376",
                        "relevance": "Established that failure to follow contractual disciplinary procedures renders dismissal unfair",
                        "summary": "Court held that an employer's failure to follow its own contractual disciplinary procedure was a fundamental breach of contract, entitling the employee to damages beyond the statutory cap.",
                    },
                    {
                        "citation": "Polkey v AE Dayton Services Ltd [1988] AC 344",
                        "relevance": "Key authority on procedural fairness in dismissal",
                        "summary": "House of Lords established that a dismissal will normally be unfair if the employer fails to follow proper procedures, even if the outcome might have been the same.",
                    },
                    {
                        "citation": "British Home Stores Ltd v Burchell [1980] ICR 303",
                        "relevance": "Test for reasonable belief in misconduct",
                        "summary": "Established three-part test: employer must show genuine belief in misconduct, reasonable grounds for that belief, and adequate investigation.",
                    },
                ],
                "relevant_legislation": [
                    {
                        "statute": "Employment Rights Act 1996",
                        "section": "s.98 — Fairness of dismissal",
                        "relevance": "Core statutory provision requiring employer to show fair reason and fair procedure for dismissal",
                    },
                    {
                        "statute": "Employment Rights Act 1996",
                        "section": "s.86 — Rights of employer and employee to minimum notice",
                        "relevance": "Establishes minimum statutory notice periods; contractual terms may provide greater rights",
                    },
                    {
                        "statute": "ACAS Code of Practice on Disciplinary and Grievance Procedures",
                        "section": "Paragraphs 5-28",
                        "relevance": "Sets out minimum procedural standards; failure to follow may result in up to 25% uplift in compensation",
                    },
                ],
                "open_questions": [
                    "What specific conduct does the employer allege constituted 'gross misconduct'?",
                    "Were any informal discussions or meetings held before the termination letter?",
                    "Does the claimant have access to company policies on disciplinary procedures?",
                    "Are there any colleagues who can provide witness statements about the circumstances?",
                ],
            },
            {
                "case_id": case2.id,
                "legal_positioning": (
                    "This is a breach of covenant claim arising from a commercial lease. The landlord "
                    "has failed to maintain the structural integrity of the premises as required by "
                    "the lease agreement. An independent surveyor's report documents significant "
                    "defects including roof leaks and subsidence, with repair costs estimated at "
                    "£45,000. The tenant has suffered consequential business losses."
                ),
                "strengths": [
                    "Lease expressly places structural maintenance obligation on landlord",
                    "Independent surveyor's report attributes defects to landlord's failure to maintain",
                    "Quantified repair costs of £45,000 supported by expert evidence",
                    "Documented business losses from water damage and temporary closure",
                ],
                "weaknesses": [
                    "Landlord may argue tenant contributed to deterioration through misuse",
                    "Consequential business losses may be difficult to fully evidence",
                    "Rent review clause may complicate the commercial relationship",
                ],
                "relevant_case_law": [
                    {
                        "citation": "Ravenseft Properties Ltd v Davstone Holdings Ltd [1980] QB 12",
                        "relevance": "Defines scope of landlord's repairing covenant",
                        "summary": "Established that a landlord's repairing covenant extends to keeping the structure in repair and remedying inherent defects where they cause disrepair.",
                    },
                    {
                        "citation": "Credit Suisse v Beegas Nominees Ltd [1994] 4 All ER 803",
                        "relevance": "Tenant's right to specific performance of landlord's repairing covenant",
                        "summary": "Court confirmed that specific performance is available to compel a landlord to carry out repairing obligations under a lease.",
                    },
                ],
                "relevant_legislation": [
                    {
                        "statute": "Landlord and Tenant Act 1985",
                        "section": "s.11 — Repairing obligations (implied terms)",
                        "relevance": "Implies repairing obligations into certain leases; may supplement express terms",
                    },
                    {
                        "statute": "Landlord and Tenant Act 1954",
                        "section": "Part II — Security of tenure for business tenants",
                        "relevance": "Provides framework for commercial lease renewal and tenant protection",
                    },
                ],
                "open_questions": [
                    "Has the tenant formally notified the landlord of the defects in writing?",
                    "What insurance does the landlord hold for the building?",
                    "Are there any previous repair requests on record?",
                ],
            },
            {
                "case_id": case3.id,
                "legal_positioning": (
                    "This is a straightforward personal injury claim arising from a road traffic "
                    "accident where the other driver was using a mobile phone. Police evidence "
                    "strongly supports liability. The claimant sustained moderate injuries with "
                    "a clear prognosis for recovery within 12-18 months."
                ),
                "strengths": [
                    "Police report confirms other driver was using mobile phone at time of collision",
                    "Clear liability — other vehicle crossed into claimant's lane",
                    "Comprehensive medical report with specific diagnosis and prognosis",
                    "Straightforward quantum assessment with defined recovery timeline",
                ],
                "weaknesses": [
                    "Heavy rain conditions may allow contributory negligence argument",
                    "Whiplash claims face increased scrutiny under Civil Liability Act 2018",
                    "12-18 month recovery period may limit general damages",
                ],
                "relevant_case_law": [
                    {
                        "citation": "Donoghue v Stevenson [1932] AC 562",
                        "relevance": "Foundation of duty of care in negligence",
                        "summary": "Established the neighbour principle and the general duty of care owed by all road users to others.",
                    },
                    {
                        "citation": "Heil v Rankin [2001] QB 272",
                        "relevance": "Guidelines for general damages in personal injury",
                        "summary": "Court of Appeal provided updated guidelines for assessment of general damages for pain, suffering and loss of amenity.",
                    },
                ],
                "relevant_legislation": [
                    {
                        "statute": "Road Traffic Act 1988",
                        "section": "s.41D — Using a handheld mobile phone whilst driving",
                        "relevance": "Criminal offence supporting civil liability finding",
                    },
                    {
                        "statute": "Civil Liability Act 2018",
                        "section": "s.1-3 — Whiplash injuries",
                        "relevance": "New tariff system for whiplash claims; may cap general damages",
                    },
                ],
                "open_questions": [
                    "Has the claimant obtained all physiotherapy receipts and records?",
                    "What are the claimant's exact earnings to calculate loss of income?",
                    "Has the vehicle repair cost been finalised?",
                ],
            },
            {
                "case_id": case4.id,
                "legal_positioning": (
                    "This is a partnership dispute involving alleged breach of fiduciary duty "
                    "and misappropriation of partnership funds. Bank statements reveal £32,000 "
                    "in unauthorized withdrawals by one partner. The partnership agreement "
                    "requires unanimous consent for expenditures over £5,000."
                ),
                "strengths": [
                    "Clear breach of partnership agreement — unauthorized withdrawals exceeding £5,000 threshold",
                    "Bank statement evidence documenting £32,000 in unauthorized transactions",
                    "Payments to unknown third parties without invoices suggests misappropriation",
                    "Partnership agreement expressly requires unanimous consent for significant expenditure",
                ],
                "weaknesses": [
                    "Third partner's position unclear — may side with the offending partner",
                    "Business valuation may be contested if dissolution is pursued",
                    "Criminal fraud allegations may complicate civil proceedings",
                ],
                "relevant_case_law": [
                    {
                        "citation": "Don King Productions Inc v Warren [2000] Ch 291",
                        "relevance": "Fiduciary duties in partnership context",
                        "summary": "Confirmed that partners owe fiduciary duties to each other including duty of good faith and duty to account.",
                    },
                    {
                        "citation": "Hurst v Bryk [2002] 1 AC 185",
                        "relevance": "Partnership dissolution and accounting",
                        "summary": "House of Lords decision on the consequences of partnership dissolution and the duty to account.",
                    },
                ],
                "relevant_legislation": [
                    {
                        "statute": "Partnership Act 1890",
                        "section": "s.28 — Duty of partners to render accounts",
                        "relevance": "Partners bound to render true accounts and full information on all matters affecting partnership",
                    },
                    {
                        "statute": "Partnership Act 1890",
                        "section": "s.35 — Dissolution by the court",
                        "relevance": "Court may dissolve partnership when a partner is guilty of conduct prejudicially affecting the business",
                    },
                ],
                "open_questions": [
                    "What is the current market valuation of the restaurant business?",
                    "Has a forensic accountant been instructed to trace the unauthorized payments?",
                    "What is the third partner's position on the dispute?",
                ],
            },
            {
                "case_id": case5.id,
                "legal_positioning": (
                    "This is a workplace discrimination claim under the Equality Act 2010 "
                    "based on race. The claimant has documented six incidents over six months, "
                    "corroborated by two colleagues willing to provide witness statements. "
                    "A sharp decline in performance ratings coinciding with the new line manager "
                    "suggests possible victimisation. HR's failure to act for 8 weeks after the "
                    "grievance strengthens the claim."
                ),
                "strengths": [
                    "Six documented incidents with specific dates and witnesses",
                    "Two colleagues willing to provide corroborating witness statements",
                    "Clear correlation between new manager and decline in performance ratings",
                    "Email evidence corroborating discriminatory remarks",
                    "HR's 8-week inaction after grievance supports institutional failure claim",
                ],
                "weaknesses": [
                    "Employer may argue performance decline was justified by objective criteria",
                    "Witnesses are current employees who may face pressure to retract",
                    "Time limit for tribunal claim is 3 months from last act — needs monitoring",
                ],
                "relevant_case_law": [
                    {
                        "citation": "Igen Ltd v Wong [2005] ICR 931",
                        "relevance": "Burden of proof in discrimination claims",
                        "summary": "Court of Appeal set out guidelines for burden of proof: claimant must establish prima facie case, then burden shifts to employer to prove non-discriminatory reason.",
                    },
                    {
                        "citation": "Vento v Chief Constable of West Yorkshire Police (No 2) [2003] ICR 318",
                        "relevance": "Injury to feelings compensation bands",
                        "summary": "Established three bands for injury to feelings awards, updated periodically (currently £1,100-£49,300).",
                    },
                ],
                "relevant_legislation": [
                    {
                        "statute": "Equality Act 2010",
                        "section": "s.13 — Direct discrimination",
                        "relevance": "Prohibits less favourable treatment because of a protected characteristic (race)",
                    },
                    {
                        "statute": "Equality Act 2010",
                        "section": "s.26 — Harassment",
                        "relevance": "Prohibits unwanted conduct related to a protected characteristic that violates dignity or creates hostile environment",
                    },
                    {
                        "statute": "Equality Act 2010",
                        "section": "s.27 — Victimisation",
                        "relevance": "Protects against detriment for making or supporting a discrimination complaint",
                    },
                ],
                "open_questions": [
                    "Has the claimant submitted an ET1 form or contacted ACAS for early conciliation?",
                    "Can the two witness colleagues confirm they will participate in tribunal proceedings?",
                    "Does the employer have an equal opportunities policy and training records?",
                ],
            },
        ]

        for la_data in legal_analyses:
            db.add(CaseLegalAnalysis(**la_data))
        db.commit()
        print(f"  Created {len(legal_analyses)} legal analysis records.\n")

        # ==================================================================
        # 10. Evidence Analysis Gaps (2-3 per evidence item)
        # ==================================================================
        print("Creating evidence analysis gaps...")

        # Gather all seed evidence
        all_evidence = (
            db.query(Evidence)
            .filter(Evidence.file_path.like("uploads/placeholder/%"))
            .order_by(Evidence.id)
            .all()
        )

        gap_templates = [
            # Case 1 - termination_letter.pdf
            [
                ("The termination letter references 'gross misconduct' but no specifics are provided. Request employer's internal investigation notes.", "missing_info", False),
                ("Clarify whether the employee received any verbal warnings prior to the written termination.", "clarification_needed", False),
                ("Was the employee given the right to be accompanied at any meeting prior to dismissal?", "legal_question", True),
            ],
            # Case 1 - employment_contract.pdf
            [
                ("Contract references a staff handbook for disciplinary procedures — obtain a copy of the current handbook.", "missing_info", False),
                ("Confirm whether the contract was amended at any point during the employment period.", "clarification_needed", True),
            ],
            # Case 2 - lease_agreement.pdf
            [
                ("Lease references a schedule of condition — this document has not been provided.", "missing_info", False),
                ("Clarify the exact scope of 'structural maintenance' as defined in the lease.", "clarification_needed", False),
                ("Has the tenant exercised any break clause or served any notice under the lease?", "legal_question", True),
            ],
            # Case 2 - surveyor_report.pdf
            [
                ("Surveyor's report does not address whether tenant alterations contributed to the subsidence.", "missing_info", False),
                ("Obtain the landlord's building insurance policy to check coverage for structural defects.", "missing_info", False),
            ],
            # Case 3 - police_report.pdf
            [
                ("Police report does not include dashcam footage — check if either vehicle had a dashcam.", "missing_info", False),
                ("Confirm whether the other driver received a criminal conviction for mobile phone use.", "legal_question", False),
            ],
            # Case 3 - medical_report.pdf
            [
                ("Medical report does not include pre-existing conditions history — request GP records.", "missing_info", False),
                ("Clarify the expected total cost of physiotherapy over the recovery period.", "clarification_needed", True),
                ("Has the claimant been referred for psychological assessment regarding travel anxiety?", "clarification_needed", False),
            ],
            # Case 4 - partnership_agreement.pdf
            [
                ("Partnership agreement does not specify a dispute resolution mechanism — consider mediation clause.", "legal_question", False),
                ("Obtain the original business plan to compare with current operational decisions.", "missing_info", True),
            ],
            # Case 4 - bank_statements.pdf
            [
                ("Several payments to unidentified third parties require tracing — instruct forensic accountant.", "missing_info", False),
                ("Clarify whether the unauthorized withdrawals were from the business or a personal account linked to business.", "clarification_needed", False),
                ("Were any of the withdrawals reported to the bank as unauthorized by any partner?", "legal_question", False),
            ],
            # Case 5 - grievance_letter.pdf
            [
                ("Grievance letter does not include the employer's formal response — obtain HR's written reply.", "missing_info", False),
                ("Clarify the exact dates and witnesses for each of the six documented incidents.", "clarification_needed", True),
            ],
            # Case 5 - email_chain.pdf
            [
                ("Email chain is incomplete — obtain full thread including any HR responses.", "missing_info", False),
                ("Confirm whether the colleagues' offer to provide statements was in writing.", "clarification_needed", False),
            ],
            # Case 5 - performance_reviews.pdf
            [
                ("Performance reviews do not include the criteria used for evaluation — request the scoring framework.", "missing_info", False),
                ("Were other team members similarly downgraded after the management change?", "legal_question", False),
                ("Obtain the line manager's own performance objectives to check for bias indicators.", "missing_info", True),
            ],
        ]

        gap_count = 0
        for ev, gaps in zip(all_evidence, gap_templates):
            for gap_text, gap_type, resolved in gaps:
                gap = EvidenceAnalysisGap(
                    evidence_id=ev.id,
                    gap_text=gap_text,
                    gap_type=gap_type,
                    resolved=resolved,
                    resolved_by=specialist1.id if resolved else None,
                    resolved_at=datetime.utcnow() - timedelta(days=1) if resolved else None,
                )
                db.add(gap)
                gap_count += 1
        db.commit()
        print(f"  Created {gap_count} evidence analysis gaps.\n")

        # ==================================================================
        # 11. Case Collaborator (specialist1 on case1)
        # ==================================================================
        print("Creating case collaborators...")

        # Find the accepted bid for case1
        accepted_bid = (
            db.query(Bid)
            .filter(Bid.specialist_id == specialist1.id, Bid.status == "accepted")
            .first()
        )

        collab = CaseCollaborator(
            case_id=case1.id,
            user_id=specialist1.id,
            role="specialist",
            bid_id=accepted_bid.id if accepted_bid else None,
        )
        db.add(collab)
        db.commit()
        print("  Created 1 case collaborator (specialist1 on case1).\n")

        # ==================================================================
        # 12. Case Notes (conversation between litigant1 and specialist1 on case1)
        # ==================================================================
        print("Creating case notes...")

        notes_data = [
            {
                "case_id": case1.id,
                "user_id": litigant1.id,
                "content": (
                    "Welcome Dr. Vance. I've uploaded all the documents I have so far — "
                    "the termination letter and my employment contract. Is there anything "
                    "else you need from me to get started?"
                ),
                "note_type": "note",
                "created_at": datetime.utcnow() - timedelta(days=5),
            },
            {
                "case_id": case1.id,
                "user_id": specialist1.id,
                "content": (
                    "Thank you Sarah. I've reviewed both documents. The case looks strong — "
                    "there are clear procedural failings. A few questions: Do you have a copy "
                    "of the company's staff handbook? It should contain the disciplinary procedure "
                    "they were supposed to follow."
                ),
                "note_type": "question",
                "created_at": datetime.utcnow() - timedelta(days=4, hours=12),
            },
            {
                "case_id": case1.id,
                "user_id": litigant1.id,
                "content": (
                    "I have a PDF copy of the staff handbook from when I joined in 2022. "
                    "I'll upload it shortly. It definitely has a section on disciplinary "
                    "procedures — I remember reading it during onboarding."
                ),
                "note_type": "answer",
                "created_at": datetime.utcnow() - timedelta(days=4),
            },
            {
                "case_id": case1.id,
                "user_id": specialist1.id,
                "content": (
                    "Excellent. I've also flagged some gaps in the evidence analysis — "
                    "particularly around whether you received any verbal warnings and whether "
                    "there were any meetings before the termination. Please check the gaps "
                    "on each evidence item and let me know what you can provide."
                ),
                "note_type": "note",
                "created_at": datetime.utcnow() - timedelta(days=3),
            },
            {
                "case_id": case1.id,
                "user_id": specialist1.id,
                "evidence_id": all_evidence[0].id if all_evidence else None,
                "content": (
                    "Important: The termination letter's reference to 'gross misconduct' "
                    "without specifics is a significant weakness in the employer's position. "
                    "Under the Burchell test, they need to demonstrate a genuine belief based "
                    "on reasonable investigation — which they clearly haven't done."
                ),
                "note_type": "annotation",
                "created_at": datetime.utcnow() - timedelta(days=2),
            },
        ]

        for nd in notes_data:
            db.add(CaseNote(**nd))
        db.commit()
        print(f"  Created {len(notes_data)} case notes.\n")

        # ==================================================================
        # 13. Case Document (specialist1 uploads on case1)
        # ==================================================================
        print("Creating case documents...")

        doc = CaseDocument(
            case_id=case1.id,
            user_id=specialist1.id,
            filename="preliminary_legal_assessment.pdf",
            file_path="uploads/documents/placeholder/preliminary_legal_assessment.pdf",
            file_size=85_000,
            mime_type="application/pdf",
            description="Preliminary legal assessment and case strategy outline",
        )
        db.add(doc)
        db.commit()
        print("  Created 1 case document.\n")

        print("=" * 60)
        print("Marketplace seed complete!")
        print("=" * 60)
        print()
        print("Test accounts (all password: password123):")
        print("  Litigants:   litigant1, litigant2, litigant3")
        print("  Specialists: specialist1..specialist5")

    finally:
        db.close()


if __name__ == "__main__":
    seed_marketplace()
