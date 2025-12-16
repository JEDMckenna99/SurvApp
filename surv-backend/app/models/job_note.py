from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class JobNote(Base):
    __tablename__ = "job_notes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    note = Column(Text, nullable=False)
    is_internal = Column(String, default=False)  # True for internal notes, False for customer-visible
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("Job")
    user = relationship("User")

