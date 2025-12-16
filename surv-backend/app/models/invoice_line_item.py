from sqlalchemy import Column, String, ForeignKey, Numeric, Integer
from sqlalchemy.orm import relationship
import uuid
from app.database import Base


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(String)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    sort_order = Column(Integer, default=0)

    # Relationships
    invoice = relationship("Invoice", back_populates="line_items")

