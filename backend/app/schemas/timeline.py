from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TimelineEventCreate(BaseModel):
    event_date: Optional[str] = None
    date_precision: str = "exact"
    title: str
    description: Optional[str] = None
    event_type: str = "general"
    people_involved: Optional[list[str]] = None
    relevance_score: float = 0.5
    is_critical: bool = False


class TimelineEventUpdate(BaseModel):
    event_date: Optional[str] = None
    date_precision: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    people_involved: Optional[list[str]] = None
    relevance_score: Optional[float] = None
    is_critical: Optional[bool] = None


class TimelineEventResponse(BaseModel):
    id: int
    case_id: int
    evidence_id: Optional[int]
    event_date: Optional[str]
    date_precision: str
    title: str
    description: Optional[str]
    event_type: str
    people_involved: Optional[list[str]]
    relevance_score: float
    is_critical: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
