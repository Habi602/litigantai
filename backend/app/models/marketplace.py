from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SpecialistProfile(Base):
    __tablename__ = "specialist_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, index=True)
    practice_areas: Mapped[list] = mapped_column(JSON, default=list)
    sub_areas: Mapped[list] = mapped_column(JSON, default=list)
    custom_areas: Mapped[list] = mapped_column(JSON, default=list)
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    years_experience: Mapped[int] = mapped_column(Integer, default=0)
    bar_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    jurisdiction: Mapped[str] = mapped_column(String(100), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    hourly_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    availability: Mapped[str] = mapped_column(String(20), default="available")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: Mapped["User"] = relationship(back_populates="specialist_profile")


class SpecialistDocument(Base):
    __tablename__ = "specialist_documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    file_path: Mapped[str] = mapped_column(String(500))
    original_filename: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50), default="other")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="specialist_documents")


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    redacted_summary: Mapped[str] = mapped_column(Text, default="")
    case_category: Mapped[str] = mapped_column(String(50), default="other")
    estimated_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    claim_or_defence: Mapped[str] = mapped_column(String(20), default="claim")
    status: Mapped[str] = mapped_column(String(20), default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    case: Mapped["Case"] = relationship(back_populates="marketplace_listing")
    matches: Mapped[list["CaseMatch"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )
    bids: Mapped[list["Bid"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan"
    )


class CaseMatch(Base):
    __tablename__ = "case_matches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("marketplace_listings.id"), index=True)
    specialist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)
    rationale: Mapped[str] = mapped_column(Text, default="")
    matched_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)

    listing: Mapped["MarketplaceListing"] = relationship(back_populates="matches")


class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    listing_id: Mapped[int] = mapped_column(Integer, ForeignKey("marketplace_listings.id"), index=True)
    specialist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    message: Mapped[str] = mapped_column(Text, default="")
    price_structure: Mapped[str] = mapped_column(String(20), default="hourly")
    estimated_amount: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    notified_accepted: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    listing: Mapped["MarketplaceListing"] = relationship(back_populates="bids")
