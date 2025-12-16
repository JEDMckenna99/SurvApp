from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class SMSMessage(Base):
    __tablename__ = "sms_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Twilio message data
    message_sid = Column(String(100), unique=True)
    from_number = Column(String(20), nullable=False)
    to_number = Column(String(20), nullable=False)
    body = Column(Text)
    direction = Column(String(20))  # inbound, outbound
    status = Column(String(20))  # received, sent, delivered, failed
    
    # Link to entities
    job_id = Column(String, ForeignKey("jobs.id"))
    employee_id = Column(String, ForeignKey("users.id"))
    customer_id = Column(String, ForeignKey("customers.id"))
    
    # Command processing
    command_type = Column(String(50))  # clock_in, on_my_way, start_job, finish_job, upload_summary
    command_processed = Column(Boolean, default=False)
    
    # Media attachments (for MMS)
    media_url = Column(String(500))
    media_type = Column(String(50))
    
    # Timestamps
    received_at = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime)
    
    # Relationships
    job = relationship("Job", back_populates="sms_messages")
    employee = relationship("User", foreign_keys=[employee_id])
    customer = relationship("Customer", foreign_keys=[customer_id])










