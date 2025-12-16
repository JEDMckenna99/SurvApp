from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class FileUpload(Base):
    __tablename__ = "file_uploads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer)  # bytes
    file_type = Column(String(100))  # mime type
    file_path = Column(String(500), nullable=False)  # S3 path or local path
    
    # Link to entity
    entity_type = Column(String(50), nullable=False)  # job, customer, invoice
    entity_id = Column(String, nullable=False)
    
    # Category
    category = Column(String(50))  # before_photo, after_photo, document, signature
    description = Column(String)
    
    # Upload metadata
    uploaded_by = Column(String, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    uploader = relationship("User")

