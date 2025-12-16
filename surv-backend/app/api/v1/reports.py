from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, date
from decimal import Decimal
from app.database import get_db
from app.models.customer import Customer
from app.models.job import Job
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics"""
    
    # Total customers
    total_customers = db.query(Customer).filter(Customer.status == "active").count()
    
    # Jobs statistics
    total_jobs = db.query(Job).count()
    active_jobs = db.query(Job).filter(Job.status.in_(["scheduled", "in_progress"])).count()
    completed_jobs = db.query(Job).filter(Job.status == "completed").count()
    
    # Today's jobs
    today = date.today()
    todays_jobs = db.query(Job).filter(Job.scheduled_date == today).count()
    
    # Invoice statistics
    total_invoices = db.query(Invoice).count()
    paid_invoices = db.query(Invoice).filter(Invoice.status == "paid").count()
    
    # Revenue calculation
    total_revenue = db.query(func.sum(Invoice.amount_paid)).scalar() or Decimal(0)
    outstanding_revenue = db.query(func.sum(Invoice.amount_due)).filter(
        Invoice.status != "paid"
    ).scalar() or Decimal(0)
    
    # This month's revenue
    current_month = datetime.now().month
    current_year = datetime.now().year
    month_revenue = db.query(func.sum(Invoice.amount_paid)).filter(
        extract('month', Invoice.created_at) == current_month,
        extract('year', Invoice.created_at) == current_year
    ).scalar() or Decimal(0)
    
    return {
        "customers": {
            "total": total_customers,
            "active": total_customers
        },
        "jobs": {
            "total": total_jobs,
            "active": active_jobs,
            "completed": completed_jobs,
            "today": todays_jobs
        },
        "invoices": {
            "total": total_invoices,
            "paid": paid_invoices,
            "unpaid": total_invoices - paid_invoices
        },
        "revenue": {
            "total": float(total_revenue),
            "outstanding": float(outstanding_revenue),
            "this_month": float(month_revenue)
        }
    }


@router.get("/revenue")
def get_revenue_report(
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get revenue report for date range"""
    
    if not date_from:
        date_from = date.today() - timedelta(days=30)
    if not date_to:
        date_to = date.today()
    
    # Daily revenue
    daily_revenue = db.query(
        func.date(Invoice.created_at).label('date'),
        func.sum(Invoice.total_amount).label('total'),
        func.sum(Invoice.amount_paid).label('paid'),
        func.count(Invoice.id).label('count')
    ).filter(
        Invoice.created_at >= datetime.combine(date_from, datetime.min.time()),
        Invoice.created_at <= datetime.combine(date_to, datetime.max.time())
    ).group_by(func.date(Invoice.created_at)).all()
    
    return {
        "date_from": date_from,
        "date_to": date_to,
        "daily_revenue": [
            {
                "date": str(row.date),
                "total": float(row.total or 0),
                "paid": float(row.paid or 0),
                "invoice_count": row.count
            }
            for row in daily_revenue
        ]
    }


@router.get("/technicians")
def get_technician_performance(
    date_from: date = None,
    date_to: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get technician performance metrics"""
    
    if not date_from:
        date_from = date.today() - timedelta(days=30)
    if not date_to:
        date_to = date.today()
    
    # Jobs by technician
    technician_stats = db.query(
        User.id,
        User.first_name,
        User.last_name,
        func.count(Job.id).label('total_jobs'),
        func.sum(case((Job.status == 'completed', 1), else_=0)).label('completed_jobs')
    ).join(Job, Job.assigned_to == User.id).filter(
        User.role == UserRole.technician,
        Job.scheduled_date >= date_from,
        Job.scheduled_date <= date_to
    ).group_by(User.id, User.first_name, User.last_name).all()
    
    return {
        "date_from": date_from,
        "date_to": date_to,
        "technicians": [
            {
                "id": tech.id,
                "name": f"{tech.first_name} {tech.last_name}",
                "total_jobs": tech.total_jobs,
                "completed_jobs": tech.completed_jobs or 0,
                "completion_rate": round((tech.completed_jobs or 0) / tech.total_jobs * 100, 1) if tech.total_jobs > 0 else 0
            }
            for tech in technician_stats
        ]
    }


@router.get("/jobs-by-status")
def get_jobs_by_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get job count by status"""
    
    status_counts = db.query(
        Job.status,
        func.count(Job.id).label('count')
    ).group_by(Job.status).all()
    
    return {
        "by_status": [
            {
                "status": row.status,
                "count": row.count
            }
            for row in status_counts
        ]
    }


# Import case for SQLite compatibility
from sqlalchemy import case

