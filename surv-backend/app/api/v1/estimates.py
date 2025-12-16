from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import datetime
from app.database import get_db
from app.models.estimate import Estimate, EstimateLineItem
from app.models.customer import Customer
from app.models.job import Job
from app.models.user import User, UserRole
from app.schemas.estimate import EstimateCreate, EstimateUpdate, EstimateResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/estimates", tags=["estimates"])


def generate_estimate_number(db: Session) -> str:
    """Generate a unique estimate number"""
    count = db.query(Estimate).count()
    return f"EST-{count + 1:05d}"


def calculate_estimate_totals(estimate: Estimate):
    """Calculate estimate totals from line items"""
    subtotal = sum(item.total_price for item in estimate.line_items)
    tax_amount = subtotal * estimate.tax_rate
    total_amount = subtotal + tax_amount - estimate.discount_amount
    
    estimate.subtotal = subtotal
    estimate.tax_amount = tax_amount
    estimate.total_amount = total_amount


@router.get("", response_model=List[EstimateResponse])
def list_estimates(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    customer_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List estimates with optional filters"""
    query = db.query(Estimate)
    
    if status_filter:
        query = query.filter(Estimate.status == status_filter)
    
    if customer_id:
        query = query.filter(Estimate.customer_id == customer_id)
    
    query = query.order_by(Estimate.created_at.desc())
    estimates = query.offset(skip).limit(limit).all()
    
    return [EstimateResponse.model_validate(est) for est in estimates]


@router.post("", response_model=EstimateResponse, status_code=status.HTTP_201_CREATED)
def create_estimate(
    estimate_data: EstimateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new estimate"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create estimates"
        )
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == estimate_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Generate estimate number
    estimate_number = generate_estimate_number(db)
    
    # Create estimate
    db_estimate = Estimate(
        estimate_number=estimate_number,
        customer_id=estimate_data.customer_id,
        title=estimate_data.title,
        description=estimate_data.description,
        terms=estimate_data.terms,
        notes=estimate_data.notes,
        tax_rate=estimate_data.tax_rate,
        discount_amount=estimate_data.discount_amount,
        created_by=current_user.id
    )
    
    # Add line items
    for idx, item_data in enumerate(estimate_data.line_items):
        total_price = item_data.quantity * item_data.unit_price
        line_item = EstimateLineItem(
            item_name=item_data.item_name,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
            sort_order=idx
        )
        db_estimate.line_items.append(line_item)
    
    # Calculate totals
    calculate_estimate_totals(db_estimate)
    
    db.add(db_estimate)
    db.commit()
    db.refresh(db_estimate)
    
    return EstimateResponse.model_validate(db_estimate)


@router.get("/{estimate_id}", response_model=EstimateResponse)
def get_estimate(
    estimate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get estimate by ID"""
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    
    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found"
        )
    
    return EstimateResponse.model_validate(estimate)


@router.put("/{estimate_id}", response_model=EstimateResponse)
def update_estimate(
    estimate_id: str,
    estimate_data: EstimateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update estimate information"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can update estimates"
        )
    
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    
    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found"
        )
    
    # Update only provided fields
    update_data = estimate_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(estimate, field, value)
    
    # Recalculate totals if tax_rate or discount changed
    if 'tax_rate' in update_data or 'discount_amount' in update_data:
        calculate_estimate_totals(estimate)
    
    db.commit()
    db.refresh(estimate)
    
    return EstimateResponse.model_validate(estimate)


@router.post("/{estimate_id}/approve", response_model=EstimateResponse)
def approve_estimate(
    estimate_id: str,
    create_job: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Approve an estimate and optionally convert to job"""
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    
    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found"
        )
    
    estimate.status = "approved"
    estimate.approved_at = datetime.utcnow()
    
    # Create job if requested
    if create_job and current_user.role in [UserRole.admin, UserRole.manager]:
        from app.api.v1.jobs import generate_job_number
        from datetime import date, timedelta
        
        job_number = generate_job_number(db)
        new_job = Job(
            job_number=job_number,
            customer_id=estimate.customer_id,
            title=estimate.title,
            description=estimate.description,
            scheduled_date=date.today() + timedelta(days=7),  # Schedule for next week
            created_by=current_user.id
        )
        db.add(new_job)
        db.flush()
        
        estimate.converted_to_job_id = new_job.id
    
    db.commit()
    db.refresh(estimate)
    
    return EstimateResponse.model_validate(estimate)


@router.delete("/{estimate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estimate(
    estimate_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an estimate"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can delete estimates"
        )
    
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    
    if not estimate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estimate not found"
        )
    
    db.delete(estimate)
    db.commit()
    
    return None

