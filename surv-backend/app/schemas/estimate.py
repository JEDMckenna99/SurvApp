from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal


class EstimateLineItemBase(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    
    class Config:
        from_attributes = True


class EstimateLineItemResponse(EstimateLineItemBase):
    id: str
    total_price: Decimal
    sort_order: int


class EstimateBase(BaseModel):
    customer_id: str
    title: str
    description: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    tax_rate: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")


class EstimateCreate(EstimateBase):
    line_items: List[EstimateLineItemBase] = []


class EstimateUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    tax_rate: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None


class EstimateResponse(EstimateBase):
    id: str
    estimate_number: str
    status: str
    valid_until: date
    subtotal: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    line_items: List[EstimateLineItemResponse] = []
    approved_at: Optional[datetime] = None
    converted_to_job_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

