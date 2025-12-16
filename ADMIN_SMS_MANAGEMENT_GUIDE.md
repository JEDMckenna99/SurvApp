# Admin SMS Management Guide

**Live URL:** https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/  
**Version:** v16  
**Status:** DEPLOYED AND OPERATIONAL ✅

---

## New Admin Features

### 1. Technician Management Page

**Location:** Menu → "Technicians"

**What You Can Do:**
- ✅ View all technicians in your company
- ✅ Add/edit phone numbers for each technician
- ✅ See SMS status (enabled/not enabled)
- ✅ Initialize SMS thread with welcome message
- ✅ Send custom SMS to any technician
- ✅ Dashboard showing SMS-enabled count

**How to Add Technician Phone:**
1. Go to "Technicians" page
2. Click phone icon next to technician name
3. Enter phone number with country code (+15551234567)
4. Click "Save Phone Number"

**Initialize SMS Thread:**
1. After adding phone number
2. Click "Init SMS" button
3. Technician receives welcome message with all commands
4. SMS thread is now active

**Send Custom SMS:**
1. Click SMS icon next to technician
2. Type your message
3. Click "Send SMS"
4. Message delivered instantly

---

### 2. Send Jobs via SMS Page

**Location:** Menu → "Send Jobs (SMS)"

**What You Can Do:**
- ✅ View all scheduled jobs
- ✅ Edit job descriptions before sending
- ✅ Assign jobs to technicians via dropdown
- ✅ Automatic SMS with full job details sent
- ✅ Track which jobs have been sent

**Complete Workflow:**

**Step 1: Edit Job Description (Optional)**
- Click "Edit" button on any job
- Update description with detailed instructions
- Description will be included in SMS to technician

**Step 2: Assign Job to Technician**
- Select technician from dropdown
- Job is automatically assigned
- SMS is sent immediately with:
  - Job number and title
  - Customer name and phone
  - Service address
  - Scheduled date and time
  - Service type and priority
  - Complete job description
  - Instructions for SMS commands

**Example SMS Sent to Technician:**
```
NEW JOB ASSIGNED

Job #00001: Plumbing Repair

Customer: John Smith
Phone: 555-1234
Address: 123 Main St, Springfield, IL

Scheduled: 10/20/2025 at 09:00 AM

Service: Plumbing
Priority: high

Description:
Fix leaking kitchen sink under cabinet. 
Customer reports constant dripping. 
Bring replacement parts.

Reply "omw #1" when heading to job.
```

---

### 3. Job Details Page (Enhanced)

**Location:** Jobs → Click on any job

**What You See:**
- ✅ Complete job information
- ✅ SMS message log (all texts related to this job)
- ✅ Visual timeline (on my way → start → complete)
- ✅ Travel time calculated automatically
- ✅ Job duration tracked automatically
- ✅ Customer phone management
- ✅ All uploaded photos

**Timeline Shows:**
- 🚗 "On My Way" event with timestamp
- ▶️ "Started" event with travel time
- ✅ "Completed" event with job duration
- 💬 All SMS commands processed

**Example Timeline:**
```
8:30 AM - ON MY WAY
          John Technician

8:45 AM - STARTED
          John Technician
          Travel: 15 minutes

10:00 AM - COMPLETED
           John Technician
           Duration: 75 minutes
```

---

## Complete Admin Workflow

### Setting Up a New Technician:

**Step 1: Add Phone Number**
1. Go to "Technicians" page
2. Find technician in list
3. Click phone icon
4. Enter: +15551234567
5. Save

**Step 2: Initialize SMS**
1. Click "Init SMS" button
2. Technician receives welcome message explaining all commands
3. SMS thread is now active

**Step 3: Assign First Job**
1. Go to "Send Jobs (SMS)" page
2. Edit job description if needed
3. Select technician from dropdown
4. Job details sent via SMS automatically

---

### Monitoring Technician Activity:

**Real-Time Tracking:**
1. Go to "Jobs" page
2. Click on any job to see details
3. View SMS log - see all texts
4. View timeline - see all events
5. See travel time and job duration

**What Gets Tracked:**
- Every SMS command from technician
- Every notification sent to customer
- Travel time (on my way → start)
- Job duration (start → complete)
- Job summaries submitted
- Photos uploaded

---

## Customer Phone Management

**Why It's Important:**
- Customers need phone numbers to receive "on my way" texts
- Without phone, automated notifications won't work

**How to Add Customer Phone:**

**Method 1 - From Customer Page:**
1. Go to "Customers"
2. Edit customer
3. Add phone number
4. Save

**Method 2 - From Job Details:**
1. Click on any job
2. See "Customer Contact" section
3. Enter phone number
4. Click "Save Phone Number"

---

## SMS Workflow Summary

### For Admins:

1. **Setup:**
   - Add technician phones → "Technicians" page
   - Initialize SMS threads → "Init SMS" button
   - Add customer phones → Customer edit or Job details

2. **Assign Jobs:**
   - Edit descriptions → "Send Jobs (SMS)" page
   - Select technician → Dropdown
   - Job sent automatically with all details

3. **Monitor:**
   - View SMS log → Job Details page
   - View timeline → Job Details page
   - See metrics → Travel time & job duration

### For Technicians:

1. **Receive Job:**
   - Get SMS with full job details
   - Customer info and address included

2. **Work Job:**
   - Text "omw #1" → Customer notified
   - Text "start #1" → Job timer starts
   - Text "done #1" → Job completes

3. **Add Details:**
   - Text summary → "summary #1: Fixed leak..."
   - Send photos → MMS with "#1"

---

## Menu Structure

### Admin/Manager (13 Items):
1. Dashboard
2. Schedule
3. Customers
4. Jobs
5. **Send Jobs (SMS)** ← NEW
6. **Technicians** ← NEW
7. Estimates
8. Invoices
9. Payments
10. Time Clock
11. Marketing
12. Online Booking
13. Reports

### Technician (2 Items):
1. My Jobs
2. Time Clock

---

## Key Features

### Automated Customer Notifications
When technician texts "omw #123":
- Customer automatically receives: "Your technician [Name] is on the way..."
- No admin involvement needed
- Logged in SMS history

### Automatic Time Tracking
- **Travel Time:** From "on my way" to "start job"
- **Job Duration:** From "start job" to "finish job"
- Displayed in timeline
- Used for reporting and billing

### Complete Audit Trail
- Every SMS logged
- Every event timestamped
- Employee attribution
- Customer notification history
- Photo upload tracking

###Editable Job Descriptions
- Edit before assigning
- Included in SMS to technician
- Helps technician prepare
- Clear expectations

---

## Database Tables Added

**sms_messages:**
- Stores all SMS (inbound/outbound)
- Links to jobs, employees, customers
- Command type tracking
- Media URL for photos

**job_timeline:**
- Event log per job
- Automatic time calculations
- Employee tracking
- GPS ready (latitude/longitude columns)

---

## API Endpoints Added

**User Management:**
- `GET /api/v1/users` - List users (filtered by role)
- `GET /api/v1/users/{user_id}` - Get user details
- `PUT /api/v1/users/{user_id}` - Update user (phone, etc.)

**SMS Webhook:**
- `POST /api/v1/sms/webhook` - Twilio webhook
- `GET /api/v1/sms/messages/{job_id}` - SMS log
- `GET /api/v1/sms/timeline/{job_id}` - Timeline events

---

## Testing Instructions

### Test Without Twilio (Mock Mode):

**1. Add Technician Phone:**
- Login as admin
- Go to "Technicians"
- Add phone: +15551234567
- Click "Init SMS"
- See console log (in browser dev tools)

**2. Send Job via SMS:**
- Go to "Send Jobs (SMS)"
- Edit job description
- Select technician
- See success message

**3. View Job Timeline:**
- Go to "Jobs"
- Click on assigned job
- See SMS log (empty in mock mode)
- Timeline shows events

### Test With Twilio (Live Mode):

1. Add Twilio credentials to Heroku
2. Set webhook URL in Twilio
3. Add real phone numbers
4. Initialize SMS thread
5. Technician can text commands
6. See real-time updates in admin UI

---

## Production Checklist

### Before Going Live:

- [ ] Add Twilio credentials to Heroku
- [ ] Set Twilio webhook URL
- [ ] Add all technician phone numbers
- [ ] Initialize SMS thread for each technician
- [ ] Add customer phone numbers
- [ ] Test with one technician first
- [ ] Train technicians on SMS commands
- [ ] Print command reference card for technicians

### Command Reference Card for Technicians:

```
┌────────────────────────────────────┐
│   SURV SMS COMMANDS                │
├────────────────────────────────────┤
│ DAILY:                             │
│  clock in      Start day           │
│  clock out     End day             │
│                                    │
│ JOBS:                              │
│  omw #123      On my way           │
│  start #123    Start job           │
│  done #123     Finish job          │
│                                    │
│ INFO:                              │
│  summary #123: [text]              │
│  Send photo with "#123"            │
│  jobs          List jobs           │
│  help          Show commands       │
└────────────────────────────────────┘
```

---

## Success!

Your SurvApp now has complete admin controls for:
- ✅ Managing technician phone numbers
- ✅ Initializing SMS threads
- ✅ Sending jobs via SMS with full details
- ✅ Editing job descriptions on the fly
- ✅ Monitoring all SMS activity
- ✅ Viewing job timelines
- ✅ Tracking travel and job duration
- ✅ Complete audit trail

**Hard refresh your browser and explore the new Technicians and Send Jobs pages!**










