from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class TimeEntryBase(BaseModel):
    entry_type: str  # clock_in, clock_out, break_start, break_end
    entry_time: datetime
    job_id: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    notes: Optional[str] = None


class TimeEntryCreate(TimeEntryBase):
    pass


class TimeEntryResponse(TimeEntryBase):
    id: str
    employee_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

