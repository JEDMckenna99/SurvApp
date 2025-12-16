from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.database import get_db
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.user import User, UserRole
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])


def generate_invoice_number(db: Session) -> str:
    """Generate a unique invoice number"""
    count = db.query(Invoice).count()
    return f"INV-{count + 1:05d}"


def calculate_invoice_totals(invoice: Invoice):
    """Calculate invoice totals"""
    tax_amount = invoice.subtotal * invoice.tax_rate
    total_amount = invoice.subtotal + tax_amount - invoice.discount_amount
    amount_due = total_amount - invoice.amount_paid
    
    invoice.tax_amount = tax_amount
    invoice.total_amount = total_amount
    invoice.amount_due = amount_due


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,
    customer_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List invoices with optional filters"""
    query = db.query(Invoice)
    
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    
    query = query.order_by(Invoice.created_at.desc())
    invoices = query.offset(skip).limit(limit).all()
    
    return [InvoiceResponse.model_validate(inv) for inv in invoices]


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create invoices"
        )
    
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == invoice_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Generate invoice number
    invoice_number = generate_invoice_number(db)
    
    db_invoice = Invoice(
        **invoice_data.model_dump(),
        invoice_number=invoice_number,
        created_by=current_user.id
    )
    
    # Calculate totals
    calculate_invoice_totals(db_invoice)
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    return InvoiceResponse.model_validate(db_invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get invoice by ID"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return InvoiceResponse.model_validate(invoice)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update invoice information"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can update invoices"
        )
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update only provided fields
    update_data = invoice_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(invoice, field, value)
    
    # Recalculate totals
    calculate_invoice_totals(invoice)
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/send", response_model=InvoiceResponse)
def send_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark invoice as sent"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can send invoices"
        )
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    from datetime import datetime
    invoice.status = "sent"
    invoice.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.model_validate(invoice)


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
def mark_invoice_paid(
    invoice_id: str,
    amount: Decimal,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a payment on an invoice"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can record payments"
        )
    
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    from datetime import datetime
    invoice.amount_paid += amount
    invoice.amount_due = invoice.total_amount - invoice.amount_paid
    
    if invoice.amount_due <= 0:
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow()
    elif invoice.amount_paid > 0:
        invoice.status = "partial"
    
    db.commit()
    db.refresh(invoice)
    
    return InvoiceResponse.model_validate(invoice)

