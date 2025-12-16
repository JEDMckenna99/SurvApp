from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.job import Job
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.job import JobCreate, JobUpdate, JobResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])


def generate_job_number(db: Session) -> str:
    """Generate a unique job number"""
    count = db.query(Job).count()
    return f"JOB-{count + 1:05d}"


@router.get("", response_model=List[JobResponse])
def list_jobs(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List jobs with optional filters"""
    query = db.query(Job)
    
    # Technicians can only see their assigned jobs
    if current_user.role == UserRole.technician:
        query = query.filter(Job.assigned_to == current_user.id)
    elif assigned_to:
        query = query.filter(Job.assigned_to == assigned_to)
    
    if status_filter:
        query = query.filter(Job.status == status_filter)
    
    if date_from:
        query = query.filter(Job.scheduled_date >= date_from)
    
    if date_to:
        query = query.filter(Job.scheduled_date <= date_to)
    
    query = query.order_by(Job.scheduled_date.desc())
    jobs = query.offset(skip).limit(limit).all()
    
    return [JobResponse.model_validate(j) for j in jobs]


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create jobs"
        )
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == job_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Generate job number
    job_number = generate_job_number(db)
    
    db_job = Job(
        **job_data.model_dump(),
        job_number=job_number,
        created_by=current_user.id
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    
    return JobResponse.model_validate(db_job)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job by ID"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Technicians can only see their assigned jobs
    if current_user.role == UserRole.technician and job.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your assigned jobs"
        )
    
    return JobResponse.model_validate(job)


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: str,
    job_data: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update job information"""
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Technicians can only update their assigned jobs (limited fields)
    if current_user.role == UserRole.technician:
        if job.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your assigned jobs"
            )
        # Technicians can only update status and notes
        allowed_updates = {"status", "description"}
        update_data = job_data.model_dump(exclude_unset=True)
        if not all(key in allowed_updates for key in update_data.keys()):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Technicians can only update job status and notes"
            )
    
    # Update only provided fields
    update_data = job_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    
    return JobResponse.model_validate(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel a job"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can cancel jobs"
        )
    
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Set status to cancelled instead of deleting
    job.status = "cancelled"
    db.commit()
    
    return None

