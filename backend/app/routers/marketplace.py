from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.marketplace import MarketplaceListing, CaseMatch, Bid, SpecialistProfile
from app.models.collaboration import CaseNote, CaseDocument
from app.schemas.marketplace import (
    MarketplaceListingResponse,
    MarketplaceListingDetailResponse,
    MarketplaceListingEnrichedResponse,
    AcceptedBidInfo,
    CaseMatchResponse,
    BidCreate,
    BidResponse,
    SpecialistProfileResponse,
)
from app.services.auth import get_current_user
from app.services import marketplace_service

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


def _listing_to_detail(listing: MarketplaceListing) -> MarketplaceListingDetailResponse:
    resp = MarketplaceListingDetailResponse.model_validate(listing)
    resp.matches_count = len(listing.matches) if listing.matches else 0
    resp.bids_count = len(listing.bids) if listing.bids else 0
    return resp


def _bid_to_response(bid: Bid, db: Session) -> BidResponse:
    resp = BidResponse.model_validate(bid)
    user = db.query(User).filter(User.id == bid.specialist_id).first()
    if user:
        resp.specialist_name = user.full_name
    profile = db.query(SpecialistProfile).filter(SpecialistProfile.user_id == bid.specialist_id).first()
    if profile:
        profile_resp = SpecialistProfileResponse.model_validate(profile)
        if user:
            profile_resp.full_name = user.full_name
        resp.specialist_profile = profile_resp
    return resp


# --- Listings ---

@router.get("/listings", response_model=list[MarketplaceListingResponse])
def list_published_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listings = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.status.in_(["published", "matched"]))
        .order_by(MarketplaceListing.created_at.desc())
        .all()
    )
    return listings


@router.get("/my-listings", response_model=list[MarketplaceListingDetailResponse])
def my_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listings = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.user_id == current_user.id)
        .order_by(MarketplaceListing.created_at.desc())
        .all()
    )
    return [_listing_to_detail(l) for l in listings]


@router.get("/my-listings-enriched", response_model=list[MarketplaceListingEnrichedResponse])
def my_listings_enriched(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listings = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.user_id == current_user.id)
        .order_by(MarketplaceListing.created_at.desc())
        .all()
    )
    results = []
    for listing in listings:
        resp = MarketplaceListingEnrichedResponse.model_validate(listing)
        resp.matches_count = len(listing.matches) if listing.matches else 0
        resp.bids_count = len(listing.bids) if listing.bids else 0

        accepted_bid = (
            db.query(Bid)
            .filter(Bid.listing_id == listing.id, Bid.status == "accepted")
            .first()
        )
        if accepted_bid:
            specialist = db.query(User).filter(User.id == accepted_bid.specialist_id).first()
            resp.accepted_bid = AcceptedBidInfo(
                specialist_name=specialist.full_name if specialist else "Unknown",
                estimated_hours=accepted_bid.estimated_hours,
                estimated_amount=accepted_bid.estimated_amount,
            )

        resp.notes_count = db.query(CaseNote).filter(CaseNote.case_id == listing.case_id).count()
        resp.documents_count = db.query(CaseDocument).filter(CaseDocument.case_id == listing.case_id).count()
        results.append(resp)
    return results


@router.get("/my-matches", response_model=list[CaseMatchResponse])
def my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    matches = (
        db.query(CaseMatch)
        .filter(CaseMatch.specialist_id == current_user.id)
        .order_by(CaseMatch.relevance_score.desc())
        .all()
    )
    results = []
    for match in matches:
        resp = CaseMatchResponse.model_validate(match)
        if match.listing:
            resp.listing = MarketplaceListingResponse.model_validate(match.listing)
        results.append(resp)
    return results


@router.get("/my-bids", response_model=list[BidResponse])
def my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bids = (
        db.query(Bid)
        .filter(Bid.specialist_id == current_user.id)
        .order_by(Bid.created_at.desc())
        .all()
    )
    return [_bid_to_response(b, db) for b in bids]


@router.get("/listings/{listing_id}", response_model=MarketplaceListingDetailResponse)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_to_detail(listing)


@router.post("/cases/{case_id}/publish", response_model=MarketplaceListingDetailResponse)
def publish_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        listing = marketplace_service.publish_listing(db, case_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    db.refresh(listing)
    return _listing_to_detail(listing)


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def close_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = (
        db.query(MarketplaceListing)
        .filter(MarketplaceListing.id == listing_id, MarketplaceListing.user_id == current_user.id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    listing.status = "closed"
    db.commit()


# --- Bids ---

@router.get("/listings/{listing_id}/bids", response_model=list[BidResponse])
def list_bids(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    bids = (
        db.query(Bid)
        .filter(Bid.listing_id == listing_id)
        .order_by(Bid.created_at.desc())
        .all()
    )
    return [_bid_to_response(b, db) for b in bids]


@router.post("/listings/{listing_id}/bids", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
def create_bid(
    listing_id: int,
    payload: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        bid = marketplace_service.submit_bid(db, listing_id, current_user.id, payload.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _bid_to_response(bid, db)


@router.put("/bids/{bid_id}/accept", response_model=BidResponse)
def accept_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        bid = marketplace_service.accept_bid(db, bid_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _bid_to_response(bid, db)


@router.put("/bids/{bid_id}/withdraw", response_model=BidResponse)
def withdraw_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.specialist_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    if bid.status != "pending":
        raise HTTPException(status_code=400, detail="Can only withdraw pending bids")
    bid.status = "withdrawn"
    db.commit()
    db.refresh(bid)
    return _bid_to_response(bid, db)
