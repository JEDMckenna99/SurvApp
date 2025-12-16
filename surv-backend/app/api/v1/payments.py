from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from app.database import get_db
from app.models.invoice import Invoice
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["payments"])


class PaymentIntentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_method: str = "card"  # card, ach, cash, check


class PaymentIntentResponse(BaseModel):
    client_secret: str
    amount: float
    currency: str
    invoice_id: str


class PaymentConfirm(BaseModel):
    payment_intent_id: str
    invoice_id: str


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
def create_payment_intent(
    payment_data: PaymentIntentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe payment intent for an invoice"""
    # Get invoice
    invoice = db.query(Invoice).filter(Invoice.id == payment_data.invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # In production, integrate with Stripe:
    # import stripe
    # stripe.api_key = settings.STRIPE_SECRET_KEY
    # intent = stripe.PaymentIntent.create(
    #     amount=int(payment_data.amount * 100),  # Convert to cents
    #     currency="usd",
    #     metadata={"invoice_id": payment_data.invoice_id}
    # )
    
    # For now, return a mock response
    return PaymentIntentResponse(
        client_secret=f"pi_mock_{invoice.id}",
        amount=payment_data.amount,
        currency="usd",
        invoice_id=payment_data.invoice_id
    )


@router.post("/confirm-payment")
def confirm_payment(
    payment_confirm: PaymentConfirm,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm payment and update invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == payment_confirm.invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # In production, verify with Stripe:
    # import stripe
    # intent = stripe.PaymentIntent.retrieve(payment_confirm.payment_intent_id)
    # if intent.status == "succeeded":
    
    # For now, mark as paid
    invoice.amount_paid = invoice.total_amount
    invoice.amount_due = Decimal('0.00')
    invoice.status = "paid"
    
    db.commit()
    db.refresh(invoice)
    
    return {
        "status": "success",
        "message": "Payment confirmed",
        "invoice_id": invoice.id,
        "amount_paid": float(invoice.amount_paid)
    }


@router.post("/record-payment")
def record_manual_payment(
    invoice_id: str,
    amount: float,
    payment_method: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a manual payment (cash, check, etc.)"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update payment amounts
    current_paid = float(invoice.amount_paid) if invoice.amount_paid else 0
    new_paid = current_paid + amount
    invoice.amount_paid = Decimal(str(new_paid))
    invoice.amount_due = invoice.total_amount - invoice.amount_paid
    
    # Update status
    if invoice.amount_due <= 0:
        invoice.status = "paid"
    elif invoice.amount_paid > 0:
        invoice.status = "partial"
    
    db.commit()
    db.refresh(invoice)
    
    return {
        "status": "success",
        "message": f"Payment of ${amount} recorded",
        "invoice_id": invoice.id,
        "total_paid": float(invoice.amount_paid),
        "amount_due": float(invoice.amount_due)
    }

