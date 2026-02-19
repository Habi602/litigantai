from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class EvidenceResponse(BaseModel):
    id: int
    case_id: int
    filename: str
    file_path: str
    mime_type: str
    file_category: str
    file_size: int
    extracted_text: Optional[str]
    ai_summary: Optional[str]
    analysis_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EvidenceDetailResponse(EvidenceResponse):
    key_facts: list["KeyFactResponse"] = []

    model_config = {"from_attributes": True}


class KeyFactResponse(BaseModel):
    id: int
    evidence_id: int
    fact_text: str
    fact_type: str
    importance: str
    extracted_date: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
