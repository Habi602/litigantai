from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- Request schemas ---

class BundleCreate(BaseModel):
    title: str
    evidence_ids: list[int]


class BundleAddEvidence(BaseModel):
    evidence_id: int
    position: Optional[int] = None


class BundleRemoveEvidence(BaseModel):
    evidence_id: int


class BundleLinkCreate(BaseModel):
    source_page: int
    target_page: int
    x: float = 0.0
    y: float = 0.0
    width: float = 100.0
    height: float = 20.0
    label: Optional[str] = None


class BundleHighlightCreate(BaseModel):
    page_number: int
    x: float = 0.0
    y: float = 0.0
    width: float = 100.0
    height: float = 50.0
    color: str = "yellow"
    note: Optional[str] = None


# --- Response schemas ---

class BundlePageResponse(BaseModel):
    id: int
    bundle_id: int
    evidence_id: int
    source_page_number: int
    bundle_page_number: int
    content_hash: str
    is_duplicate_of: Optional[int]
    section_title: Optional[str]

    model_config = {"from_attributes": True}


class BundleLinkResponse(BaseModel):
    id: int
    bundle_id: int
    source_page: int
    target_page: int
    x: float
    y: float
    width: float
    height: float
    label: Optional[str]

    model_config = {"from_attributes": True}


class BundleHighlightResponse(BaseModel):
    id: int
    bundle_id: int
    page_number: int
    x: float
    y: float
    width: float
    height: float
    color: str
    note: Optional[str]

    model_config = {"from_attributes": True}


class BundleResponse(BaseModel):
    id: int
    case_id: int
    title: str
    status: str
    file_path: Optional[str]
    file_size: int
    total_pages: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BundleDetailResponse(BundleResponse):
    pages: list[BundlePageResponse] = []
    links: list[BundleLinkResponse] = []
    highlights: list[BundleHighlightResponse] = []

    model_config = {"from_attributes": True}


# --- Propose-order schemas ---

class ProposeOrderRequest(BaseModel):
    evidence_ids: list[int]


class ProposeOrderDoc(BaseModel):
    evidence_id: int
    title: str
    date: str
    summary: str


class ProposeOrderResponse(BaseModel):
    docs: list[ProposeOrderDoc]
    order: list[int]
    rationale: str
