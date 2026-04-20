from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    bid_id: Mapped[int] = mapped_column(Integer, ForeignKey("bids.id"), index=True)
    payer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    payee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(3), default="GBP")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    # pending / succeeded / failed / refunded
    stripe_payment_intent_id: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    bid: Mapped["Bid"] = relationship(back_populates="payment")
    payer: Mapped["User"] = relationship(foreign_keys=[payer_id])
    payee: Mapped["User"] = relationship(foreign_keys=[payee_id])
    invoice: Mapped[Optional["Invoice"]] = relationship(
        back_populates="payment", uselist=False
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    payment_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("payments.id"), unique=True, nullable=True
    )
    case_id: Mapped[int] = mapped_column(Integer, ForeignKey("cases.id"), index=True)
    specialist_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    litigant_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    subtotal: Mapped[float] = mapped_column(Float)
    tax: Mapped[float] = mapped_column(Float, default=0.0)
    total: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    # draft / issued / paid / void
    issued_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    due_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    payment: Mapped[Optional["Payment"]] = relationship(back_populates="invoice")
    case: Mapped["Case"] = relationship(back_populates="invoices")
    specialist: Mapped["User"] = relationship(foreign_keys=[specialist_id])
    litigant: Mapped["User"] = relationship(foreign_keys=[litigant_id])
