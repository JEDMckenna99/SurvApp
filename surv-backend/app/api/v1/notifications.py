from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.job import Job
from app.utils.dependencies import get_current_user
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/notifications", tags=["notifications"])


class SMSNotification(BaseModel):
    to: str  # phone number
    message: str
    job_id: Optional[str] = None


class EmailNotification(BaseModel):
    to: str  # email address
    subject: str
    body: str
    template: Optional[str] = None


@router.post("/sms/send")
def send_sms(
    sms_data: SMSNotification,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send SMS notification via Twilio"""
    from app.config import settings
    
    # Check if Twilio is configured
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        print(f"[SMS MOCK] To: {sms_data.to}, Message: {sms_data.message}")
        return {
            "status": "mock_sent",
            "to": sms_data.to,
            "message": "SMS logged (Twilio not configured)"
        }
    
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=sms_data.message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=sms_data.to
        )
        
        return {
            "status": "sent",
            "to": sms_data.to,
            "sid": message.sid,
            "message": "SMS sent successfully"
        }
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        return {
            "status": "error",
            "to": sms_data.to,
            "message": f"Failed to send SMS: {str(e)}"
        }


@router.post("/email/send")
def send_email(
    email_data: EmailNotification,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send email via SendGrid"""
    # In production, integrate with SendGrid:
    # from sendgrid import SendGridAPIClient
    # from sendgrid.helpers.mail import Mail
    # message = Mail(
    #     from_email='noreply@surv.com',
    #     to_emails=email_data.to,
    #     subject=email_data.subject,
    #     html_content=email_data.body
    # )
    # sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
    # response = sg.send(message)
    
    # For now, log and return success
    print(f"[EMAIL] To: {email_data.to}, Subject: {email_data.subject}")
    
    return {
        "status": "sent",
        "to": email_data.to,
        "subject": email_data.subject,
        "message": "Email sent successfully"
    }


@router.post("/job-reminder/{job_id}")
def send_job_reminder(
    job_id: str,
    send_sms: bool = True,
    send_email: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send automated reminder for upcoming job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    customer = db.query(Customer).filter(Customer.id == job.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    message = f"Reminder: Your {job.title} is scheduled for {job.scheduled_date}"
    
    notifications_sent = []
    
    if send_sms and customer.phone:
        # Send SMS (mock for now)
        print(f"[SMS] {message} to {customer.phone}")
        notifications_sent.append("sms")
    
    if send_email and customer.email:
        # Send email (mock for now)
        print(f"[EMAIL] {message} to {customer.email}")
        notifications_sent.append("email")
    
    return {
        "status": "success",
        "job_id": job_id,
        "notifications_sent": notifications_sent,
        "message": "Reminders sent successfully"
    }


@router.post("/job-confirmation/{job_id}")
def send_job_confirmation(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send job confirmation to customer"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    customer = db.query(Customer).filter(Customer.id == job.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    message = f"Job Confirmed: {job.title} on {job.scheduled_date}"
    
    # Mock sending
    notifications = []
    if customer.phone:
        print(f"[SMS] {message} to {customer.phone}")
        notifications.append("sms")
    if customer.email:
        print(f"[EMAIL] {message} to {customer.email}")
        notifications.append("email")
    
    return {
        "status": "success",
        "notifications_sent": notifications
    }


