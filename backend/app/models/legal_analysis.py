from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Text, Float, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class CaseLegalAnalysis(Base):
    __tablename__ = "case_legal_analysis"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), unique=True, index=True)
    legal_positioning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    strengths: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    relevant_case_law: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    relevant_legislation: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    open_questions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    case: Mapped["Case"] = relationship(back_populates="legal_analysis")


class EvidenceAnalysisGap(Base):
    __tablename__ = "evidence_analysis_gaps"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    evidence_id: Mapped[int] = mapped_column(Integer, ForeignKey("evidence.id"), index=True)
    gap_text: Mapped[str] = mapped_column(Text)
    gap_type: Mapped[str] = mapped_column(String(30), default="missing_info")
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    evidence: Mapped["Evidence"] = relationship(back_populates="analysis_gaps")
