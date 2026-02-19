from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.statement_of_claim import StatementOfClaim
from app.schemas.statement_of_claim import StatementOfClaimResponse, StatementOfClaimUpsert
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case
from app.services import ai_service

router = APIRouter(prefix="/cases", tags=["statement-of-claim"])


def _get_or_404(case_id: int, current_user: User, db: Session) -> None:
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")


@router.get("/{case_id}/statement-of-claim", response_model=StatementOfClaimResponse)
def get_statement(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if not stmt:
        raise HTTPException(status_code=404, detail="Statement of claim not found")
    return stmt


@router.put("/{case_id}/statement-of-claim", response_model=StatementOfClaimResponse)
def upsert_statement(
    case_id: int,
    payload: StatementOfClaimUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if stmt:
        stmt.content = payload.content
        stmt.generated_by = "user"
    else:
        stmt = StatementOfClaim(case_id=case_id, content=payload.content, generated_by="user")
        db.add(stmt)
    db.commit()
    db.refresh(stmt)
    return stmt


@router.post("/{case_id}/statement-of-claim/generate", response_model=StatementOfClaimResponse)
def generate_statement(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_or_404(case_id, current_user, db)
    content = ai_service.generate_statement_of_claim(case_id, db)
    stmt = db.query(StatementOfClaim).filter(StatementOfClaim.case_id == case_id).first()
    if stmt:
        stmt.content = content
        stmt.generated_by = "ai"
    else:
        stmt = StatementOfClaim(case_id=case_id, content=content, generated_by="ai")
        db.add(stmt)
    db.commit()
    db.refresh(stmt)
    return stmt
