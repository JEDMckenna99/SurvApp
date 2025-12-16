from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Date, Time, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    job_type = Column(String(100))  # plumbing, hvac, electrical, etc.
    status = Column(String(50), default="scheduled")  # scheduled, in_progress, completed, cancelled
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    scheduled_date = Column(Date, nullable=False)
    scheduled_start_time = Column(Time)
    scheduled_end_time = Column(Time)
    actual_start_time = Column(DateTime)
    actual_end_time = Column(DateTime)
    estimated_duration = Column(Integer)  # minutes
    assigned_to = Column(String, ForeignKey("users.id"))
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="jobs")
    technician = relationship("User", back_populates="assigned_jobs", foreign_keys=[assigned_to])
    invoice = relationship("Invoice", back_populates="job", uselist=False)
    sms_messages = relationship("SMSMessage", back_populates="job", cascade="all, delete-orphan")
    timeline = relationship("JobTimeline", back_populates="job", cascade="all, delete-orphan")

