from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CaseCreate(BaseModel):
    title: str
    case_number: Optional[str] = None
    case_type: str = "general"
    description: Optional[str] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    case_number: Optional[str] = None
    case_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class CaseResponse(BaseModel):
    id: int
    user_id: int
    title: str
    case_number: Optional[str]
    case_type: str
    description: Optional[str]
    status: str
    evidence_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
