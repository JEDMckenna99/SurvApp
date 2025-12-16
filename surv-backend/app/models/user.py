from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    technician = "technician"
    customer = "customer"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Lemma-only auth
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.technician)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Lemma IAM fields
    lemma_did = Column(String, unique=True, nullable=True, index=True)  # Decentralized ID

    # Relationships
    created_customers = relationship("Customer", back_populates="created_by_user", foreign_keys="Customer.created_by")
    assigned_jobs = relationship("Job", back_populates="technician", foreign_keys="Job.assigned_to")

