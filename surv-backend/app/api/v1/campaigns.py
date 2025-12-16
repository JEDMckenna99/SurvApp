from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.utils.dependencies import get_current_user
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/campaigns", tags=["marketing"])


class EmailCampaign(BaseModel):
    name: str
    subject: str
    body: str
    template: Optional[str] = None
    target_customers: List[str] = []  # Customer IDs, empty = all
    scheduled_at: Optional[datetime] = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    subject: str
    status: str
    recipients_count: int
    sent_count: int
    opened_count: int
    clicked_count: int
    created_at: datetime


@router.post("/email/create")
def create_email_campaign(
    campaign: EmailCampaign,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create an email marketing campaign"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and managers can create campaigns"
        )
    
    # Get target customers
    if campaign.target_customers:
        customers = db.query(Customer).filter(
            Customer.id.in_(campaign.target_customers)
        ).all()
    else:
        customers = db.query(Customer).filter(Customer.email.isnot(None)).all()
    
    # In production, integrate with SendGrid:
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail, Personalization
    # sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    # 
    # for customer in customers:
    #     message = Mail(
    #         from_email='noreply@surv.com',
    #         to_emails=customer.email,
    #         subject=campaign.subject,
    #         html_content=campaign.body
    #     )
    #     sg.send(message)
    
    # For now, return mock response
    return {
        "status": "created",
        "campaign_name": campaign.name,
        "recipients_count": len(customers),
        "scheduled_for": campaign.scheduled_at or "immediately",
        "message": f"Campaign created with {len(customers)} recipients"
    }


@router.get("/email/list")
def list_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all email campaigns"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mock campaigns (in production, would query campaigns table)
    return {
        "campaigns": [],
        "total": 0,
        "message": "Campaign history will appear here once campaigns are sent"
    }


@router.post("/templates/create")
def create_email_template(
    name: str,
    subject: str,
    body: str,
    category: str = "general",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create reusable email template"""
    if current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # In production, save to templates table
    templates = {
        "job_confirmation": {
            "subject": "Your Service Appointment is Confirmed",
            "body": "Dear {customer_name},\n\nYour {service_type} is scheduled for {date}."
        },
        "invoice_reminder": {
            "subject": "Invoice Due Reminder",
            "body": "Dear {customer_name},\n\nYour invoice #{invoice_number} is due on {due_date}."
        },
        "service_complete": {
            "subject": "Service Completed - Thank You!",
            "body": "Dear {customer_name},\n\nThank you for choosing Surv for your {service_type}."
        }
    }
    
    return {
        "status": "created",
        "name": name,
        "category": category,
        "message": "Template created successfully"
    }


@router.get("/templates/list")
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all email templates"""
    return {
        "templates": [
            {"name": "job_confirmation", "subject": "Job Confirmation", "category": "operations"},
            {"name": "invoice_reminder", "subject": "Invoice Reminder", "category": "billing"},
            {"name": "service_complete", "subject": "Service Complete", "category": "operations"},
            {"name": "review_request", "subject": "We'd Love Your Feedback", "category": "marketing"}
        ]
    }











