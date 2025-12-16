# Twilio Setup Guide for SurvApp SMS Workflow

**Purpose:** Enable text-based technician workflow  
**What It Does:** Technicians text commands, customers receive automated notifications  
**Status:** Webhook endpoint ready and deployed

---

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free trial account
3. Verify your email and phone number
4. You'll get $15 in free trial credit

---

## Step 2: Get a Phone Number

1. Log in to https://console.twilio.com/
2. Click **"Get a Twilio phone number"** (or go to Phone Numbers → Buy a number)
3. **Choose a number** that supports SMS
4. **Important:** Make sure it has SMS capability (most US numbers do)
5. **Confirm** and purchase (free trial credit covers this)

**Your Twilio number will look like:** +15551234567

---

## Step 3: Get Your Credentials

In the Twilio Console (https://console.twilio.com/):

1. **Account SID** - Found on the main dashboard
   - Looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value

2. **Auth Token** - Click "Show" next to Auth Token on dashboard
   - Looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this value

3. **Phone Number** - The number you just purchased
   - Format: `+15551234567`
   - Must include country code (+1 for US)

---

## Step 4: Configure Twilio Webhook

This is the most important step - tells Twilio where to send incoming texts.

1. Go to **Phone Numbers → Manage → Active numbers**
2. **Click on your Surv phone number**
3. Scroll to **"Messaging Configuration"** section
4. Under **"A MESSAGE COMES IN"**:
   - **Webhook URL:** `https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/api/v1/sms/webhook`
   - **HTTP Method:** `POST`
   - **Content Type:** `application/x-www-form-urlencoded` (default)

5. **Save** the configuration

**This webhook receives ALL incoming texts and processes technician commands.**

---

## Step 5: Add Credentials to Heroku

Run these commands in PowerShell:

```powershell
# Set Twilio Account SID
heroku config:set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx -a surv-report-gen

# Set Twilio Auth Token
heroku config:set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx -a surv-report-gen

# Set Twilio Phone Number (with country code)
heroku config:set TWILIO_PHONE_NUMBER=+15551234567 -a surv-report-gen
```

**Replace the x's with your actual values from Step 3!**

---

## Step 6: Update SurvApp Code (Uncomment Twilio Integration)

The code is already written but commented out. Uncomment these sections:

### File 1: `surv-backend/app/api/v1/sms_webhook.py`

Find this section (around line 80):
```python
def send_sms_response(to_number: str, message: str):
    """Send SMS response via Twilio"""
    # In production, use Twilio:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # message = client.messages.create(
    #     body=message,
    #     from_=settings.TWILIO_PHONE_NUMBER,
    #     to=to_number
    # )
    print(f"[SMS RESPONSE] To: {to_number}, Message: {message}")
    return {"status": "sent"}
```

**Change to:**
```python
def send_sms_response(to_number: str, message: str):
    """Send SMS response via Twilio"""
    from twilio.rest import Client
    from app.config import settings
    
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    msg = client.messages.create(
        body=message,
        from_=settings.TWILIO_PHONE_NUMBER,
        to=to_number
    )
    return {"status": "sent", "sid": msg.sid}
```

### File 2: `surv-backend/app/api/v1/notifications.py`

Find around line 30:
```python
def send_sms(...):
    # In production, integrate with Twilio:
    # from twilio.rest import Client
    # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    # message = client.messages.create(...)
    
    print(f"[SMS] To: {sms_data.to}, Message: {sms_data.message}")
```

**Change to:**
```python
def send_sms(...):
    from twilio.rest import Client
    from app.config import settings
    
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
```

### File 3: `surv-backend/app/config.py`

Add these environment variables:

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    # Twilio Settings
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    
    class Config:
        env_file = ".env"
```

---

## Step 7: Add Twilio Python Package

Add to `surv-backend/requirements.txt`:

```
twilio==8.10.0
```

Then redeploy:
```powershell
cd C:\Users\jedmc\SurvApp\surv-backend
git add requirements.txt app/config.py app/api/v1/sms_webhook.py app/api/v1/notifications.py
git commit -m "Enable live Twilio SMS integration"
git push heroku master
```

---

## Step 8: Test the Integration

### Test 1: Initialize SMS Thread
1. Login to Surv as admin
2. Go to "Technicians" page
3. Add YOUR phone number to a technician
4. Click "Init SMS"
5. **You should receive a welcome text!**

### Test 2: Send Job Assignment
1. Go to "Send Jobs (SMS)"
2. Select a technician (with your phone)
3. **You should receive the job details via SMS!**

### Test 3: Reply to SMS
1. From your phone, reply: `jobs`
2. You should get list of jobs back
3. Reply: `help`
4. You should get command list

### Test 4: Full Workflow
1. Reply: `clock in`
2. Reply: `omw #1`
3. Customer should get "on my way" text
4. Reply: `start #1`
5. Reply: `done #1`
6. Check admin UI to see timeline!

---

## Twilio Console Quick Links

- **Dashboard:** https://console.twilio.com/
- **Phone Numbers:** https://console.twilio.com/phone-numbers/incoming
- **Message Logs:** https://console.twilio.com/monitor/logs/sms
- **Usage & Billing:** https://console.twilio.com/billing

---

## Twilio Costs

**Free Trial:**
- $15 credit (good for ~500 SMS messages)
- Can only text verified numbers during trial
- Full functionality to test

**Pay-As-You-Go (After Trial):**
- $1.00/month per phone number
- $0.0079 per SMS sent (less than 1 cent)
- $0.0079 per SMS received
- **Typical monthly cost for 10 technicians:** ~$5-10/month

**For 1000 SMS/month:**
- Phone number: $1.00
- Messages: ~$8.00
- **Total: ~$9/month**

Compare to HouseCall Pro: $49-299/user/month

---

## Troubleshooting

### "SMS not sending"
- Check Twilio credentials are set in Heroku: `heroku config -a surv-report-gen`
- Verify webhook URL is set correctly in Twilio console
- Check phone number format includes country code (+1)

### "Webhook not receiving"
- Verify webhook URL exactly matches: `https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/api/v1/sms/webhook`
- Check Heroku logs: `heroku logs --tail -a surv-report-gen`
- Test webhook directly in Twilio console

### "Free trial limitations"
- Can only text verified phone numbers during trial
- Go to Twilio console → Verified Caller IDs
- Add technician numbers there first
- Or upgrade to paid account ($20 minimum)

---

## Quick Setup Checklist

- [ ] Create Twilio account
- [ ] Get phone number with SMS capability
- [ ] Copy Account SID, Auth Token, Phone Number
- [ ] Set webhook URL in Twilio console
- [ ] Add credentials to Heroku config
- [ ] Add `twilio==8.10.0` to requirements.txt
- [ ] Uncomment Twilio code in Python files
- [ ] Update app/config.py with Twilio settings
- [ ] Deploy to Heroku
- [ ] Add technician phone numbers in Surv
- [ ] Initialize SMS threads
- [ ] Test with your own phone first
- [ ] Train technicians on commands

---

## Summary

**What You Need from Twilio:**
1. Account SID (ACxxx...)
2. Auth Token (xxx...)
3. Phone Number (+1555...)

**Where to Set in Heroku:**
```bash
heroku config:set TWILIO_ACCOUNT_SID=... -a surv-report-gen
heroku config:set TWILIO_AUTH_TOKEN=... -a surv-report-gen
heroku config:set TWILIO_PHONE_NUMBER=... -a surv-report-gen
```

**Webhook URL to Set in Twilio:**
```
https://surv-report-gen-d8f9f99b4dc3.herokuapp.com/api/v1/sms/webhook
```

**That's it!** Once these 4 things are configured, technicians can text commands and everything works automatically!










