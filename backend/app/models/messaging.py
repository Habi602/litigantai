from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    participant_1_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    participant_2_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    case_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("cases.id"), nullable=True)
    listing_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("marketplace_listings.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")
    participant_1: Mapped["User"] = relationship(foreign_keys=[participant_1_id])
    participant_2: Mapped["User"] = relationship(foreign_keys=[participant_2_id])


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship(foreign_keys=[sender_id])
