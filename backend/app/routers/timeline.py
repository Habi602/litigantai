from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.case import Case
from app.models.timeline_event import TimelineEvent
from app.models.user import User
from app.schemas.timeline import TimelineEventUpdate, TimelineEventResponse
from app.services.auth import get_current_user
from app.services.collaboration_service import can_access_case

router = APIRouter(prefix="/cases/{case_id}/timeline", tags=["timeline"])


def _get_case(case_id: int, user: User, db: Session) -> Case:
    case = db.query(Case).filter(Case.id == case_id, Case.user_id == user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


def _get_case_readable(case_id: int, user: User, db: Session) -> Case:
    """Allow access if user owns the case OR is a collaborator."""
    if not can_access_case(user.id, case_id, db):
        raise HTTPException(status_code=403, detail="Not authorized to access this case")
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.get("/", response_model=list[TimelineEventResponse])
def get_timeline(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case_readable(case_id, current_user, db)
    return (
        db.query(TimelineEvent)
        .filter(TimelineEvent.case_id == case_id)
        .order_by(TimelineEvent.event_date.asc())
        .all()
    )


@router.post("/generate", response_model=list[TimelineEventResponse])
def generate_timeline(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)

    from app.services.ai_service import generate_timeline as run_generation
    run_generation(case_id, db)

    return (
        db.query(TimelineEvent)
        .filter(TimelineEvent.case_id == case_id)
        .order_by(TimelineEvent.event_date.asc())
        .all()
    )


@router.put("/{event_id}", response_model=TimelineEventResponse)
def update_event(
    case_id: int,
    event_id: int,
    payload: TimelineEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    event = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.id == event_id, TimelineEvent.case_id == case_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    case_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_case(case_id, current_user, db)
    event = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.id == event_id, TimelineEvent.case_id == case_id)
        .first()
    )
    if not event:
        raise HTTPException(status_code=404, detail="Timeline event not found")
    db.delete(event)
    db.commit()
