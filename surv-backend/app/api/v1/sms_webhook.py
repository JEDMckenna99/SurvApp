from fastapi import APIRouter, Request, HTTPException, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import SessionLocal
from app.models.sms_message import SMSMessage
from app.models.job import Job
from app.models.job_timeline import JobTimeline
from app.models.user import User
from app.models.customer import Customer
import re

router = APIRouter(prefix="/sms", tags=["sms-webhook"])


def parse_command(message_body: str):
    """Parse SMS command from message body"""
    body = message_body.lower().strip()
    
    # Clock in
    if body.startswith("clock in") or body == "in":
        return {"command": "clock_in"}
    
    # Clock out
    if body.startswith("clock out") or body == "out":
        return {"command": "clock_out"}
    
    # On my way to job
    match = re.search(r"(on my way|omw|heading|enroute)\s*(job)?[:\s#]*(\d+|job-\d+)", body, re.IGNORECASE)
    if match:
        job_num = match.group(3)
        return {"command": "on_my_way", "job_number": job_num}
    
    # Start job
    match = re.search(r"(start|begin|starting)\s*(job)?[:\s#]*(\d+|job-\d+)", body, re.IGNORECASE)
    if match:
        job_num = match.group(3)
        return {"command": "start_job", "job_number": job_num}
    
    # Finish/complete job
    match = re.search(r"(done|finish|complete|finished|completed)\s*(job)?[:\s#]*(\d+|job-\d+)", body, re.IGNORECASE)
    if match:
        job_num = match.group(3)
        return {"command": "finish_job", "job_number": job_num}
    
    # Job summary
    match = re.search(r"summary[:\s#]*(\d+|job-\d+)[:\s]*(.*)", body, re.IGNORECASE)
    if match:
        job_num = match.group(1)
        summary = match.group(2)
        return {"command": "job_summary", "job_number": job_num, "summary": summary}
    
    # List my jobs
    if "my jobs" in body or body == "jobs" or "list jobs" in body:
        return {"command": "list_jobs"}
    
    # Help
    if body == "help" or body == "?":
        return {"command": "help"}
    
    return {"command": "unknown"}


def send_sms_response(to_number: str, message: str):
    """Send SMS response via Twilio"""
    from app.config import settings
    
    # Check if Twilio is configured
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        print(f"[SMS MOCK] To: {to_number}, Message: {message}")
        return {"status": "mock_sent"}
    
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_number
        )
        print(f"[SMS SENT] To: {to_number}, SID: {msg.sid}")
        return {"status": "sent", "sid": msg.sid}
    except Exception as e:
        print(f"[SMS ERROR] {e}")
        return {"status": "error", "message": str(e)}


@router.post("/webhook")
async def handle_sms_webhook(
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(...),
    MessageSid: str = Form(...),
    NumMedia: Optional[str] = Form("0"),
    MediaUrl0: Optional[str] = Form(None),
    MediaContentType0: Optional[str] = Form(None)
):
    """
    Twilio webhook endpoint to receive SMS commands from technicians
    This endpoint is called by Twilio when a technician sends a text
    """
    db = SessionLocal()
    
    try:
        # Find technician by phone number
        tech = db.query(User).filter(User.phone == From).first()
        if not tech:
            send_sms_response(From, "Phone number not registered. Please contact your administrator.")
            return {"status": "unknown_user"}
        
        # Parse command
        cmd = parse_command(Body)
        
        # Log the SMS message
        sms_log = SMSMessage(
            message_sid=MessageSid,
            from_number=From,
            to_number=To,
            body=Body,
            direction="inbound",
            status="received",
            employee_id=tech.id,
            command_type=cmd.get("command"),
            media_url=MediaUrl0,
            media_type=MediaContentType0,
            received_at=datetime.utcnow()
        )
        
        # Process command
        if cmd["command"] == "clock_in":
            from app.models.time_entry import TimeEntry
            entry = TimeEntry(
                employee_id=tech.id,
                entry_type="clock_in",
                entry_time=datetime.utcnow()
            )
            db.add(entry)
            send_sms_response(From, f"✓ Clocked in at {datetime.now().strftime('%I:%M %p')}")
            sms_log.command_processed = True
        
        elif cmd["command"] == "clock_out":
            from app.models.time_entry import TimeEntry
            entry = TimeEntry(
                employee_id=tech.id,
                entry_type="clock_out",
                entry_time=datetime.utcnow()
            )
            db.add(entry)
            send_sms_response(From, f"✓ Clocked out at {datetime.now().strftime('%I:%M %p')}")
            sms_log.command_processed = True
        
        elif cmd["command"] == "on_my_way":
            job_num = cmd.get("job_number")
            job = db.query(Job).filter(Job.job_number.ilike(f"%{job_num}%")).first()
            
            if not job:
                send_sms_response(From, f"Job #{job_num} not found. Text 'jobs' to see your jobs.")
            else:
                # Log timeline event
                timeline = JobTimeline(
                    job_id=job.id,
                    event_type="on_my_way",
                    event_time=datetime.utcnow(),
                    employee_id=tech.id
                )
                db.add(timeline)
                
                # Send message to customer
                customer = db.query(Customer).filter(Customer.id == job.customer_id).first()
                if customer and customer.phone:
                    customer_msg = f"Good news! Your technician {tech.first_name} is on the way for your {job.title} appointment."
                    send_sms_response(customer.phone, customer_msg)
                    
                    # Log customer notification
                    customer_sms = SMSMessage(
                        from_number=To,
                        to_number=customer.phone,
                        body=customer_msg,
                        direction="outbound",
                        status="sent",
                        job_id=job.id,
                        customer_id=customer.id,
                        sent_at=datetime.utcnow()
                    )
                    db.add(customer_sms)
                
                send_sms_response(From, f"✓ Customer notified for Job #{job.job_number}. Travel timer started.")
                sms_log.job_id = job.id
                sms_log.command_processed = True
        
        elif cmd["command"] == "start_job":
            job_num = cmd.get("job_number")
            job = db.query(Job).filter(Job.job_number.ilike(f"%{job_num}%")).first()
            
            if not job:
                send_sms_response(From, f"Job #{job_num} not found.")
            else:
                # Calculate travel time
                on_my_way_event = db.query(JobTimeline).filter(
                    JobTimeline.job_id == job.id,
                    JobTimeline.event_type == "on_my_way"
                ).order_by(JobTimeline.event_time.desc()).first()
                
                travel_time = None
                if on_my_way_event:
                    travel_time = int((datetime.utcnow() - on_my_way_event.event_time).total_seconds())
                
                # Log timeline event
                timeline = JobTimeline(
                    job_id=job.id,
                    event_type="started",
                    event_time=datetime.utcnow(),
                    employee_id=tech.id,
                    travel_time=travel_time
                )
                db.add(timeline)
                
                # Update job status
                job.status = "in_progress"
                job.actual_start_time = datetime.utcnow()
                
                travel_msg = f" (Travel time: {travel_time // 60} min)" if travel_time else ""
                send_sms_response(From, f"✓ Started Job #{job.job_number}{travel_msg}. Job timer running.")
                sms_log.job_id = job.id
                sms_log.command_processed = True
        
        elif cmd["command"] == "finish_job":
            job_num = cmd.get("job_number")
            job = db.query(Job).filter(Job.job_number.ilike(f"%{job_num}%")).first()
            
            if not job:
                send_sms_response(From, f"Job #{job_num} not found.")
            else:
                # Calculate job duration
                start_event = db.query(JobTimeline).filter(
                    JobTimeline.job_id == job.id,
                    JobTimeline.event_type == "started"
                ).order_by(JobTimeline.event_time.desc()).first()
                
                job_duration = None
                if start_event:
                    job_duration = int((datetime.utcnow() - start_event.event_time).total_seconds())
                
                # Log timeline event
                timeline = JobTimeline(
                    job_id=job.id,
                    event_type="completed",
                    event_time=datetime.utcnow(),
                    employee_id=tech.id,
                    job_duration=job_duration
                )
                db.add(timeline)
                
                # Update job status
                job.status = "completed"
                job.actual_end_time = datetime.utcnow()
                
                duration_msg = f" (Duration: {job_duration // 60} min)" if job_duration else ""
                send_sms_response(From, f"✓ Completed Job #{job.job_number}{duration_msg}. Great work!")
                sms_log.job_id = job.id
                sms_log.command_processed = True
        
        elif cmd["command"] == "job_summary":
            job_num = cmd.get("job_number")
            summary = cmd.get("summary", "")
            job = db.query(Job).filter(Job.job_number.ilike(f"%{job_num}%")).first()
            
            if not job:
                send_sms_response(From, f"Job #{job_num} not found.")
            else:
                from app.models.job_note import JobNote
                note = JobNote(
                    job_id=job.id,
                    note_text=f"TECHNICIAN SUMMARY: {summary}",
                    note_type="completion_summary",
                    is_internal=False,
                    created_by=tech.id
                )
                db.add(note)
                send_sms_response(From, f"✓ Summary added to Job #{job.job_number}")
                sms_log.job_id = job.id
                sms_log.command_processed = True
        
        elif cmd["command"] == "list_jobs":
            # Get today's jobs for technician
            from datetime import date
            today = date.today()
            jobs = db.query(Job).filter(
                Job.assigned_to == tech.id,
                Job.scheduled_date == today,
                Job.status.in_(["scheduled", "in_progress"])
            ).all()
            
            if not jobs:
                send_sms_response(From, "No jobs scheduled for today.")
            else:
                job_list = "Your jobs today:\n"
                for job in jobs:
                    job_list += f"• #{job.job_number}: {job.title} at {job.scheduled_start_time.strftime('%I:%M %p') if job.scheduled_start_time else 'TBD'}\n"
                send_sms_response(From, job_list)
            sms_log.command_processed = True
        
        elif cmd["command"] == "help":
            help_text = """SMS Commands:
• clock in - Start your day
• clock out - End your day
• omw #123 - On my way (notifies customer)
• start #123 - Start job timer
• done #123 - Complete job
• summary #123: [text] - Add job notes
• jobs - List today's jobs
• help - Show this message"""
            send_sms_response(From, help_text)
            sms_log.command_processed = True
        
        else:
            send_sms_response(From, "Command not recognized. Text 'help' for commands.")
        
        # Handle photo uploads (MMS)
        if NumMedia and int(NumMedia) > 0 and MediaUrl0:
            # Find most recent job or extract job number from message
            job_match = re.search(r"#?(\d+|job-\d+)", Body, re.IGNORECASE)
            if job_match:
                job_num = job_match.group(1)
                job = db.query(Job).filter(Job.job_number.ilike(f"%{job_num}%")).first()
                
                if job:
                    from app.models.file_upload import FileUpload
                    # Save photo reference
                    photo = FileUpload(
                        filename=f"mms_{MessageSid}.jpg",
                        original_filename=f"Photo from {tech.first_name}",
                        file_path=MediaUrl0,
                        file_type=MediaContentType0 or "image/jpeg",
                        entity_type="job",
                        entity_id=job.id,
                        category="after_photo" if "after" in Body.lower() else "before_photo",
                        uploaded_by=tech.id
                    )
                    db.add(photo)
                    send_sms_response(From, f"✓ Photo saved to Job #{job.job_number}")
        
        db.add(sms_log)
        db.commit()
        
        # Return TwiML response
        return """<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>"""
        
    except Exception as e:
        print(f"Error processing SMS: {e}")
        db.rollback()
        send_sms_response(From, "Error processing your request. Please try again or contact support.")
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@router.get("/messages/{job_id}")
def get_job_messages(job_id: str):
    """Get all SMS messages for a job"""
    db = SessionLocal()
    try:
        messages = db.query(SMSMessage).filter(SMSMessage.job_id == job_id).order_by(SMSMessage.received_at.desc()).all()
        return [{
            "id": msg.id,
            "from_number": msg.from_number,
            "to_number": msg.to_number,
            "body": msg.body,
            "direction": msg.direction,
            "command_type": msg.command_type,
            "received_at": msg.received_at,
            "sent_at": msg.sent_at,
            "has_media": bool(msg.media_url)
        } for msg in messages]
    finally:
        db.close()


@router.get("/timeline/{job_id}")
def get_job_timeline(job_id: str):
    """Get timeline/activity log for a job"""
    db = SessionLocal()
    try:
        timeline = db.query(JobTimeline).filter(JobTimeline.job_id == job_id).order_by(JobTimeline.event_time).all()
        
        result = []
        for event in timeline:
            employee = db.query(User).filter(User.id == event.employee_id).first()
            result.append({
                "id": event.id,
                "event_type": event.event_type,
                "event_time": event.event_time,
                "employee_name": f"{employee.first_name} {employee.last_name}" if employee else "Unknown",
                "travel_time_minutes": event.travel_time // 60 if event.travel_time else None,
                "job_duration_minutes": event.job_duration // 60 if event.job_duration else None,
                "notes": event.notes
            })
        
        return result
    finally:
        db.close()

