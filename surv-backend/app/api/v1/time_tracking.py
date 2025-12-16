from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.time_entry import TimeEntry
from app.models.user import User, UserRole
from app.schemas.time_entry import TimeEntryCreate, TimeEntryResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/time-tracking", tags=["time-tracking"])


@router.get("", response_model=List[TimeEntryResponse])
def list_time_entries(
    employee_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List time entries with optional filters"""
    query = db.query(TimeEntry)
    
    # Technicians can only see their own entries
    if current_user.role == UserRole.technician:
        query = query.filter(TimeEntry.employee_id == current_user.id)
    elif employee_id:
        query = query.filter(TimeEntry.employee_id == employee_id)
    
    if date_from:
        query = query.filter(TimeEntry.entry_time >= datetime.combine(date_from, datetime.min.time()))
    
    if date_to:
        query = query.filter(TimeEntry.entry_time <= datetime.combine(date_to, datetime.max.time()))
    
    query = query.order_by(TimeEntry.entry_time.desc())
    entries = query.offset(skip).limit(limit).all()
    
    return [TimeEntryResponse.model_validate(entry) for entry in entries]


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(
    entry_data: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new time entry (clock in/out)"""
    db_entry = TimeEntry(
        **entry_data.model_dump(),
        employee_id=current_user.id
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    
    return TimeEntryResponse.model_validate(db_entry)


@router.get("/summary/{employee_id}")
def get_time_summary(
    employee_id: str,
    date_from: date,
    date_to: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get time worked summary for an employee"""
    # Check permissions
    if current_user.role == UserRole.technician and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own time summary"
        )
    
    entries = db.query(TimeEntry).filter(
        TimeEntry.employee_id == employee_id,
        TimeEntry.entry_time >= datetime.combine(date_from, datetime.min.time()),
        TimeEntry.entry_time <= datetime.combine(date_to, datetime.max.time())
    ).order_by(TimeEntry.entry_time).all()
    
    total_hours = 0.0
    clock_in = None
    
    for entry in entries:
        if entry.entry_type == "clock_in":
            clock_in = entry.entry_time
        elif entry.entry_type == "clock_out" and clock_in:
            hours = (entry.entry_time - clock_in).total_seconds() / 3600
            total_hours += hours
            clock_in = None
    
    return {
        "employee_id": employee_id,
        "date_from": date_from,
        "date_to": date_to,
        "total_hours": round(total_hours, 2),
        "total_entries": len(entries)
    }

