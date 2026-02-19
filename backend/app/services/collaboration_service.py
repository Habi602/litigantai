from sqlalchemy.orm import Session
from app.models.case import Case
from app.models.collaboration import CaseCollaborator


def can_access_case(user_id: int, case_id: int, db: Session) -> bool:
    """Returns True if user owns the case OR is a CaseCollaborator."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return False
    if case.user_id == user_id:
        return True
    collaborator = (
        db.query(CaseCollaborator)
        .filter(CaseCollaborator.case_id == case_id, CaseCollaborator.user_id == user_id)
        .first()
    )
    return collaborator is not None
