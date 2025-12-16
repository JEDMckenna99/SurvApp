from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"))
    entry_type = Column(String(50), nullable=False)  # clock_in, clock_out, break_start, break_end
    entry_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id])
    job = relationship("Job")

