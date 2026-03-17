from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str = ""
    content: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str


class ConversationCreate(BaseModel):
    recipient_id: int
    case_id: Optional[int] = None
    listing_id: Optional[int] = None


class ConversationResponse(BaseModel):
    id: int
    participant_1_id: int
    participant_2_id: int
    case_id: Optional[int]
    listing_id: Optional[int]
    created_at: datetime
    last_message_at: Optional[datetime]
    other_user_id: int = 0
    other_user_name: str = ""
    last_message_text: str = ""
    unread_count: int = 0
    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int
