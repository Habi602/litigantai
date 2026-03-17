from datetime import datetime
from sqlalchemy.orm import Session
from app.models.messaging import Conversation, Message
from app.models.user import User


def get_or_create_conversation(
    db: Session,
    user_id: int,
    recipient_id: int,
    case_id: int | None,
    listing_id: int | None,
) -> Conversation:
    existing = (
        db.query(Conversation)
        .filter(
            (
                (Conversation.participant_1_id == user_id) &
                (Conversation.participant_2_id == recipient_id)
            ) | (
                (Conversation.participant_1_id == recipient_id) &
                (Conversation.participant_2_id == user_id)
            ),
            Conversation.case_id == case_id,
            Conversation.listing_id == listing_id,
        )
        .first()
    )
    if existing:
        return existing

    conv = Conversation(
        participant_1_id=user_id,
        participant_2_id=recipient_id,
        case_id=case_id,
        listing_id=listing_id,
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def enrich_conversation(conv: Conversation, current_user_id: int, db: Session) -> dict:
    other_id = conv.participant_2_id if conv.participant_1_id == current_user_id else conv.participant_1_id
    other_user = db.query(User).filter(User.id == other_id).first()
    other_name = other_user.full_name if other_user else ""

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )
    last_text = last_msg.content[:80] if last_msg else ""

    unread = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_read == False,
        )
        .count()
    )

    return {
        "id": conv.id,
        "participant_1_id": conv.participant_1_id,
        "participant_2_id": conv.participant_2_id,
        "case_id": conv.case_id,
        "listing_id": conv.listing_id,
        "created_at": conv.created_at,
        "last_message_at": conv.last_message_at,
        "other_user_id": other_id,
        "other_user_name": other_name,
        "last_message_text": last_text,
        "unread_count": unread,
    }


def mark_messages_read(conversation_id: int, current_user_id: int, db: Session) -> None:
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user_id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()


def get_total_unread(current_user_id: int, db: Session) -> int:
    convs = (
        db.query(Conversation)
        .filter(
            (Conversation.participant_1_id == current_user_id) |
            (Conversation.participant_2_id == current_user_id)
        )
        .all()
    )
    total = 0
    for conv in convs:
        total += (
            db.query(Message)
            .filter(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user_id,
                Message.is_read == False,
            )
            .count()
        )
    return total
