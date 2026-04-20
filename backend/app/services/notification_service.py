from typing import Optional
from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    type: str,
    title: str,
    body: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        related_entity_type=entity_type,
        related_entity_id=entity_id,
    )
    db.add(notification)
    db.flush()
    return notification
