from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StatementOfClaimResponse(BaseModel):
    id: int
    case_id: int
    content: Optional[str]
    generated_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatementOfClaimUpsert(BaseModel):
    content: str
