from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class KeyFact(Base):
    __tablename__ = "key_facts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evidence_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("evidence.id"), index=True
    )
    fact_text: Mapped[str] = mapped_column(Text)
    fact_type: Mapped[str] = mapped_column(String(50), default="general")
    importance: Mapped[str] = mapped_column(String(20), default="medium")
    extracted_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    evidence: Mapped["Evidence"] = relationship(back_populates="key_facts")
