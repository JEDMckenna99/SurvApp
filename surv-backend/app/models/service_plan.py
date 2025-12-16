from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, Integer, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class ServicePlan(Base):
    """Recurring service plans/maintenance packages"""
    __tablename__ = "service_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    billing_frequency = Column(String(50), nullable=False)  # monthly, quarterly, yearly
    service_frequency = Column(String(50))  # How often service is performed
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomerServicePlan(Base):
    """Customer subscription to a service plan"""
    __tablename__ = "customer_service_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    service_plan_id = Column(String, ForeignKey("service_plans.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)  # null = ongoing
    status = Column(String(50), default="active")  # active, paused, cancelled
    next_billing_date = Column(DateTime)
    next_service_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer")
    service_plan = relationship("ServicePlan")

