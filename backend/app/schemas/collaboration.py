from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CaseCollaboratorResponse(BaseModel):
    id: int
    case_id: int
    user_id: int
    role: str
    bid_id: Optional[int]
    joined_at: datetime
    user_name: str = ""

    model_config = {"from_attributes": True}


class CaseNoteCreate(BaseModel):
    content: str
    evidence_id: Optional[int] = None
    note_type: str = "note"


class CaseNoteUpdate(BaseModel):
    content: Optional[str] = None
    note_type: Optional[str] = None


class CaseNoteResponse(BaseModel):
    id: int
    case_id: int
    user_id: int
    evidence_id: Optional[int]
    content: str
    note_type: str
    created_at: datetime
    updated_at: datetime
    author_name: str = ""

    model_config = {"from_attributes": True}


class CaseDocumentResponse(BaseModel):
    id: int
    case_id: int
    user_id: int
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    description: Optional[str]
    created_at: datetime
    uploader_name: str = ""

    model_config = {"from_attributes": True}
