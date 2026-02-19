from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- Specialist Document ---

class SpecialistDocumentResponse(BaseModel):
    id: int
    user_id: int
    original_filename: str
    category: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Specialist Profile ---

class SpecialistProfileCreate(BaseModel):
    practice_areas: list[str]
    sub_areas: list[str] = []
    custom_areas: list[str] = []
    linkedin_url: Optional[str] = None
    years_experience: int = 0
    bar_number: Optional[str] = None
    jurisdiction: str = ""
    bio: str = ""
    hourly_rate: Optional[float] = None
    availability: str = "available"


class SpecialistProfileUpdate(BaseModel):
    practice_areas: Optional[list[str]] = None
    sub_areas: Optional[list[str]] = None
    custom_areas: Optional[list[str]] = None
    linkedin_url: Optional[str] = None
    years_experience: Optional[int] = None
    bar_number: Optional[str] = None
    jurisdiction: Optional[str] = None
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    availability: Optional[str] = None


class SpecialistProfileResponse(BaseModel):
    id: int
    user_id: int
    practice_areas: list[str]
    sub_areas: list[str] = []
    custom_areas: list[str] = []
    linkedin_url: Optional[str] = None
    years_experience: int
    bar_number: Optional[str]
    jurisdiction: str
    bio: str
    hourly_rate: Optional[float]
    availability: str
    created_at: datetime
    updated_at: datetime
    full_name: str = ""
    documents: list[SpecialistDocumentResponse] = []

    model_config = {"from_attributes": True}


# --- Marketplace Listing ---

class MarketplaceListingResponse(BaseModel):
    id: int
    case_id: int
    user_id: int
    title: str
    redacted_summary: str
    case_category: str
    estimated_amount: Optional[float]
    claim_or_defence: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MarketplaceListingDetailResponse(MarketplaceListingResponse):
    matches_count: int = 0
    bids_count: int = 0


class AcceptedBidInfo(BaseModel):
    specialist_name: str
    estimated_hours: Optional[float]
    estimated_amount: float


class MarketplaceListingEnrichedResponse(MarketplaceListingDetailResponse):
    accepted_bid: Optional[AcceptedBidInfo] = None
    notes_count: int = 0
    documents_count: int = 0


# --- Case Match ---

class CaseMatchResponse(BaseModel):
    id: int
    listing_id: int
    specialist_id: int
    relevance_score: float
    rationale: str
    matched_at: datetime
    notified: bool
    listing: Optional[MarketplaceListingResponse] = None

    model_config = {"from_attributes": True}


# --- Bid ---

class BidCreate(BaseModel):
    message: str = ""
    price_structure: str = "hourly"
    estimated_amount: float = 0.0
    estimated_hours: Optional[float] = None


class BidResponse(BaseModel):
    id: int
    listing_id: int
    specialist_id: int
    message: str
    price_structure: str
    estimated_amount: float
    estimated_hours: Optional[float]
    status: str
    created_at: datetime
    updated_at: datetime
    specialist_name: str = ""
    specialist_profile: Optional[SpecialistProfileResponse] = None

    model_config = {"from_attributes": True}
