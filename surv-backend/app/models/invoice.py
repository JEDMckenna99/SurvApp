from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Date, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"))
    status = Column(String(50), default="draft")  # draft, sent, viewed, partial, paid, overdue, void
    issue_date = Column(Date, nullable=False, default=datetime.utcnow().date)
    due_date = Column(Date, nullable=False, default=lambda: (datetime.utcnow() + timedelta(days=30)).date())
    subtotal = Column(Numeric(10, 2), default=0)
    tax_rate = Column(Numeric(5, 4), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), default=0)
    amount_paid = Column(Numeric(10, 2), default=0)
    amount_due = Column(Numeric(10, 2), default=0)
    terms = Column(Text)
    notes = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    sent_at = Column(DateTime)
    paid_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    job = relationship("Job", back_populates="invoice")
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")

