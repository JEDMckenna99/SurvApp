# SMS-Based Technician Workflow Guide

**Status:** Deployed to https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/  
**Version:** v15  
**Date:** October 19, 2025

---

## Overview

Technicians can manage their entire workday via text messages. All SMS commands are logged, timers are tracked automatically, and customers receive automated notifications.

---

## SMS Commands for Technicians

### Daily Operations

**Clock In:**
```
clock in
```
or
```
in
```

**Clock Out:**
```
clock out
```
or
```
out
```

### Job Management

**Notify Customer "On My Way":**
```
omw #123
```
or
```
on my way job 123
```
or
```
heading #123
```

**What happens:**
- ✓ System sends automated text to customer: "Good news! Your technician [Name] is on the way for your [Service] appointment."
- ✓ Travel timer starts
- ✓ Event logged in job timeline

---

**Start Job:**
```
start #123
```
or
```
begin job 123
```

**What happens:**
- ✓ Travel timer stops (calculates travel time)
- ✓ Job timer starts
- ✓ Job status changes to "in_progress"
- ✓ Response shows travel time: "Started Job #123 (Travel time: 15 min)"

---

**Finish Job:**
```
done #123
```
or
```
complete job 123
```
or
```
finished #123
```

**What happens:**
- ✓ Job timer stops (calculates job duration)
- ✓ Job status changes to "completed"
- ✓ Response shows job duration: "Completed Job #123 (Duration: 45 min)"
- ✓ Event logged in timeline

---

**Add Job Summary:**
```
summary #123: Fixed leaking pipe, replaced valve, tested system
```

**What happens:**
- ✓ Summary saved as job note
- ✓ Visible to admin in job details
- ✓ Marked as "TECHNICIAN SUMMARY"

---

**Upload Photos:**
- Send MMS with photo + text: "#123 before" or "#123 after"
- Photos automatically categorized and attached to job
- Visible in admin UI under job files

---

**List My Jobs:**
```
jobs
```
or
```
my jobs
```

**Response:**
```
Your jobs today:
• #001: Plumbing Repair at 9:00 AM
• #002: HVAC Maintenance at 2:00 PM
```

---

**Get Help:**
```
help
```
or
```
?
```

**Response shows all available commands**

---

## Complete Workflow Example

### Typical Technician Day:

**8:00 AM - Clock In**
```
Technician texts: "clock in"
System responds: "✓ Clocked in at 8:00 AM"
```

**8:30 AM - Leave for First Job**
```
Technician texts: "omw #001"
System responds: "✓ Customer notified for Job #001. Travel timer started."
Customer receives: "Good news! Your technician John is on the way for your Plumbing Repair appointment."
```

**8:45 AM - Arrive and Start Job**
```
Technician texts: "start #001"
System responds: "✓ Started Job #001 (Travel time: 15 min). Job timer running."
```

**10:00 AM - Complete Job**
```
Technician texts: "done #001"
System responds: "✓ Completed Job #001 (Duration: 75 min). Great work!"
```

**10:05 AM - Add Summary**
```
Technician texts: "summary #001: Fixed leaking kitchen sink, replaced shutoff valve, tested for leaks"
System responds: "✓ Summary added to Job #001"
```

**10:10 AM - Upload Photos**
```
Technician sends MMS with photos and text: "#001 after"
System responds: "✓ Photo saved to Job #001"
```

**5:00 PM - Clock Out**
```
Technician texts: "clock out"
System responds: "✓ Clocked out at 5:00 PM"
```

---

## Admin Dashboard Features

### What Admins See

**Job Timeline View:**
- All events with timestamps
- Travel time for each job
- Job duration for each job
- Employee who performed action
- Visual timeline with icons

**SMS Message Log:**
- All messages (inbound/outbound)
- Command types
- Processing status
- Media attachments
- Timestamps

**Customer Phone Management:**
- Add/edit customer phone numbers
- Required for SMS notifications
- Simple form in job details

---

## Data Tracked Automatically

### For Each Job:

1. **Timeline Events:**
   - on_my_way (when tech sends notification)
   - started (when job begins)
   - completed (when job finishes)

2. **Time Metrics:**
   - Travel time (omw → start)
   - Job duration (start → done)
   - Total time on job site

3. **SMS Messages:**
   - Every inbound text from technician
   - Every outbound text to customer
   - Commands processed
   - Photos/media attached

4. **Job Notes:**
   - Technician summaries
   - Work completed descriptions
   - Visible to admin in job details

---

## Setup Instructions

### 1. Configure Twilio

Add to Heroku environment variables:

```bash
heroku config:set TWILIO_ACCOUNT_SID=AC... -a surv-report-gen
heroku config:set TWILIO_AUTH_TOKEN=... -a surv-report-gen
heroku config:set TWILIO_PHONE_NUMBER=+15551234567 -a surv-report-gen
```

### 2. Set Webhook URL in Twilio

1. Log in to [Twilio Console](https://console.twilio.com/)
2. Go to Phone Numbers → Manage → Active numbers
3. Click on your Surv number
4. Under "Messaging", set:
   - **Webhook URL:** `https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/api/v1/sms/webhook`
   - **Method:** POST
5. Save

### 3. Uncomment Twilio Code

In `surv-backend/app/api/v1/sms_webhook.py`:
- Uncomment lines for actual Twilio message sending
- Uncomment Twilio imports

In `surv-backend/app/api/v1/notifications.py`:
- Uncomment Twilio sending code

### 4. Add Technician Phone Numbers

As admin:
1. Go to user management (or use API)
2. Add phone number for each technician
3. Format: +15551234567 (with country code)

### 5. Add Customer Phone Numbers

As admin:
1. Go to Customers page
2. Edit customer
3. Add phone number in same format
4. Or use job details page to add quickly

---

## Technical Details

### Database Tables

**sms_messages:**
- Logs every SMS (inbound/outbound)
- Links to jobs, employees, customers
- Stores media URLs for MMS
- Tracks command processing

**job_timeline:**
- Event log for each job
- Calculates travel/job times automatically
- GPS location (if provided)
- Employee attribution

### API Endpoints

**POST `/api/v1/sms/webhook`**
- Receives Twilio webhooks
- Parses commands
- Processes actions
- Sends responses

**GET `/api/v1/sms/messages/{job_id}`**
- Retrieve all SMS for a job
- Admin viewing

**GET `/api/v1/sms/timeline/{job_id}`**
- Retrieve timeline events
- Shows calculated times
- Admin viewing

---

## Benefits

### For Technicians:
- ✓ **No app to open** - just text
- ✓ **Native interface** - SMS is familiar
- ✓ **Fast responses** - instant confirmations
- ✓ **Automatic timers** - no manual tracking
- ✓ **Photo upload** - via MMS
- ✓ **Simple commands** - easy to remember

### For Customers:
- ✓ **Automated notifications** - know when tech is coming
- ✓ **No app required** - receive SMS
- ✓ **Real-time updates** - on my way, job complete

### For Business:
- ✓ **Complete logs** - every message saved
- ✓ **Time tracking** - automatic travel/job duration
- ✓ **Compliance** - full audit trail
- ✓ **Efficiency** - faster tech adoption
- ✓ **Customer satisfaction** - proactive notifications

---

## Testing (Without Twilio)

Current deployment works in "mock mode":
- SMS commands are logged to console
- Timers still work
- Timeline events still track
- All data still saves

To test full integration:
1. Add Twilio credentials
2. Uncomment Twilio code
3. Set webhook URL
4. Text commands to your Surv number

---

## User Interface

### Technician View:
- Simplified dashboard
- "My Jobs" page shows assigned jobs
- One-click actions (also available via SMS)
- Time clock page

### Admin View:
- Job Details page shows:
  - Complete SMS message log
  - Visual timeline with travel/job times
  - Customer phone management
  - All uploaded photos
- Full timeline of all job events

---

## Supported SMS Features

✓ Clock in/out  
✓ Notify customer automatically  
✓ Start/stop job timers  
✓ Travel time tracking  
✓ Job duration tracking  
✓ Job summaries  
✓ Photo uploads via MMS  
✓ List jobs  
✓ Help command  
✓ All messages logged  
✓ Admin viewing of all activity  

---

## Command Reference Card for Technicians

```
CLOCK IN/OUT:
  clock in       Start day
  clock out      End day

JOB COMMANDS:
  omw #123       On my way (notifies customer)
  start #123     Start job (tracks travel time)
  done #123      Finish job (tracks job time)
  
NOTES & PHOTOS:
  summary #123: [text]    Add job summary
  Send photo with "#123"  Upload job photo
  
OTHER:
  jobs           List today's jobs
  help           Show commands
```

---

## Next Steps

1. ✓ SMS webhook deployed and ready
2. ✓ Timeline tracking implemented
3. ✓ Admin UI for viewing SMS/timeline
4. ✓ Technician phone-based workflow complete
5. → Add Twilio credentials when ready
6. → Train technicians on SMS commands
7. → Add customer phone numbers

**Status: FULLY IMPLEMENTED** - Ready for Twilio integration!










