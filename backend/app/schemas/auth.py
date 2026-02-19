from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str = ""


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
