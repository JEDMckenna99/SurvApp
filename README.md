# SurvApp - Complete Field Service Management Platform

A full-featured field service management platform with native SMS workflow for technicians. Built as an alternative to HouseCall Pro with complete feature parity.

## Features

### Core Management
- ✅ Customer Relationship Management (CRM)
- ✅ Job Scheduling & Dispatch
- ✅ Interactive Calendar View
- ✅ Estimates & Quotes
- ✅ Invoicing & Billing
- ✅ Time Tracking
- ✅ Recurring Jobs
- ✅ Business Reports & Analytics

### Advanced Features
- ✅ **SMS-Based Technician Workflow** - Manage jobs via text messages
- ✅ **Payment Processing** - Stripe integration for credit cards, ACH
- ✅ **Email Marketing** - SendGrid campaigns and templates
- ✅ **Online Booking** - Customer self-service scheduling
- ✅ **Photo Uploads** - Before/after job documentation
- ✅ **Digital Signatures** - Customer signature capture
- ✅ **Automated Notifications** - Customer SMS when tech is on the way
- ✅ **Travel Time Tracking** - Automatic calculation
- ✅ **Job Timeline** - Complete audit trail

### Role-Based Interface
- **Admin/Manager:** Full 13-page management interface
- **Technician:** Simplified 2-page field worker UI

## Tech Stack

**Backend:**
- Python 3.11 + FastAPI
- SQLAlchemy ORM
- PostgreSQL
- JWT Authentication
- Twilio (SMS)
- Stripe (Payments)
- SendGrid (Email)

**Frontend:**
- React 18 + TypeScript
- Material-UI (MUI)
- Redux Toolkit
- Axios
- Vite

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd surv-backend
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd surv-frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` file in `surv-backend/`:

```env
DATABASE_URL=postgresql://user:pass@localhost/survdb
SECRET_KEY=your-secret-key-here
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxx
```

## Deployment

### Heroku Deployment

```bash
cd surv-backend
heroku create your-app-name
heroku addons:create heroku-postgresql:essential-0
heroku buildpacks:add --index 1 heroku/nodejs
heroku buildpacks:add --index 2 heroku/python

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxx
heroku config:set TWILIO_AUTH_TOKEN=xxxxx
heroku config:set TWILIO_PHONE_NUMBER=+1xxxxx

git push heroku master
heroku run python init_db.py
```

### Twilio Webhook Setup

Set webhook URL in Twilio Console:
```
https://your-app.herokuapp.com/api/v1/sms/webhook
```

## SMS Commands for Technicians

```
clock in          - Start work day
clock out         - End work day
omw #123          - Notify customer, start travel timer
start #123        - Start job timer
done #123         - Complete job, log duration
summary #123: ... - Add job notes
jobs              - List today's jobs
help              - Show commands
```

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
SurvApp/
├── surv-backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── utils/         # Utilities
│   ├── requirements.txt
│   └── Procfile
│
├── surv-frontend/         # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   └── store/         # Redux store
│   └── package.json
│
└── Documentation/         # Guides and docs
```

## Features Comparison

| Feature | HouseCall Pro | SurvApp |
|---------|---------------|---------|
| Customer CRM | ✓ | ✅ |
| Job Scheduling | ✓ | ✅ |
| SMS Workflow | ✓ | ✅ |
| Payment Processing | ✓ | ✅ |
| Email Campaigns | ✓ | ✅ |
| Online Booking | ✓ | ✅ |
| Photo Uploads | ✓ | ✅ |
| Digital Signatures | ✓ | ✅ |
| **Cost** | $600-3000/mo | ~$10/mo |

## Cost Savings

**HouseCall Pro:** $49-299/user/month  
**SurvApp:** ~$10/month total (Heroku + Twilio)  
**Annual Savings:** $3,000-$35,000+

## Security

- JWT token authentication
- Bcrypt password hashing
- Role-based access control
- SQL injection prevention (ORM)
- CORS configuration
- Environment-based secrets

## License

Proprietary - All Rights Reserved

## Support

For setup assistance, see documentation files in the project root.
