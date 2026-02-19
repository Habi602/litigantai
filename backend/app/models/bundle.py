from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Bundle(Base):
    __tablename__ = "bundles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    status: Mapped[str] = mapped_column(String(20), default="draft")
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    total_pages: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    case: Mapped["Case"] = relationship(back_populates="bundles")
    pages: Mapped[list["BundlePage"]] = relationship(
        back_populates="bundle", cascade="all, delete-orphan"
    )
    links: Mapped[list["BundleLink"]] = relationship(
        back_populates="bundle", cascade="all, delete-orphan"
    )
    highlights: Mapped[list["BundleHighlight"]] = relationship(
        back_populates="bundle", cascade="all, delete-orphan"
    )


class BundlePage(Base):
    __tablename__ = "bundle_pages"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bundle_id: Mapped[int] = mapped_column(Integer, ForeignKey("bundles.id"), index=True)
    evidence_id: Mapped[int] = mapped_column(Integer, ForeignKey("evidence.id"), index=True)
    source_page_number: Mapped[int] = mapped_column(Integer)
    bundle_page_number: Mapped[int] = mapped_column(Integer)
    content_hash: Mapped[str] = mapped_column(String(64))
    is_duplicate_of: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("bundle_pages.id"), nullable=True
    )
    section_title: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    bundle: Mapped["Bundle"] = relationship(back_populates="pages")
    evidence: Mapped["Evidence"] = relationship()
    duplicate_source: Mapped[Optional["BundlePage"]] = relationship(
        remote_side="BundlePage.id"
    )


class BundleLink(Base):
    __tablename__ = "bundle_links"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bundle_id: Mapped[int] = mapped_column(Integer, ForeignKey("bundles.id"), index=True)
    source_page: Mapped[int] = mapped_column(Integer)
    target_page: Mapped[int] = mapped_column(Integer)
    x: Mapped[float] = mapped_column(Float, default=0.0)
    y: Mapped[float] = mapped_column(Float, default=0.0)
    width: Mapped[float] = mapped_column(Float, default=100.0)
    height: Mapped[float] = mapped_column(Float, default=20.0)
    label: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    bundle: Mapped["Bundle"] = relationship(back_populates="links")


class BundleHighlight(Base):
    __tablename__ = "bundle_highlights"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bundle_id: Mapped[int] = mapped_column(Integer, ForeignKey("bundles.id"), index=True)
    page_number: Mapped[int] = mapped_column(Integer)
    x: Mapped[float] = mapped_column(Float, default=0.0)
    y: Mapped[float] = mapped_column(Float, default=0.0)
    width: Mapped[float] = mapped_column(Float, default=100.0)
    height: Mapped[float] = mapped_column(Float, default=50.0)
    color: Mapped[str] = mapped_column(String(20), default="yellow")
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    bundle: Mapped["Bundle"] = relationship(back_populates="highlights")
