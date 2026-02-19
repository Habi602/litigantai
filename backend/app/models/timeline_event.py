from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), index=True)
    evidence_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("evidence.id"), nullable=True
    )
    event_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    date_precision: Mapped[str] = mapped_column(String(20), default="exact")
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), default="general")
    people_involved: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.5)
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    case: Mapped["Case"] = relationship(back_populates="timeline_events")
    evidence: Mapped[Optional["Evidence"]] = relationship(back_populates="timeline_events")
