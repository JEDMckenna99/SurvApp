from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Date, Numeric, Integer
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
from app.database import Base


class Estimate(Base):
    __tablename__ = "estimates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    estimate_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="draft")  # draft, sent, viewed, approved, declined, expired
    valid_until = Column(Date, default=lambda: (datetime.utcnow() + timedelta(days=30)).date())
    subtotal = Column(Numeric(10, 2), default=0)
    tax_rate = Column(Numeric(5, 4), default=0)
    tax_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    total_amount = Column(Numeric(10, 2), default=0)
    terms = Column(Text)
    notes = Column(Text)
    created_by = Column(String, ForeignKey("users.id"))
    approved_at = Column(DateTime)
    converted_to_job_id = Column(String, ForeignKey("jobs.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer")
    line_items = relationship("EstimateLineItem", back_populates="estimate", cascade="all, delete-orphan")
    converted_job = relationship("Job", foreign_keys=[converted_to_job_id])


class EstimateLineItem(Base):
    __tablename__ = "estimate_line_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    estimate_id = Column(String, ForeignKey("estimates.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(String)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    sort_order = Column(Integer, default=0)

    # Relationships
    estimate = relationship("Estimate", back_populates="line_items")

