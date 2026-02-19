from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.evidence import Evidence
from app.models.key_fact import KeyFact
from app.models.user import User
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.schemas.evidence import KeyFactResponse
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case


class FactTextUpdate(BaseModel):
    fact_text: str

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get("/", response_model=list[CaseResponse])
def list_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cases = (
        db.query(Case)
        .filter(Case.user_id == current_user.id)
        .order_by(Case.updated_at.desc())
        .all()
    )
    results = []
    for case in cases:
        resp = CaseResponse.model_validate(case)
        resp.evidence_count = len(case.evidence)
        results.append(resp)
    return results


@router.post("/", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(
    payload: CaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = Case(user_id=current_user.id, **payload.model_dump())
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    resp = CaseResponse.model_validate(case)
    resp.evidence_count = len(case.evidence)
    return resp


@router.put("/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(case, key, value)

    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()


@router.get("/{case_id}/facts", response_model=list[KeyFactResponse])
def list_facts(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    evidence_ids = (
        db.query(Evidence.id).filter(Evidence.case_id == case_id).subquery()
    )
    facts = (
        db.query(KeyFact)
        .filter(KeyFact.evidence_id.in_(evidence_ids))
        .order_by(KeyFact.importance.desc(), KeyFact.created_at.asc())
        .all()
    )
    return facts


@router.patch("/{case_id}/facts/{fact_id}", response_model=KeyFactResponse)
def update_fact(
    case_id: int,
    fact_id: int,
    payload: FactTextUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not can_access_case(current_user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    fact = db.query(KeyFact).filter(KeyFact.id == fact_id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    evidence = db.query(Evidence).filter(
        Evidence.id == fact.evidence_id, Evidence.case_id == case_id
    ).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Fact not found")
    fact.fact_text = payload.fact_text
    db.commit()
    db.refresh(fact)
    return fact
