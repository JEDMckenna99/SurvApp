# Surv - System Architecture
## Technical Architecture & Infrastructure Design

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │  Customer    │          │
│  │  (React)     │  │(React Native)│  │   Portal     │          │
│  │  TypeScript  │  │   iOS/Android│  │   (React)    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │   HTTPS/TLS      │                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼──────────────────┐
│         ▼                  ▼                  ▼                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Cloudflare CDN / Load Balancer              │       │
│  │         (DDoS Protection, SSL, Rate Limiting)         │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                             │
│  ┌──────────────────▼───────────────────────────────────┐       │
│  │              API Gateway (FastAPI)                    │       │
│  │            Authentication Middleware                  │       │
│  │            CORS, Rate Limiting, Logging               │       │
│  └──────────────────┬───────────────────────────────────┘       │
│                     │                                             │
└─────────────────────┼─────────────────────────────────────────────┘
                      │
┌─────────────────────┼─────────────────────────────────────────────┐
│      APPLICATION LAYER (Heroku Web Dynos)                         │
├─────────────────────┼─────────────────────────────────────────────┤
│                     │                                               │
│  ┌─────────────────▼──────────────────────────────────────────┐  │
│  │                 FastAPI Application                         │  │
│  │                                                              │  │
│  │  ┌────────────┐ ┌────────────┐ ┌─────────────┐            │  │
│  │  │   Auth     │ │  Customer  │ │    Job      │            │  │
│  │  │  Endpoints │ │  Endpoints │ │  Endpoints  │  ...       │  │
│  │  └─────┬──────┘ └─────┬──────┘ └──────┬──────┘            │  │
│  │        │              │                │                    │  │
│  │  ┌─────▼──────────────▼────────────────▼──────┐            │  │
│  │  │         Service Layer (Business Logic)      │            │  │
│  │  │  - AuthService                              │            │  │
│  │  │  - CustomerService                          │            │  │
│  │  │  - JobService                               │            │  │
│  │  │  - InvoiceService                           │            │  │
│  │  │  - PaymentService (Stripe)                  │            │  │
│  │  │  - SMSService (Twilio)                      │            │  │
│  │  │  - EmailService (SendGrid)                  │            │  │
│  │  └─────────────────┬───────────────────────────┘            │  │
│  │                    │                                         │  │
│  │  ┌─────────────────▼───────────────────────────┐            │  │
│  │  │         Data Access Layer (ORM)             │            │  │
│  │  │         SQLAlchemy Models                   │            │  │
│  │  └─────────────────┬───────────────────────────┘            │  │
│  └────────────────────┼──────────────────────────────────────┘  │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────────────────┐
│   WORKER LAYER (Heroku Worker Dynos)                             │
├───────────────────────┼───────────────────────────────────────────┤
│                       │                                             │
│  ┌────────────────────▼────────────────────────────────────────┐  │
│  │              Celery Task Queue                              │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │  Email Tasks │  │  SMS Tasks   │  │ Report Tasks │     │  │
│  │  │              │  │              │  │              │     │  │
│  │  │  - Send      │  │  - Send SMS  │  │  - Generate  │     │  │
│  │  │    invoices  │  │  - Reminders │  │    PDFs      │     │  │
│  │  │  - Campaigns │  │  - Two-way   │  │  - Export    │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │  │
│  │  │Schedule Tasks│  │Payment Tasks │  │  Sync Tasks  │     │  │
│  │  │              │  │              │  │              │     │  │
│  │  │  - Recurring │  │  - Process   │  │  - QuickBooks│     │  │
│  │  │    jobs      │  │    payments  │  │  - Xero      │     │  │
│  │  │  - Reminders │  │  - Refunds   │  │              │     │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────────────────┐
│     DATA LAYER                                                    │
├───────────────────────┼───────────────────────────────────────────┤
│                       │                                             │
│  ┌────────────────────▼──────────────────┐                        │
│  │    Heroku PostgreSQL (Primary DB)     │                        │
│  │                                        │                        │
│  │  Tables:                               │                        │
│  │  - users, customers, jobs              │                        │
│  │  - invoices, payments                  │                        │
│  │  - estimates, schedules                │                        │
│  │  - communications, files               │                        │
│  │  - employees, time_entries             │                        │
│  │                                        │                        │
│  │  Features:                             │                        │
│  │  - Point-in-time recovery              │                        │
│  │  - Automated backups (daily)           │                        │
│  │  - Read replicas (for scaling)         │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
│  ┌────────────────────────────────────────┐                        │
│  │       Heroku Redis (Cache & Queue)     │                        │
│  │                                        │                        │
│  │  Uses:                                 │                        │
│  │  - Celery message broker               │                        │
│  │  - Session storage                     │                        │
│  │  - API rate limiting                   │                        │
│  │  - Cache frequently accessed data      │                        │
│  │  - Real-time pub/sub                   │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
│  ┌────────────────────────────────────────┐                        │
│  │       AWS S3 (File Storage)            │                        │
│  │                                        │                        │
│  │  Buckets:                              │                        │
│  │  - surv-customer-files/                │                        │
│  │    - photos/                           │                        │
│  │    - documents/                        │                        │
│  │    - invoices/                         │                        │
│  │  - surv-backups/                       │                        │
│  │                                        │                        │
│  │  Features:                             │                        │
│  │  - CloudFront CDN integration          │                        │
│  │  - Pre-signed URLs (secure access)     │                        │
│  │  - Lifecycle policies (auto-cleanup)   │                        │
│  │  - Versioning enabled                  │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│     EXTERNAL SERVICES / INTEGRATIONS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Stripe    │  │   Twilio    │  │  SendGrid   │                 │
│  │  Payments   │  │  SMS+Voice  │  │    Email    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Google Maps │  │ QuickBooks  │  │   Firebase  │                 │
│  │   Routing   │  │ Accounting  │  │Push Notifs  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│     MONITORING & OBSERVABILITY                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Sentry    │  │   Heroku    │  │  Papertrail │                 │
│  │   Error     │  │   Metrics   │  │   Logging   │                 │
│  │  Tracking   │  │             │  │             │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Architecture (React)

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │              App Router (React Router)         │     │
│  │  - Public routes (login, booking)              │     │
│  │  - Protected routes (dashboard, management)    │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │         Redux Store (State Management)          │     │
│  │                                                  │     │
│  │  Slices:                                        │     │
│  │  - auth: User authentication state              │     │
│  │  - customers: Customer data & filters           │     │
│  │  - jobs: Job schedule & status                  │     │
│  │  - invoices: Billing data                       │     │
│  │  - ui: UI state (modals, loading, etc.)        │     │
│  │                                                  │     │
│  │  RTK Query APIs:                                │     │
│  │  - customersApi (CRUD operations)               │     │
│  │  - jobsApi (scheduling operations)              │     │
│  │  - invoicesApi (billing operations)             │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │              Pages (Route Components)           │     │
│  │                                                  │     │
│  │  /dashboard       - DashboardPage               │     │
│  │  /customers       - CustomersPage               │     │
│  │  /customers/:id   - CustomerDetailPage          │     │
│  │  /schedule        - SchedulePage                │     │
│  │  /jobs/:id        - JobDetailPage               │     │
│  │  /invoices        - InvoicesPage                │     │
│  │  /settings        - SettingsPage                │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │            Feature Components                   │     │
│  │                                                  │     │
│  │  Customers:                                     │     │
│  │  - CustomerList, CustomerForm, CustomerCard     │     │
│  │                                                  │     │
│  │  Schedule:                                      │     │
│  │  - ScheduleCalendar, JobCard, DragDropJob      │     │
│  │                                                  │     │
│  │  Invoices:                                      │     │
│  │  - InvoiceList, InvoiceForm, PaymentForm       │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │          Common Components (Design System)      │     │
│  │                                                  │     │
│  │  - Button, Input, Select, Modal                 │     │
│  │  - Table, DataGrid, Card                        │     │
│  │  - Tabs, Accordion, Alert                       │     │
│  │  - DatePicker, TimePicker                       │     │
│  │  - MapView, Charts                              │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 2. Backend Architecture (FastAPI)

```
┌─────────────────────────────────────────────────────────┐
│                  FastAPI Application                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │              Middleware Stack                   │     │
│  │  1. CORS Middleware                             │     │
│  │  2. Authentication Middleware (JWT)             │     │
│  │  3. Rate Limiting Middleware                    │     │
│  │  4. Request Logging Middleware                  │     │
│  │  5. Error Handling Middleware                   │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │             API Routes (v1)                     │     │
│  │                                                  │     │
│  │  /api/v1/auth/                                  │     │
│  │  ├─ POST /login                                 │     │
│  │  ├─ POST /register                              │     │
│  │  ├─ POST /refresh                               │     │
│  │  └─ POST /logout                                │     │
│  │                                                  │     │
│  │  /api/v1/customers/                             │     │
│  │  ├─ GET    /                (list)              │     │
│  │  ├─ POST   /                (create)            │     │
│  │  ├─ GET    /:id             (get)               │     │
│  │  ├─ PUT    /:id             (update)            │     │
│  │  ├─ DELETE /:id             (delete)            │     │
│  │  └─ GET    /:id/jobs        (history)           │     │
│  │                                                  │     │
│  │  /api/v1/jobs/                                  │     │
│  │  /api/v1/invoices/                              │     │
│  │  /api/v1/payments/                              │     │
│  │  /api/v1/estimates/                             │     │
│  │  /api/v1/employees/                             │     │
│  │  ...                                            │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │              Service Layer                      │     │
│  │         (Business Logic & Orchestration)        │     │
│  │                                                  │     │
│  │  AuthService:                                   │     │
│  │  - authenticate_user()                          │     │
│  │  - create_access_token()                        │     │
│  │  - verify_token()                               │     │
│  │                                                  │     │
│  │  CustomerService:                               │     │
│  │  - get_customers(filters, pagination)           │     │
│  │  - create_customer(data)                        │     │
│  │  - update_customer(id, data)                    │     │
│  │  - get_customer_with_jobs(id)                   │     │
│  │                                                  │     │
│  │  JobService:                                    │     │
│  │  - create_job(data)                             │     │
│  │  - assign_technician(job_id, tech_id)          │     │
│  │  - update_job_status(job_id, status)           │     │
│  │  - get_schedule(date_range, filters)           │     │
│  │                                                  │     │
│  │  InvoiceService:                                │     │
│  │  - generate_invoice(job_id)                     │     │
│  │  - send_invoice_email(invoice_id)               │     │
│  │  - mark_as_paid(invoice_id)                     │     │
│  │                                                  │     │
│  │  PaymentService (integrates with Stripe):      │     │
│  │  - create_payment_intent(amount)                │     │
│  │  - process_payment(payment_method)              │     │
│  │  - handle_webhook(event)                        │     │
│  │                                                  │     │
│  │  SMSService (integrates with Twilio):          │     │
│  │  - send_sms(to, message)                        │     │
│  │  - send_job_reminder(job_id)                    │     │
│  │  - handle_incoming_sms(from, body)              │     │
│  │                                                  │     │
│  │  EmailService (integrates with SendGrid):      │     │
│  │  - send_email(to, subject, body, template)     │     │
│  │  - send_invoice_email(invoice_id)               │     │
│  │  - send_campaign(campaign_id)                   │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │         Repository Layer (Data Access)          │     │
│  │              SQLAlchemy ORM                     │     │
│  │                                                  │     │
│  │  Models:                                        │     │
│  │  - User, Customer, Job                          │     │
│  │  - Invoice, Payment                             │     │
│  │  - Employee, TimeEntry                          │     │
│  │  - Communication, File                          │     │
│  │                                                  │     │
│  │  Repositories:                                  │     │
│  │  - CustomerRepository                           │     │
│  │  - JobRepository                                │     │
│  │  - InvoiceRepository                            │     │
│  │  ...                                            │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │           Database Connection                   │     │
│  │         (Async PostgreSQL)                      │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 3. Mobile App Architecture (React Native)

```
┌─────────────────────────────────────────────────────────┐
│               React Native Mobile App                    │
│                   (iOS + Android)                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────────────────────────┐     │
│  │              Navigation Stack                   │     │
│  │  - Authentication Stack (Login)                 │     │
│  │  - Main Tab Navigator                           │     │
│  │    ├─ Today (job list)                          │     │
│  │    ├─ Map (navigation)                          │     │
│  │    ├─ Time (clock in/out)                       │     │
│  │    └─ Profile                                   │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │          Offline-First Storage                  │     │
│  │             (React Native MMKV)                 │     │
│  │  - Cache job data                               │     │
│  │  - Queue actions when offline                   │     │
│  │  - Sync when connection restored                │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │           Core Features                         │     │
│  │                                                  │     │
│  │  Job Management:                                │     │
│  │  - View assigned jobs                           │     │
│  │  - Job details and customer info                │     │
│  │  - Update job status                            │     │
│  │  - Add notes and photos                         │     │
│  │                                                  │     │
│  │  Navigation:                                    │     │
│  │  - GPS to job site                              │     │
│  │  - Route optimization                           │     │
│  │  - ETA updates                                  │     │
│  │                                                  │     │
│  │  Time Tracking:                                 │     │
│  │  - Clock in/out                                 │     │
│  │  - Break tracking                               │     │
│  │  - Timesheet view                               │     │
│  │                                                  │     │
│  │  Photos & Files:                                │     │
│  │  - Camera integration                           │     │
│  │  - Before/after photos                          │     │
│  │  - Upload to S3                                 │     │
│  │                                                  │     │
│  │  Payments:                                      │     │
│  │  - Accept credit cards                          │     │
│  │  - Record cash/check                            │     │
│  │  - Email receipt                                │     │
│  │                                                  │     │
│  │  Signatures:                                    │     │
│  │  - Digital signature capture                    │     │
│  │  - Work order completion                        │     │
│  └─────────────┬──────────────────────────────────┘     │
│                │                                          │
│  ┌─────────────▼──────────────────────────────────┐     │
│  │        Native Device Features                   │     │
│  │  - Camera (photos/video)                        │     │
│  │  - GPS/Location services                        │     │
│  │  - Push notifications (FCM)                     │     │
│  │  - Biometric auth (Face ID/Touch ID)            │     │
│  │  - Phone/SMS integration                        │     │
│  └─────────────────────────────────────────────────┘     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Authentication Flow

```
┌──────────┐                 ┌──────────┐                 ┌──────────┐
│          │  1. POST Login  │          │  2. Query DB    │          │
│  Client  │ ───────────────>│   API    │ ───────────────>│   DB     │
│          │    credentials  │  Server  │   user by email │          │
└──────────┘                 └──────────┘                 └──────────┘
     ▲                            │                            │
     │                            │  3. Verify password        │
     │                            │<───────────────────────────┘
     │                            │
     │                            │  4. Generate JWT token
     │                            │     (includes user_id, role, exp)
     │                            │
     │  5. Return token & user    │
     │<───────────────────────────│
     │       {                    │
     │         access_token,      │
     │         user: {...}        │
     │       }                    │
     │                            │
     │  6. Store token            │
     │     (localStorage)         │
     │                            │
     │  7. All future requests    │
     │     include token          │
     │ ───────────────────────────>
     │  Header: Authorization     │
     │  Bearer <token>            │
```

### 2. Job Creation & Assignment Flow

```
┌────────┐      ┌──────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│Manager │      │ Web  │      │   API    │      │  DB     │      │ Mobile   │
│        │      │ App  │      │  Server  │      │         │      │ (Tech)   │
└────┬───┘      └──┬───┘      └────┬─────┘      └────┬────┘      └────┬─────┘
     │             │                │                 │                 │
     │ Create Job  │                │                 │                 │
     │────────────>│                │                 │                 │
     │             │ POST /jobs     │                 │                 │
     │             │───────────────>│                 │                 │
     │             │                │ Validate data   │                 │
     │             │                │ Create job row  │                 │
     │             │                │───────────────>│                 │
     │             │                │                 │                 │
     │             │                │ Return job_id   │                 │
     │             │<───────────────│<────────────────│                 │
     │             │                │                 │                 │
     │ Assign Tech │                │                 │                 │
     │────────────>│                │                 │                 │
     │             │ POST /jobs/:id/assign            │                 │
     │             │───────────────>│                 │                 │
     │             │                │ Update DB       │                 │
     │             │                │───────────────>│                 │
     │             │                │                 │                 │
     │             │                │ Trigger notification task         │
     │             │                │──────────────────────────────────>│
     │             │                │          (Celery + FCM)           │
     │             │                │                 │                 │
     │             │<───────────────│                 │  Push: New Job  │
     │             │                │                 │────────────────>│
     │<────────────│                │                 │                 │
     │             │                │                 │                 │
```

### 3. Invoice & Payment Flow

```
┌────────┐   ┌──────┐   ┌──────────┐   ┌─────────┐   ┌────────┐   ┌──────────┐
│Manager │   │ API  │   │  Invoice │   │  Email  │   │Customer│   │  Stripe  │
│        │   │Server│   │  Service │   │ Service │   │        │   │          │
└───┬────┘   └──┬───┘   └────┬─────┘   └────┬────┘   └───┬────┘   └────┬─────┘
    │           │             │              │            │             │
    │ Create Invoice          │              │            │             │
    │──────────>│             │              │            │             │
    │           │ generate_invoice(job_id)   │            │             │
    │           │────────────>│              │            │             │
    │           │             │ Calculate    │            │             │
    │           │             │ totals       │            │             │
    │           │             │              │            │             │
    │           │             │ Save to DB   │            │             │
    │           │             │              │            │             │
    │           │<────────────│ Return invoice_id         │             │
    │<──────────│             │              │            │             │
    │           │             │              │            │             │
    │ Send Invoice            │              │            │             │
    │──────────>│             │              │            │             │
    │           │ send_invoice_email()       │            │             │
    │           │────────────>│              │            │             │
    │           │             │ Queue email  │            │             │
    │           │             │─────────────>│            │             │
    │           │             │              │ Generate   │             │
    │           │             │              │ PDF        │             │
    │           │             │              │            │             │
    │           │             │              │ Send email │             │
    │           │             │              │───────────>│             │
    │           │             │              │            │ Click to pay│
    │           │             │              │            │            │
    │           │             │              │            │ Open payment│
    │           │             │              │            │ page       │
    │           │             │              │            │            │
    │           │             │              │            │ Enter card │
    │           │             │              │            │──────────>│
    │           │             │              │            │            │
    │           │             │              │            │ Process    │
    │           │             │              │            │            │
    │           │             │              │            │<───────────│
    │           │             │              │            │ Success    │
    │           │<────────────────────────────────────────────────────│
    │           │ Webhook: payment_intent.succeeded      │            │
    │           │             │              │            │            │
    │           │ record_payment()           │            │            │
    │           │────────────>│              │            │            │
    │           │             │ Update invoice           │            │
    │           │             │ status: paid │            │            │
    │           │             │              │            │            │
    │           │             │ Send receipt │            │            │
    │           │             │─────────────>│────────────>│            │
```

### 4. Background Task Processing (Celery)

```
┌──────────┐        ┌───────┐        ┌────────┐        ┌──────────┐
│   API    │        │ Redis │        │ Celery │        │ External │
│  Server  │        │ Queue │        │ Worker │        │   API    │
└────┬─────┘        └───┬───┘        └───┬────┘        └────┬─────┘
     │                  │                 │                  │
     │ send_sms_reminder(customer_id)     │                  │
     │─────────────────>│                 │                  │
     │  (async, returns immediately)      │                  │
     │                  │                 │                  │
     │<─────────────────│                 │                  │
     │ Task queued      │                 │                  │
     │                  │                 │                  │
     │                  │    Task pickup  │                  │
     │                  │<────────────────│                  │
     │                  │                 │                  │
     │                  │                 │ Get customer     │
     │                  │                 │ from DB          │
     │                  │                 │                  │
     │                  │                 │ Send SMS         │
     │                  │                 │─────────────────>│
     │                  │                 │      (Twilio)    │
     │                  │                 │                  │
     │                  │                 │<─────────────────│
     │                  │                 │ SMS sent         │
     │                  │                 │                  │
     │                  │                 │ Log result       │
     │                  │                 │ to DB            │
     │                  │                 │                  │
     │                  │ Task complete   │                  │
     │                  │────────────────>│                  │
```

---

## Security Architecture

### 1. Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Transport Security                                 │
│  ┌───────────────────────────────────────────────────┐      │
│  │  HTTPS/TLS 1.3                                    │      │
│  │  - All traffic encrypted                          │      │
│  │  - Certificate pinning (mobile apps)              │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  Layer 2: API Gateway                                        │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Cloudflare                                       │      │
│  │  - DDoS protection                                │      │
│  │  - Rate limiting (per IP)                         │      │
│  │  - Bot protection                                 │      │
│  │  - Web Application Firewall (WAF)                │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  Layer 3: Application Authentication                         │
│  ┌───────────────────────────────────────────────────┐      │
│  │  JWT Token Authentication                         │      │
│  │                                                    │      │
│  │  Token Structure:                                 │      │
│  │  {                                                │      │
│  │    "user_id": "uuid",                             │      │
│  │    "email": "user@example.com",                   │      │
│  │    "role": "admin|manager|technician|customer",   │      │
│  │    "exp": 1234567890,  // Expiration             │      │
│  │    "iat": 1234567890   // Issued at              │      │
│  │  }                                                │      │
│  │                                                    │      │
│  │  Token Lifecycle:                                 │      │
│  │  - Access token: 24 hours                         │      │
│  │  - Refresh token: 30 days                         │      │
│  │  - Automatic refresh before expiration            │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  Layer 4: Role-Based Access Control (RBAC)                   │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Roles & Permissions:                             │      │
│  │                                                    │      │
│  │  Admin:                                           │      │
│  │  - Full system access                             │      │
│  │  - User management                                │      │
│  │  - Settings configuration                         │      │
│  │                                                    │      │
│  │  Manager:                                         │      │
│  │  - Create/edit customers, jobs, invoices          │      │
│  │  - Assign jobs to technicians                     │      │
│  │  - View all reports                               │      │
│  │                                                    │      │
│  │  Technician:                                      │      │
│  │  - View assigned jobs only                        │      │
│  │  - Update job status                              │      │
│  │  - Submit timesheets                              │      │
│  │  - Cannot delete or reassign jobs                 │      │
│  │                                                    │      │
│  │  Customer:                                        │      │
│  │  - View own jobs and invoices                     │      │
│  │  - Make payments                                  │      │
│  │  - Book appointments                              │      │
│  │  - Cannot view other customers                    │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  Layer 5: Data Access Control                                │
│  ┌───────────────────────────────────────────────────┐      │
│  │  Row-Level Security                               │      │
│  │  - Technicians see only their jobs                │      │
│  │  - Customers see only their data                  │      │
│  │  - Enforced at database query level               │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
│  Layer 6: Audit Logging                                      │
│  ┌───────────────────────────────────────────────────┐      │
│  │  All sensitive actions logged:                    │      │
│  │  - User logins                                    │      │
│  │  - Data modifications                             │      │
│  │  - Payment transactions                           │      │
│  │  - Permission changes                             │      │
│  │  - Failed authentication attempts                 │      │
│  └───────────────────────────────────────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Payment Security (PCI DSS Compliance)

```
┌─────────────────────────────────────────────────────────┐
│              Payment Processing Flow                     │
│              (PCI DSS Compliant)                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Customer enters card on frontend                     │
│     ├─ Stripe.js loaded from Stripe servers             │
│     ├─ Card data NEVER touches Surv servers              │
│     └─ Stripe Elements (tokenization on client)          │
│                                                           │
│  2. Stripe returns token                                 │
│     ├─ Token represents card (e.g., tok_1234...)         │
│     └─ Token sent to Surv backend                        │
│                                                           │
│  3. Surv backend processes payment                       │
│     ├─ Create payment intent with token                  │
│     ├─ Stripe charges card                               │
│     └─ Only store: last4, brand, token                   │
│                                                           │
│  4. Webhook confirmation                                 │
│     ├─ Stripe sends webhook to Surv                      │
│     ├─ Verify webhook signature                          │
│     └─ Update invoice status                             │
│                                                           │
│  ✅ PCI DSS Compliance Achieved:                          │
│     - No card data stored on Surv servers                │
│     - All card handling by Stripe (PCI Level 1)          │
│     - Stripe SAQ-A (simplest compliance)                 │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Scalability & Performance

### 1. Caching Strategy

```
┌───────────────────────────────────────────────────────┐
│                 Caching Layers                         │
├───────────────────────────────────────────────────────┤
│                                                         │
│  Level 1: Browser Cache                                │
│  - Static assets (JS, CSS, images)                     │
│  - CDN caching headers                                 │
│  - Service worker for offline                          │
│                                                         │
│  Level 2: CDN Cache (Cloudflare)                       │
│  - Edge caching for static content                     │
│  - Image optimization                                  │
│  - Geographic distribution                             │
│                                                         │
│  Level 3: Application Cache (Redis)                    │
│  ┌─────────────────────────────────────────────┐      │
│  │ Cached Data:                                │      │
│  │ - User sessions                             │      │
│  │ - API responses (short TTL)                 │      │
│  │ - Price book items                          │      │
│  │ - Settings and configurations               │      │
│  │                                             │      │
│  │ Cache Keys:                                 │      │
│  │ - user:{user_id}:profile                    │      │
│  │ - customers:list:page:{page}                │      │
│  │ - job:{job_id}                              │      │
│  │                                             │      │
│  │ Cache Invalidation:                         │      │
│  │ - On data update, delete related keys       │      │
│  │ - TTL for automatic expiration              │      │
│  └─────────────────────────────────────────────┘      │
│                                                         │
│  Level 4: Database Query Cache                         │
│  - PostgreSQL query cache                              │
│  - Read replicas for read-heavy queries                │
│                                                         │
└───────────────────────────────────────────────────────┘
```

### 2. Database Optimization

```
Key Indexes:
- users(email) - Login lookups
- customers(phone, email) - Customer search
- jobs(scheduled_date, assigned_to) - Schedule queries
- jobs(customer_id) - Customer job history
- invoices(customer_id, status) - Billing queries
- time_entries(employee_id, entry_time) - Timesheet queries

Query Optimization:
- Use async queries (SQLAlchemy async)
- Eager loading for relationships
- Pagination for large datasets
- Database connection pooling

Scaling Strategy:
- Start: Single PostgreSQL instance
- Growth: Add read replicas for reporting
- High scale: Partition tables by date
```

### 3. Performance Targets

```
┌───────────────────────────────────────────────────────┐
│               Performance SLAs                         │
├───────────────────────────────────────────────────────┤
│                                                         │
│  API Response Times (p95):                             │
│  - Authentication: < 200ms                             │
│  - Simple queries (get customer): < 300ms              │
│  - Complex queries (schedule): < 500ms                 │
│  - Search queries: < 1s                                │
│                                                         │
│  Page Load Times:                                      │
│  - First Contentful Paint: < 1.5s                      │
│  - Time to Interactive: < 3s                           │
│                                                         │
│  Mobile App:                                           │
│  - Cold start: < 3s                                    │
│  - Screen transitions: < 100ms                         │
│                                                         │
│  Background Jobs:                                      │
│  - SMS delivery: < 5s                                  │
│  - Email delivery: < 30s                               │
│  - PDF generation: < 10s                               │
│                                                         │
│  Uptime: 99.9% (43 minutes downtime/month max)         │
│                                                         │
└───────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Heroku Deployment Configuration

```
Production Environment:
┌────────────────────────────────────────────┐
│  App: surv-api-production                  │
├────────────────────────────────────────────┤
│  Web Dynos: 4x Performance-M               │
│  - Auto-scaling: 4-8 dynos                 │
│  - 2.5 GB RAM each                         │
│  - Load balanced automatically             │
│                                            │
│  Worker Dynos: 2x Performance-M            │
│  - Celery workers for background tasks     │
│  - Auto-scaling based on queue length      │
│                                            │
│  Database: PostgreSQL Standard-4           │
│  - 488 GB RAM                              │
│  - Continuous protection (rollback)        │
│  - Daily backups retained 1 month          │
│  - 1 read replica for reporting            │
│                                            │
│  Redis: Premium-5                          │
│  - 6.59 GB memory                          │
│  - High availability                       │
│  - Automatic failover                      │
│                                            │
│  Add-ons:                                  │
│  - Papertrail (logging)                    │
│  - Heroku Scheduler (cron jobs)            │
│  - SSL (automatic Let's Encrypt)           │
│                                            │
│  Estimated Cost: ~$1,200/month             │
└────────────────────────────────────────────┘

Staging Environment:
┌────────────────────────────────────────────┐
│  App: surv-api-staging                     │
├────────────────────────────────────────────┤
│  Web Dynos: 2x Standard-2X                 │
│  Worker Dynos: 1x Standard-2X              │
│  Database: PostgreSQL Standard-0           │
│  Redis: Premium-0                          │
│                                            │
│  Estimated Cost: ~$300/month               │
└────────────────────────────────────────────┘
```

---

## Disaster Recovery & Backup

```
┌───────────────────────────────────────────────────────┐
│            Backup & Recovery Strategy                  │
├───────────────────────────────────────────────────────┤
│                                                         │
│  Database Backups:                                     │
│  - Automated daily backups (Heroku)                    │
│  - Continuous protection (point-in-time recovery)      │
│  - Manual backups before major deployments             │
│  - Retention: 30 days                                  │
│  - Storage: AWS S3 (encrypted)                         │
│                                                         │
│  File Backups (S3):                                    │
│  - Versioning enabled                                  │
│  - Cross-region replication                            │
│  - Lifecycle policies (archive after 90 days)          │
│                                                         │
│  Recovery Time Objectives (RTO):                       │
│  - Database restore: < 1 hour                          │
│  - Full system restore: < 4 hours                      │
│                                                         │
│  Recovery Point Objectives (RPO):                      │
│  - Maximum data loss: < 5 minutes                      │
│                                                         │
│  Disaster Scenarios:                                   │
│  1. Database failure → Restore from backup             │
│  2. Heroku region outage → Failover to backup region   │
│  3. Data corruption → Point-in-time recovery           │
│  4. Accidental deletion → Restore specific data        │
│                                                         │
└───────────────────────────────────────────────────────┘
```

---

## Monitoring & Alerting

```
┌───────────────────────────────────────────────────────┐
│              Monitoring Stack                          │
├───────────────────────────────────────────────────────┤
│                                                         │
│  Error Tracking (Sentry):                              │
│  - Backend errors with stack traces                    │
│  - Frontend errors and crashes                         │
│  - Performance monitoring                              │
│  - Release tracking                                    │
│                                                         │
│  Infrastructure Monitoring (Heroku Metrics):           │
│  - Dyno memory usage                                   │
│  - Response times                                      │
│  - Throughput (requests/second)                        │
│  - Database connections                                │
│                                                         │
│  Application Logging (Papertrail):                     │
│  - Centralized log aggregation                         │
│  - Search and filtering                                │
│  - Log retention: 7 days                               │
│                                                         │
│  Uptime Monitoring:                                    │
│  - Health check endpoint (/health)                     │
│  - External monitoring (Pingdom/UptimeRobot)           │
│  - Alert if down > 1 minute                            │
│                                                         │
│  Alerts:                                               │
│  - Email + Slack notifications                         │
│  - Error rate > 5% → Alert immediately                 │
│  - Response time > 2s → Alert team                     │
│  - Dyno memory > 80% → Scale alert                     │
│  - Database connections > 90% → Critical alert         │
│                                                         │
│  Business Metrics (Custom Dashboard):                  │
│  - Daily active users                                  │
│  - Jobs created                                        │
│  - Invoices sent                                       │
│  - Revenue processed                                   │
│  - Failed payments                                     │
│                                                         │
└───────────────────────────────────────────────────────┘
```

---

## Conclusion

This architecture provides a solid foundation for building Surv as a scalable, secure, and maintainable field service management platform. The design prioritizes:

1. **Security**: Multi-layered security with JWT auth, RBAC, and PCI compliance
2. **Scalability**: Caching, async processing, and horizontal scaling capability
3. **Reliability**: Automated backups, monitoring, and disaster recovery
4. **Performance**: Optimized queries, CDN, and caching strategies
5. **Maintainability**: Clean architecture, separation of concerns, and documentation

The architecture can start simple (single Heroku dyno) and scale to handle thousands of users with minimal changes to the core design.

---

*Architecture Documentation for Surv Platform*  
*Last updated: October 16, 2025*




