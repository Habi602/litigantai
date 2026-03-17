from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.messaging import Conversation, Message
from app.schemas.messaging import (
    MessageCreate,
    MessageResponse,
    ConversationCreate,
    ConversationResponse,
    UnreadCountResponse,
)
from app.services.auth import get_current_user
from app.services.messaging_service import (
    get_or_create_conversation,
    enrich_conversation,
    mark_messages_read,
    get_total_unread,
)

router = APIRouter(tags=["messages"])


@router.get("/messages/unread-count", response_model=UnreadCountResponse)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = get_total_unread(current_user.id, db)
    return UnreadCountResponse(count=count)


@router.get("/messages/conversations", response_model=list[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    convs = (
        db.query(Conversation)
        .filter(
            (Conversation.participant_1_id == current_user.id) |
            (Conversation.participant_2_id == current_user.id)
        )
        .order_by(Conversation.last_message_at.desc().nullslast())
        .all()
    )
    return [enrich_conversation(c, current_user.id, db) for c in convs]


@router.post("/messages/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = get_or_create_conversation(
        db,
        current_user.id,
        payload.recipient_id,
        payload.case_id,
        payload.listing_id,
    )
    return enrich_conversation(conv, current_user.id, db)


@router.get("/messages/conversations/{conversation_id}", response_model=list[MessageResponse])
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id not in (conv.participant_1_id, conv.participant_2_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    mark_messages_read(conversation_id, current_user.id, db)

    msgs = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
        .all()
    )
    results = []
    for m in msgs:
        r = MessageResponse.model_validate(m)
        if m.sender:
            r.sender_name = m.sender.full_name
        results.append(r)
    return results


@router.post("/messages/conversations/{conversation_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id not in (conv.participant_1_id, conv.participant_2_id):
        raise HTTPException(status_code=403, detail="Not authorized")

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        is_read=False,
    )
    db.add(msg)
    conv.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    r = MessageResponse.model_validate(msg)
    r.sender_name = current_user.full_name
    return r
