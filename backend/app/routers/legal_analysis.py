from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.legal_analysis import CaseLegalAnalysis, EvidenceAnalysisGap
from app.schemas.legal_analysis import (
    CaseLegalAnalysisResponse,
    EvidenceAnalysisGapResponse,
    EvidenceAnalysisGapResolve,
)
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case

router = APIRouter(tags=["legal-analysis"])


@router.get("/cases/{case_id}/legal-analysis", response_model=CaseLegalAnalysisResponse)
def get_legal_analysis(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    analysis = (
        db.query(CaseLegalAnalysis)
        .filter(CaseLegalAnalysis.case_id == case_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Legal analysis not found")
    return analysis


@router.get("/evidence/{evidence_id}/gaps", response_model=list[EvidenceAnalysisGapResponse])
def get_evidence_gaps(
    evidence_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.evidence import Evidence

    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    if not can_access_case(current_user.id, evidence.case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")

    gaps = (
        db.query(EvidenceAnalysisGap)
        .filter(EvidenceAnalysisGap.evidence_id == evidence_id)
        .order_by(EvidenceAnalysisGap.created_at)
        .all()
    )
    return gaps


@router.put("/evidence/gaps/{gap_id}/resolve", response_model=EvidenceAnalysisGapResponse)
def resolve_gap(
    gap_id: int,
    payload: EvidenceAnalysisGapResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    gap = db.query(EvidenceAnalysisGap).filter(EvidenceAnalysisGap.id == gap_id).first()
    if not gap:
        raise HTTPException(status_code=404, detail="Gap not found")

    from app.models.evidence import Evidence

    evidence = db.query(Evidence).filter(Evidence.id == gap.evidence_id).first()
    if not can_access_case(current_user.id, evidence.case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized")

    gap.resolved = payload.resolved
    gap.resolved_by = current_user.id if payload.resolved else None
    gap.resolved_at = datetime.utcnow() if payload.resolved else None
    db.commit()
    db.refresh(gap)
    return gap
