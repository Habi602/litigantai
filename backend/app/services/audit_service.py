from typing import Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    entity_type: str,
    entity_id: int,
    action: str,
    user_id: Optional[int] = None,
    detail: Optional[dict] = None,
    ip: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        detail=detail,
        ip_address=ip,
    )
    db.add(entry)
    db.flush()
    return entry
