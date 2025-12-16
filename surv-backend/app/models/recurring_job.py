from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class RecurringJob(Base):
    __tablename__ = "recurring_jobs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    job_type = Column(String(100))
    
    # Recurrence pattern
    frequency = Column(String(50), nullable=False)  # daily, weekly, monthly, yearly
    interval = Column(Integer, default=1)  # Every X days/weeks/months
    day_of_week = Column(Integer)  # For weekly (0=Monday, 6=Sunday)
    day_of_month = Column(Integer)  # For monthly (1-31)
    
    # Start and end dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)  # Optional end date
    
    # Job details
    estimated_duration = Column(Integer)  # minutes
    priority = Column(String(20), default="normal")
    assigned_to = Column(String, ForeignKey("users.id"))
    
    # Status
    is_active = Column(Boolean, default=True)
    last_generated = Column(DateTime)  # Last time a job was created
    
    # Metadata
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer")
    technician = relationship("User", foreign_keys=[assigned_to])

