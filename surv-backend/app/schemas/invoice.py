from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from decimal import Decimal


class InvoiceBase(BaseModel):
    customer_id: str
    job_id: Optional[str] = None
    subtotal: Decimal = Decimal("0.00")
    tax_rate: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    terms: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    subtotal: Optional[Decimal] = None
    tax_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    terms: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    status: str
    issue_date: date
    due_date: date
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

