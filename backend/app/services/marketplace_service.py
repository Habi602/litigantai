import json
from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.key_fact import KeyFact
from app.models.marketplace import SpecialistProfile, MarketplaceListing, CaseMatch, Bid
from app.models.collaboration import CaseCollaborator
from app.services.ai_service import _get_client, _parse_json_response, MODEL


def generate_redacted_summary(db: Session, case: Case) -> dict:
    """Collect all evidence summaries + key facts, send to Claude for redacted marketplace summary."""
    evidence_items = (
        db.query(Evidence)
        .filter(Evidence.case_id == case.id, Evidence.analysis_status == "completed")
        .all()
    )

    evidence_text = ""
    for ev in evidence_items:
        if ev.ai_summary:
            evidence_text += f"- {ev.filename}: {ev.ai_summary}\n"

    key_facts = (
        db.query(KeyFact)
        .join(Evidence, KeyFact.evidence_id == Evidence.id)
        .filter(Evidence.case_id == case.id)
        .all()
    )

    facts_text = ""
    for fact in key_facts:
        facts_text += f"- [{fact.fact_type}/{fact.importance}] {fact.fact_text}\n"

    prompt = f"""Analyze this legal case and produce a marketplace summary.

Case: {case.title} (Type: {case.case_type})
Description: {case.description or 'No description provided'}

Evidence summaries:
{evidence_text or 'No evidence summaries available'}

Key facts:
{facts_text or 'No key facts extracted'}

Instructions:
1. Replace ALL personal names, addresses, phone numbers, emails with [REDACTED]
2. Return JSON:
   - "redacted_summary": 3-6 paragraph summary covering case nature, area of law, key facts, financial amounts
   - "case_category": one of ["contract", "employment", "personal_injury", "property", "family", "commercial", "intellectual_property", "immigration", "criminal", "regulatory", "other"]
   - "estimated_amount": numeric estimate of claim value or null
   - "claim_or_defence": "claim" or "defence"

Return ONLY the JSON object, no markdown formatting."""

    client = _get_client()
    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(message.content[0].text)


def publish_listing(db: Session, case_id: int, user_id: int) -> MarketplaceListing:
    """Generate redacted summary and create marketplace listing, then trigger matching."""
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user_id).first()
    if not case:
        raise ValueError("Case not found")

    # Check if listing already exists
    existing = db.query(MarketplaceListing).filter(MarketplaceListing.case_id == case_id).first()
    if existing:
        raise ValueError("Case already has a marketplace listing")

    result = generate_redacted_summary(db, case)

    listing = MarketplaceListing(
        case_id=case_id,
        user_id=user_id,
        title=case.title,
        redacted_summary=result.get("redacted_summary", ""),
        case_category=result.get("case_category", "other"),
        estimated_amount=result.get("estimated_amount"),
        claim_or_defence=result.get("claim_or_defence", "claim"),
        status="published",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    # Trigger specialist matching
    match_specialists(db, listing)

    return listing


def match_specialists(db: Session, listing: MarketplaceListing) -> list[CaseMatch]:
    """Match specialists to a listing based on category and AI relevance scoring."""
    # Step 1: Category filter
    profiles = (
        db.query(SpecialistProfile)
        .filter(SpecialistProfile.availability != "unavailable")
        .all()
    )

    # Filter by practice areas containing the listing category
    category_matched = [
        p for p in profiles
        if listing.case_category in (p.practice_areas or [])
    ]

    # Limit to top 20
    category_matched = category_matched[:20]

    if not category_matched:
        return []

    matches = []
    for profile in category_matched:
        try:
            score_data = _score_specialist(listing.redacted_summary, listing.case_category, profile)
            match = CaseMatch(
                listing_id=listing.id,
                specialist_id=profile.user_id,
                relevance_score=score_data.get("relevance_score", 0.0),
                rationale=score_data.get("rationale", ""),
                notified=False,
            )
            db.add(match)
            matches.append(match)
        except Exception:
            continue

    db.commit()

    # Sort by relevance score descending
    matches.sort(key=lambda m: m.relevance_score, reverse=True)
    return matches


def _score_specialist(listing_summary: str, case_category: str, specialist: SpecialistProfile) -> dict:
    """Single Claude call returning a 0-1 relevance score + short rationale."""
    sub_areas_text = ', '.join(specialist.sub_areas or [])
    custom_areas_text = ', '.join(specialist.custom_areas or [])

    prompt = f"""Score how relevant this legal specialist is for the following case.

Case summary: {listing_summary}
Case category: {case_category}

Specialist bio: {specialist.bio}
Main practice areas: {', '.join(specialist.practice_areas or [])}
Sub-specialisms: {sub_areas_text or 'none listed'}
Niche/custom areas: {custom_areas_text or 'none listed'}
Experience: {specialist.years_experience} years

Return JSON: {{"relevance_score": 0.0-1.0, "rationale": "one sentence"}}

Return ONLY the JSON object, no markdown formatting."""

    client = _get_client()
    message = client.messages.create(
        model=MODEL,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )

    result = _parse_json_response(message.content[0].text)
    # Ensure score is a valid float between 0 and 1
    score = float(result.get("relevance_score", 0.0))
    score = max(0.0, min(1.0, score))
    result["relevance_score"] = score
    return result


def submit_bid(db: Session, listing_id: int, specialist_id: int, data: dict) -> Bid:
    """Validate specialist is matched and create bid."""
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise ValueError("Listing not found")

    if listing.status not in ("published", "matched"):
        raise ValueError("Listing is not accepting bids")

    # Verify specialist has a match for this listing
    match = (
        db.query(CaseMatch)
        .filter(CaseMatch.listing_id == listing_id, CaseMatch.specialist_id == specialist_id)
        .first()
    )
    if not match:
        raise ValueError("You are not matched to this listing")

    # Require a complete specialist profile before bidding
    profile = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == specialist_id).first()
    if not profile or not profile.bio.strip() or not profile.practice_areas:
        raise ValueError("Please complete your profile (bio and practice areas) before bidding")

    # Check for existing bid
    existing_bid = (
        db.query(Bid)
        .filter(Bid.listing_id == listing_id, Bid.specialist_id == specialist_id, Bid.status == "pending")
        .first()
    )
    if existing_bid:
        raise ValueError("You already have a pending bid on this listing")

    bid = Bid(
        listing_id=listing_id,
        specialist_id=specialist_id,
        message=data.get("message", ""),
        price_structure=data.get("price_structure", "hourly"),
        estimated_amount=data.get("estimated_amount", 0.0),
        estimated_hours=data.get("estimated_hours"),
        status="pending",
    )
    db.add(bid)

    if listing.status == "published":
        listing.status = "matched"

    db.commit()
    db.refresh(bid)
    return bid


def accept_bid(db: Session, bid_id: int, user_id: int) -> Bid:
    """Accept a bid: set bid status to accepted, reject others, update listing status."""
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise ValueError("Bid not found")

    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == bid.listing_id).first()
    if not listing or listing.user_id != user_id:
        raise ValueError("Not authorized to accept this bid")

    if listing.status == "accepted":
        raise ValueError("A bid has already been accepted for this listing")

    bid.status = "accepted"
    bid.notified_accepted = False

    # Grant specialist access as a collaborator
    collaborator = CaseCollaborator(
        case_id=listing.case_id,
        user_id=bid.specialist_id,
        role="specialist",
        bid_id=bid.id,
    )
    db.add(collaborator)

    # Reject all other pending bids
    other_bids = (
        db.query(Bid)
        .filter(Bid.listing_id == bid.listing_id, Bid.id != bid_id, Bid.status == "pending")
        .all()
    )
    for other in other_bids:
        other.status = "rejected"

    listing.status = "accepted"
    db.commit()
    db.refresh(bid)
    return bid
