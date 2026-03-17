from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    case_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    case_type: Mapped[str] = mapped_column(String(50), default="general")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    evidence: Mapped[list["Evidence"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    bundles: Mapped[list["Bundle"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    marketplace_listing: Mapped[Optional["MarketplaceListing"]] = relationship(
        back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    legal_analysis: Mapped[Optional["CaseLegalAnalysis"]] = relationship(
        back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
    collaborators: Mapped[list["CaseCollaborator"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    notes: Mapped[list["CaseNote"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    documents: Mapped[list["CaseDocument"]] = relationship(
        back_populates="case", cascade="all, delete-orphan"
    )
    statement_of_claim: Mapped[Optional["StatementOfClaim"]] = relationship(
        back_populates="case", uselist=False, cascade="all, delete-orphan"
    )
