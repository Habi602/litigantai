from datetime import datetime
from typing import Optional

from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(100), default="")
    role: Mapped[str] = mapped_column(String(20), default="litigant")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    specialist_profile: Mapped[Optional["SpecialistProfile"]] = relationship(
        back_populates="user", uselist=False
    )
    specialist_documents: Mapped[list["SpecialistDocument"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    litigant_profile: Mapped[Optional["LitigantProfile"]] = relationship(
        back_populates="user", uselist=False
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
