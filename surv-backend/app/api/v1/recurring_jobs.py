from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date
from app.database import get_db
from app.models.recurring_job import RecurringJob
from app.models.job import Job
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/recurring-jobs", tags=["recurring-jobs"])


def generate_job_number(db: Session) -> str:
    """Generate a unique job number"""
    count = db.query(Job).count()
    return f"JOB-{count + 1:05d}"


def calculate_next_occurrence(recurring_job: RecurringJob, from_date: datetime) -> datetime:
    """Calculate the next occurrence date based on recurrence pattern"""
    if recurring_job.frequency == "daily":
        return from_date + timedelta(days=recurring_job.interval)
    elif recurring_job.frequency == "weekly":
        days_ahead = recurring_job.day_of_week - from_date.weekday()
        if days_ahead <= 0:
            days_ahead += 7 * recurring_job.interval
        return from_date + timedelta(days=days_ahead)
    elif recurring_job.frequency == "monthly":
        # Simple monthly calculation
        next_month = from_date.month + recurring_job.interval
        next_year = from_date.year
        while next_month > 12:
            next_month -= 12
            next_year += 1
        try:
            return datetime(next_year, next_month, recurring_job.day_of_month or from_date.day)
        except ValueError:
            # Handle invalid dates (e.g., Feb 30)
            return datetime(next_year, next_month, 28)
    elif recurring_job.frequency == "yearly":
        return from_date.replace(year=from_date.year + recurring_job.interval)
    return from_date


@router.get("")
def list_recurring_jobs(
    active_only: bool = True,
    customer_id: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List recurring jobs"""
    query = db.query(RecurringJob)
    
    if active_only:
        query = query.filter(RecurringJob.is_active == True)
    
    if customer_id:
        query = query.filter(RecurringJob.customer_id == customer_id)
    
    query = query.order_by(RecurringJob.created_at.desc())
    recurring_jobs = query.offset(skip).limit(limit).all()
    
    return recurring_jobs


@router.post("", status_code=status.HTTP_201_CREATED)
def create_recurring_job(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new recurring job"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create recurring jobs"
        )
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == data["customer_id"]).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    recurring_job = RecurringJob(
        customer_id=data["customer_id"],
        title=data["title"],
        description=data.get("description"),
        job_type=data.get("job_type"),
        frequency=data["frequency"],
        interval=data.get("interval", 1),
        day_of_week=data.get("day_of_week"),
        day_of_month=data.get("day_of_month"),
        start_date=datetime.fromisoformat(data["start_date"]),
        end_date=datetime.fromisoformat(data["end_date"]) if data.get("end_date") else None,
        estimated_duration=data.get("estimated_duration"),
        priority=data.get("priority", "normal"),
        assigned_to=data.get("assigned_to"),
        created_by=current_user.id
    )
    
    db.add(recurring_job)
    db.commit()
    db.refresh(recurring_job)
    
    return recurring_job


@router.post("/{recurring_job_id}/generate")
def generate_jobs_from_recurring(
    recurring_job_id: str,
    days_ahead: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate jobs from recurring job template for next X days"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can generate jobs"
        )
    
    recurring_job = db.query(RecurringJob).filter(RecurringJob.id == recurring_job_id).first()
    if not recurring_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring job not found"
        )
    
    if not recurring_job.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recurring job is not active"
        )
    
    # Calculate dates to generate
    start_from = recurring_job.last_generated or recurring_job.start_date
    end_at = datetime.now() + timedelta(days=days_ahead)
    
    if recurring_job.end_date and end_at > recurring_job.end_date:
        end_at = recurring_job.end_date
    
    generated_jobs = []
    current_date = start_from
    
    while current_date <= end_at:
        # Check if job already exists for this date
        existing = db.query(Job).filter(
            Job.customer_id == recurring_job.customer_id,
            Job.scheduled_date == current_date.date(),
            Job.title == recurring_job.title
        ).first()
        
        if not existing:
            job_number = generate_job_number(db)
            new_job = Job(
                job_number=job_number,
                customer_id=recurring_job.customer_id,
                title=recurring_job.title,
                description=recurring_job.description,
                job_type=recurring_job.job_type,
                scheduled_date=current_date.date(),
                estimated_duration=recurring_job.estimated_duration,
                priority=recurring_job.priority,
                assigned_to=recurring_job.assigned_to,
                created_by=current_user.id
            )
            db.add(new_job)
            generated_jobs.append(new_job)
        
        current_date = calculate_next_occurrence(recurring_job, current_date)
    
    # Update last generated
    recurring_job.last_generated = datetime.now()
    db.commit()
    
    return {
        "generated_count": len(generated_jobs),
        "jobs": [{"id": j.id, "job_number": j.job_number, "scheduled_date": j.scheduled_date} for j in generated_jobs]
    }


@router.delete("/{recurring_job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_job(
    recurring_job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete or deactivate a recurring job"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can delete recurring jobs"
        )
    
    recurring_job = db.query(RecurringJob).filter(RecurringJob.id == recurring_job_id).first()
    if not recurring_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring job not found"
        )
    
    # Soft delete by deactivating
    recurring_job.is_active = False
    db.commit()
    
    return None

