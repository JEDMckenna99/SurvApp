# SurvApp - Field Service Management Platform

A complete field service management platform with SMS-based technician workflow, similar to HouseCall Pro.

## Features

- Customer Relationship Management (CRM)
- Job Scheduling & Management
- Calendar View
- Estimates & Quotes
- Invoicing & Billing
- Payment Processing (Stripe integration)
- SMS-based Technician Workflow (Twilio)
- Email Marketing Campaigns (SendGrid)
- Online Booking Widget
- Photo Uploads
- Digital Signatures
- Time Tracking
- Business Reports & Analytics
- Role-based Access Control

## Tech Stack

**Backend:**
- Python 3.11
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

**Frontend:**
- React 18
- TypeScript
- Material-UI
- Redux Toolkit
- Vite

## Setup

### Environment Variables Required

Set these in your deployment environment (Heroku, etc.):

```bash
# Required
DATABASE_URL=postgresql://...
SECRET_KEY=your-secret-key-here

# Optional - For SMS features
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx

# Optional - For payments
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_PUBLIC_KEY=pk_xxxxx

# Optional - For email
SENDGRID_API_KEY=SG.xxxxx
```

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize database:
```bash
python init_db.py
```

3. Run server:
```bash
uvicorn app.main:app --reload
```

### Deployment to Heroku

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
git push heroku master
heroku run python init_db.py
```

## Documentation

See project documentation files for detailed setup and usage instructions.

## License

Proprietary - All Rights Reserved

