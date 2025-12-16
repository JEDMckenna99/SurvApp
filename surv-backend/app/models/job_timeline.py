from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class JobTimeline(Base):
    __tablename__ = "job_timeline"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    
    # Event tracking
    event_type = Column(String(50), nullable=False)  # on_my_way, arrived, started, completed
    event_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Employee who triggered event
    employee_id = Column(String, ForeignKey("users.id"))
    
    # Time tracking (in seconds)
    travel_time = Column(Integer)  # seconds from on_my_way to started
    job_duration = Column(Integer)  # seconds from started to completed
    
    # Location data
    latitude = Column(String(20))
    longitude = Column(String(20))
    
    # Notes
    notes = Column(String(500))
    
    # Relationships
    job = relationship("Job", back_populates="timeline")
    employee = relationship("User")










