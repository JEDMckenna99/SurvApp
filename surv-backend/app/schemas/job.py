from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time


class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    job_type: Optional[str] = None
    scheduled_date: date
    scheduled_start_time: Optional[time] = None
    scheduled_end_time: Optional[time] = None
    estimated_duration: Optional[int] = None  # minutes
    priority: str = "normal"


class JobCreate(JobBase):
    customer_id: str
    assigned_to: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    job_type: Optional[str] = None
    status: Optional[str] = None
    scheduled_date: Optional[date] = None
    scheduled_start_time: Optional[time] = None
    scheduled_end_time: Optional[time] = None
    estimated_duration: Optional[int] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None


class JobResponse(JobBase):
    id: str
    job_number: str
    customer_id: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

