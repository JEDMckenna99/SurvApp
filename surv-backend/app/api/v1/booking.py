from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, time, datetime
from app.database import get_db
from app.models.customer import Customer
from app.models.job import Job
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/booking", tags=["online-booking"])


class OnlineBookingRequest(BaseModel):
    # Customer info
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    
    # Job info
    service_type: str
    description: Optional[str] = None
    preferred_date: date
    preferred_time: Optional[str] = None
    priority: str = "normal"


class AvailabilitySlot(BaseModel):
    date: date
    time_slot: str
    available: bool


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_booking_request(
    booking: OnlineBookingRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for online booking widget
    No authentication required - this is for customer self-service
    """
    try:
        # Check if customer exists, create if not
        customer = db.query(Customer).filter(Customer.email == booking.email).first()
        
        if not customer:
            customer = Customer(
                first_name=booking.first_name,
                last_name=booking.last_name,
                email=booking.email,
                phone=booking.phone,
                address_line1=booking.address_line1,
                city=booking.city,
                state=booking.state,
                zip_code=booking.zip_code
            )
            db.add(customer)
            db.flush()  # Get customer ID
        
        # Generate job number
        job_count = db.query(Job).count()
        job_number = f"JOB-{job_count + 1:05d}"
        
        # Create job with "pending" status (requires admin approval)
        job = Job(
            job_number=job_number,
            customer_id=customer.id,
            title=booking.service_type,
            description=booking.description,
            job_type=booking.service_type,
            status="pending",  # Requires confirmation
            priority=booking.priority,
            scheduled_date=booking.preferred_date,
            scheduled_start_time=time.fromisoformat(booking.preferred_time) if booking.preferred_time else None
        )
        
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # In production, send confirmation email/SMS
        # send_booking_confirmation(customer.email, customer.phone, job)
        
        return {
            "status": "success",
            "message": "Booking request submitted successfully",
            "job_number": job.job_number,
            "customer_id": customer.id,
            "job_id": job.id,
            "confirmation": "You will receive a confirmation email shortly"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Booking failed: {str(e)}"
        )


@router.get("/availability")
def get_available_slots(
    service_type: str,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    """
    Get available time slots for online booking
    Public endpoint - no authentication required
    """
    # Get all jobs in date range
    jobs = db.query(Job).filter(
        Job.scheduled_date >= start_date,
        Job.scheduled_date <= end_date,
        Job.status.in_(["scheduled", "in_progress"])
    ).all()
    
    # Simple availability logic (can be enhanced)
    # For now, assume 8am-5pm with 2-hour slots
    time_slots = ["08:00", "10:00", "12:00", "14:00", "16:00"]
    
    available_slots = []
    current_date = start_date
    
    while current_date <= end_date:
        jobs_on_date = [j for j in jobs if j.scheduled_date == current_date]
        booked_times = [j.scheduled_start_time.strftime("%H:%M") if j.scheduled_start_time else None for j in jobs_on_date]
        
        for time_slot in time_slots:
            available_slots.append(AvailabilitySlot(
                date=current_date,
                time_slot=time_slot,
                available=time_slot not in booked_times
            ))
        
        current_date = date.fromordinal(current_date.toordinal() + 1)
    
    return available_slots


@router.get("/services")
def get_available_services():
    """
    Get list of services available for online booking
    Public endpoint - no authentication required
    """
    return {
        "services": [
            {"id": "plumbing", "name": "Plumbing", "description": "Repairs, installations, maintenance"},
            {"id": "hvac", "name": "HVAC", "description": "Heating and cooling services"},
            {"id": "electrical", "name": "Electrical", "description": "Wiring, repairs, installations"},
            {"id": "general", "name": "General Handyman", "description": "Various home repairs"},
            {"id": "emergency", "name": "Emergency Service", "description": "Urgent repairs"}
        ]
    }











