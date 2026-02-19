from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CaseLawReference(BaseModel):
    citation: str
    relevance: str
    summary: str


class LegislationReference(BaseModel):
    statute: str
    section: str
    relevance: str


class CaseLegalAnalysisResponse(BaseModel):
    id: int
    case_id: int
    legal_positioning: Optional[str]
    strengths: Optional[list]
    weaknesses: Optional[list]
    relevant_case_law: Optional[list]
    relevant_legislation: Optional[list]
    open_questions: Optional[list]
    generated_at: datetime

    model_config = {"from_attributes": True}


class EvidenceAnalysisGapResponse(BaseModel):
    id: int
    evidence_id: int
    gap_text: str
    gap_type: str
    resolved: bool
    resolved_by: Optional[int]
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class EvidenceAnalysisGapResolve(BaseModel):
    resolved: bool = True
