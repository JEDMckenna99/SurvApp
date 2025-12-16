# Surv - Complete API Requirements
## Third-Party APIs & Services for Full HouseCall Pro Replication

---

## 1. Payment Processing

### Primary: Stripe
**Purpose:** Process credit cards, ACH payments, and manage customer payment methods

**Required APIs:**
- Payment Intents API
- Customers API
- Payment Methods API
- Refunds API
- Webhooks API

**Key Features:**
- Accept Visa, Mastercard, Amex, Discover
- ACH/bank account payments
- Save payment methods securely
- Process refunds and disputes
- Instant payouts (Stripe Instant Payouts)
- 3D Secure authentication
- Subscription billing (for recurring plans)

**Pricing:**
- 2.9% + $0.30 per successful card charge
- 0.8% (capped at $5) for ACH
- Instant payouts: 1% fee

**Setup Requirements:**
- Stripe account (stripe.com/register)
- Business verification
- Bank account for payouts
- API keys (publishable and secret)
- Webhook endpoint configuration

**Documentation:** https://stripe.com/docs/api

**Alternative Options:**
- Square: https://developer.squareup.com/
- PayPal/Braintree: https://developer.paypal.com/braintree/docs
- Authorize.Net: https://developer.authorize.net/

---

## 2. SMS Communications

### Primary: Twilio Programmable SMS
**Purpose:** Send automated SMS notifications and enable two-way text messaging

**Required APIs:**
- Messaging API
- Programmable SMS API
- Phone Numbers API (for provisioning)
- Conversations API (for two-way messaging)

**Key Features:**
- Send SMS to US/Canada/International
- Receive SMS messages
- Delivery status tracking
- Message scheduling
- SMS templates
- Short code and long code support
- MMS support (for images)

**Pricing:**
- $0.0079 per SMS sent (US/Canada)
- Phone number rental: $1-$2/month
- Toll-free numbers: $2/month + $0.0085/message

**Setup Requirements:**
- Twilio account (twilio.com/try-twilio)
- Phone number purchase
- Configure webhook for incoming messages
- Message template approval

**Use Cases in Surv:**
- Job confirmation texts
- Technician en route notifications
- Appointment reminders
- Payment reminders
- Two-way customer communication
- Marketing campaigns

**Documentation:** https://www.twilio.com/docs/sms

**Alternative Options:**
- Vonage (Nexmo): https://developer.vonage.com/messaging/sms/overview
- AWS SNS: https://aws.amazon.com/sns/
- MessageBird: https://www.messagebird.com/

---

## 3. Email Service

### Primary: SendGrid
**Purpose:** Transactional and marketing email delivery

**Required APIs:**
- Mail Send API v3
- Marketing Campaigns API
- Contacts API
- Templates API
- Webhooks API (for tracking opens, clicks)

**Key Features:**
- Transactional emails (invoices, confirmations)
- Marketing campaigns
- Email templates with dynamic content
- Open and click tracking
- Bounce and spam report handling
- Unsubscribe management
- Email validation
- A/B testing
- Scheduling

**Pricing:**
- Free tier: 100 emails/day
- Essentials: $15/month (40,000 emails)
- Pro: $89/month (100,000 emails)

**Setup Requirements:**
- SendGrid account
- Domain verification (SPF, DKIM, DMARC)
- Sender authentication
- API key creation
- Webhook configuration

**Use Cases in Surv:**
- Invoice delivery
- Estimate sending
- Appointment confirmations
- Password reset emails
- Marketing campaigns
- Review requests
- Customer newsletters

**Documentation:** https://docs.sendgrid.com/api-reference

**Alternative Options:**
- AWS SES: https://aws.amazon.com/ses/
- Mailgun: https://www.mailgun.com/
- Postmark: https://postmarkapp.com/

---

## 4. Maps, Geocoding & Routing

### Primary: Google Maps Platform
**Purpose:** Map display, address geocoding, routing, and location services

**Required APIs:**

#### Maps JavaScript API
- Display interactive maps
- Custom markers and overlays
- Real-time location tracking
- Drawing tools

#### Geocoding API
- Convert addresses to coordinates
- Reverse geocoding (coordinates to address)
- Address validation

#### Directions API
- Calculate routes between locations
- Turn-by-turn directions
- Multiple routing options
- Avoid tolls/highways

#### Distance Matrix API
- Calculate travel time and distance
- Multiple origin/destination calculations
- Traffic-aware estimates

#### Places API
- Address autocomplete
- Place search
- Place details

#### Roads API (Optional)
- Snap GPS coordinates to roads
- Speed limits

**Pricing:**
- $200 free credit per month
- Maps JavaScript API: $7 per 1,000 loads
- Geocoding: $5 per 1,000 requests
- Directions: $5 per 1,000 requests
- Distance Matrix: $5 per 1,000 elements
- Places Autocomplete: $2.83 per 1,000 requests

**Setup Requirements:**
- Google Cloud Platform account
- Enable billing
- Enable required APIs
- API key with domain/IP restrictions
- Configure API quotas

**Use Cases in Surv:**
- Display job locations on map
- Technician location tracking
- Route optimization for daily schedule
- Calculate travel time between jobs
- Address autocomplete in forms
- Estimate arrival times for customers
- Mileage tracking

**Documentation:** https://developers.google.com/maps/documentation

**Alternative Options:**
- Mapbox: https://www.mapbox.com/ (often cheaper)
- HERE Maps: https://www.here.com/
- OpenStreetMap (free, requires self-hosting)

---

## 5. Route Optimization

### Option 1: Google Maps Routes API (Preferred)
**Purpose:** Optimize multi-stop routes for technicians

**Features:**
- Multi-waypoint optimization
- Traffic-aware routing
- Time windows
- Vehicle constraints

**Pricing:** Included in Google Maps Platform pricing

### Option 2: Specialized Route Optimization API

**RouteXL** (https://www.routexl.com/)
- Purpose-built for route optimization
- Up to 20 stops on free tier
- Pricing: €0.50 per route optimization

**GraphHopper** (https://www.graphhopper.com/)
- Open-source routing engine
- Route optimization API
- Self-hosting option available
- Pricing: €199/month for 300K requests

**OptimoRoute** (https://optimoroute.com/)
- Advanced route and schedule optimization
- Time windows and service duration
- API integration available
- Pricing: $39/month per user

**Recommended:** Start with Google Maps Routes API, upgrade to specialized service if needed

---

## 6. Voice & Phone System

### Primary: Twilio Voice
**Purpose:** VoIP phone system with call tracking and recording

**Required APIs:**
- Voice API
- Programmable Voice API
- Call Recording API
- Transcription API
- TwiML (XML-based call flow)

**Key Features:**
- Make and receive phone calls
- Call forwarding and routing
- Call recording
- Voicemail
- IVR (Interactive Voice Response)
- Call queuing
- Conference calls
- Call tracking and analytics
- Voicemail transcription

**Pricing:**
- $1/month per phone number
- Incoming calls: $0.0085/minute
- Outgoing calls: $0.013-$0.026/minute
- Recording: $0.0025/minute
- Transcription: $0.05 per minute

**Setup Requirements:**
- Twilio account
- Purchase phone numbers
- Configure TwiML apps
- Set up call forwarding rules
- Webhook endpoints for call events

**Use Cases in Surv:**
- Business phone number for customer calls
- Route calls to appropriate staff
- Record calls for quality assurance
- Voicemail management
- Click-to-call from web interface
- Call logs and history
- Call tracking by campaign/source

**Documentation:** https://www.twilio.com/docs/voice

**Alternative Options:**
- Plivo: https://www.plivo.com/
- Vonage Voice API: https://developer.vonage.com/voice/voice-api/overview
- Bandwidth: https://www.bandwidth.com/
- RingCentral: https://developers.ringcentral.com/

---

## 7. File Storage & CDN

### Primary: AWS S3 + CloudFront
**Purpose:** Store and serve customer files, photos, documents

**Required Services:**
- S3 (Simple Storage Service)
- CloudFront (CDN)
- IAM (access management)

**Key Features:**
- Unlimited storage
- Pre-signed URLs for secure access
- Lifecycle policies (auto-delete old files)
- Versioning
- CDN for fast delivery
- Image resizing/transformation (via Lambda)

**Pricing:**
- S3: $0.023 per GB/month
- Data transfer: First 1GB free, then $0.09/GB
- CloudFront: $0.085 per GB (first 10TB)
- Requests: $0.0004 per 1,000 PUT requests

**Setup Requirements:**
- AWS account
- Create S3 bucket
- Configure CORS
- Set up CloudFront distribution
- IAM user with limited permissions
- Pre-signed URL generation logic

**Use Cases in Surv:**
- Store customer photos and documents
- Before/after job photos
- Invoice PDFs
- Employee profile pictures
- Company branding assets
- Backup exports

**Documentation:** https://docs.aws.amazon.com/s3/

**Alternative Options:**
- Cloudinary: https://cloudinary.com/ (best for images, includes transformations)
- DigitalOcean Spaces: https://www.digitalocean.com/products/spaces
- Backblaze B2: https://www.backblaze.com/b2/cloud-storage.html (cheapest)

---

## 8. Accounting Integration

### Primary: QuickBooks Online API
**Purpose:** Sync customers, invoices, and payments with QuickBooks

**Required APIs:**
- Accounting API
- OAuth 2.0 Authentication
- Customers API
- Invoices API
- Payments API
- Items/Services API

**Key Features:**
- Two-way customer sync
- Invoice synchronization
- Payment recording
- Chart of accounts mapping
- Tax rates
- Customer balance tracking
- Vendor management (for expenses)

**Pricing:**
- Free for developers
- Customers pay for QuickBooks subscription ($30-$200/month)

**Setup Requirements:**
- Intuit Developer account
- Create app in developer portal
- OAuth 2.0 setup
- App listing (for public distribution)
- Webhook configuration

**Authentication:**
- OAuth 2.0 with token refresh
- User must connect their QuickBooks account
- Tokens expire every 100 days

**Use Cases in Surv:**
- Auto-create customers in QuickBooks
- Sync invoices when created
- Record payments in QuickBooks
- Pull chart of accounts for categorization
- Sync tax rates
- Financial reporting

**Documentation:** https://developer.intuit.com/app/developer/qbo/docs/get-started

### Secondary: Xero API
**Purpose:** Alternative to QuickBooks for accounting sync

**Required APIs:**
- Accounting API
- OAuth 2.0 Authentication

**Similar Features to QuickBooks:**
- Customer/contact sync
- Invoice sync
- Payment recording
- Bank reconciliation

**Pricing:** Free API access

**Documentation:** https://developer.xero.com/documentation/

**Recommendation:** Build QuickBooks integration first (larger market share), then Xero as Phase 7 expansion

---

## 9. Document Generation (PDF)

### Option 1: WeasyPrint (Recommended)
**Purpose:** Generate PDF invoices and estimates from HTML

**Type:** Python library (self-hosted, free)

**Features:**
- HTML/CSS to PDF conversion
- High-quality output
- Support for headers/footers
- Page breaks
- Custom fonts

**Pricing:** Free (open-source)

**Installation:**
```bash
pip install weasyprint
```

**Use Cases:**
- Invoice PDFs
- Estimate PDFs
- Report exports
- Work orders

**Documentation:** https://doc.courtbouillon.org/weasyprint/

### Option 2: DocRaptor (Cloud service)
**Purpose:** HTML to PDF API service

**Pricing:**
- $15/month for 125 documents
- $40/month for 500 documents

**Documentation:** https://docraptor.com/

### Option 3: PDFShift
**Purpose:** HTML to PDF conversion API

**Pricing:**
- $19/month for 500 documents

**Documentation:** https://pdfshift.io/

**Recommendation:** Use WeasyPrint (free) initially, switch to cloud service if needed for scaling

---

## 10. Push Notifications (Mobile)

### Primary: Firebase Cloud Messaging (FCM)
**Purpose:** Send push notifications to iOS and Android apps

**Required Services:**
- Firebase Cloud Messaging
- Firebase Console for app configuration
- Device token management

**Key Features:**
- Send notifications to individual devices
- Topic-based messaging (groups)
- Data payloads
- Silent notifications
- Analytics

**Pricing:** Free

**Setup Requirements:**
- Firebase project
- Add Android/iOS apps to project
- Download config files (google-services.json, GoogleService-Info.plist)
- Integrate SDK in React Native app
- Server-side API key for sending notifications

**Use Cases in Surv:**
- New job assignments to technicians
- Job status updates
- Incoming messages
- Payment confirmations
- System alerts

**Documentation:** https://firebase.google.com/docs/cloud-messaging

**Alternative Options:**
- OneSignal: https://onesignal.com/ (easier setup, generous free tier)
- Pusher Beams: https://pusher.com/beams
- AWS SNS Mobile Push: https://docs.aws.amazon.com/sns/

---

## 11. Address Validation

### Primary: Google Address Validation API
**Purpose:** Validate and standardize customer addresses

**Features:**
- Validate address correctness
- Standardize format
- Identify apartment numbers
- Geocoding integration

**Pricing:**
- $5 per 1,000 requests
- Includes $200 monthly credit

**Documentation:** https://developers.google.com/maps/documentation/address-validation

### Alternative: SmartyStreets
**Purpose:** US address validation and autocomplete

**Features:**
- US address validation
- International addresses (190+ countries)
- Autocomplete
- Rooftop geocoding

**Pricing:**
- $35/month for 3,000 lookups
- $99/month for 25,000 lookups

**Documentation:** https://www.smarty.com/docs

### Alternative: USPS Address API (US Only)
**Purpose:** Official USPS address validation

**Pricing:** Free for US addresses

**Documentation:** https://www.usps.com/business/web-tools-apis/

**Recommendation:** Start with Google (already using Maps), add USPS for US validation

---

## 12. Background Jobs & Caching

### Redis (Required)
**Purpose:** Task queue for Celery and caching

**Provider:** Heroku Redis

**Features:**
- Message broker for Celery
- Session storage
- Cache frequently accessed data
- Real-time features (pub/sub)
- Rate limiting

**Pricing (Heroku Redis):**
- Hobby Dev: Free (25MB)
- Mini: $3/month (100MB)
- Premium 0: $15/month (100MB, high availability)
- Premium 1: $50/month (1GB)

**Setup Requirements:**
- Heroku Redis add-on
- Redis client library (redis-py)
- Configure Celery to use Redis

**Use Cases:**
- Queue email sending
- Process SMS in background
- Generate reports asynchronously
- Image processing
- Cache database queries
- Rate limiting API requests

**Documentation:** https://redis.io/documentation

---

## 13. Analytics & Monitoring

### Google Analytics 4 (Optional)
**Purpose:** Track user behavior and conversions

**Pricing:** Free

**Setup:** https://analytics.google.com/

### Sentry (Recommended)
**Purpose:** Error tracking and performance monitoring

**Features:**
- Real-time error tracking
- Stack traces
- User context
- Performance monitoring
- Release tracking

**Pricing:**
- Developer: Free (5K events/month)
- Team: $26/month (50K events)
- Business: $80/month (100K events)

**Setup Requirements:**
- Sentry account
- Install SDK in frontend and backend
- Configure error reporting

**Documentation:** https://docs.sentry.io/

**Use Cases:**
- Track application errors
- Monitor API performance
- Debug production issues
- Alert on critical errors

---

## 14. Calendar Integration (Optional)

### Google Calendar API
**Purpose:** Sync jobs to personal calendars

**Features:**
- Create calendar events
- Update events
- Two-way sync
- Multiple calendar support

**Pricing:** Free

**Setup Requirements:**
- Google Cloud project
- OAuth 2.0 setup
- User consent for calendar access

**Documentation:** https://developers.google.com/calendar/api

### Microsoft Outlook Calendar (Graph API)
**Purpose:** Sync for Outlook/Office 365 users

**Features:** Similar to Google Calendar

**Documentation:** https://learn.microsoft.com/en-us/graph/api/resources/calendar

**Recommendation:** Phase 7 or 8 feature, not critical for MVP

---

## 15. Review & Reputation Management

### Google My Business API
**Purpose:** Read and respond to Google reviews

**Features:**
- Fetch reviews
- Respond to reviews
- Business information

**Pricing:** Free

**Setup:** Google My Business account + API access

**Documentation:** https://developers.google.com/my-business

### Facebook Graph API
**Purpose:** Collect Facebook page reviews

**Pricing:** Free

**Documentation:** https://developers.facebook.com/docs/graph-api/

**Note:** Most review platforms (Yelp, etc.) don't allow API review requests. Focus on Google and Facebook, send direct links to others.

---

## 16. Weather Data (Optional)

### OpenWeatherMap API
**Purpose:** Weather-based scheduling alerts

**Features:**
- Current weather
- 5-day forecast
- Weather alerts
- Historical data

**Pricing:**
- Free: 1,000 calls/day
- Startup: $40/month (100K calls)

**Documentation:** https://openweathermap.org/api

**Use Cases:**
- Alert for rain before outdoor jobs
- Suggest rescheduling
- Display weather in scheduling view

---

## 17. Signature Capture

### Built-in Solution (Recommended)
**Purpose:** Capture digital signatures on mobile

**Library:** react-native-signature-canvas

**Features:**
- Touch/stylus signature capture
- Save as image
- Embed in invoices/work orders

**Pricing:** Free (open-source library)

**Alternative:** DocuSign API (for formal contracts)

---

## API Integration Priority

### Phase 1 (MVP - Weeks 1-6)
1. ✅ JWT Authentication (built-in)
2. ✅ PostgreSQL Database (Heroku)
3. ✅ Redis (Heroku)
4. ✅ AWS S3 (file storage)
5. ✅ SendGrid (email)

### Phase 2 (Weeks 7-12)
6. ✅ Twilio SMS
7. ✅ Google Maps (geocoding, maps)
8. ✅ Firebase Cloud Messaging (push notifications)

### Phase 3 (Weeks 13-18)
9. ✅ Stripe (payments)
10. ✅ WeasyPrint (PDF generation)

### Phase 4 (Weeks 19-24)
11. ✅ Twilio SMS advanced features
12. ✅ SendGrid marketing campaigns
13. ✅ Google Address Validation

### Phase 5 (Weeks 25-28)
14. ✅ Sentry (error tracking)
15. ✅ Google Analytics (optional)

### Phase 6 (Weeks 29-34)
16. ✅ Google Maps Routes API (route optimization)
17. ✅ Twilio Voice (phone system)

### Phase 7 (Weeks 35-40)
18. ✅ QuickBooks Online API
19. ✅ Xero API (optional)
20. ✅ Google Calendar API (optional)

### Phase 8 (Weeks 41-48)
21. ✅ Advanced features and custom integrations
22. ✅ Zapier webhooks
23. ✅ Weather API (optional)

---

## Total API Costs Summary

### One-Time Setup
- Domain registration: $12/year
- SSL Certificate: Free (Heroku includes Let's Encrypt)
- Development tools: $0 (most are free tier)

### Monthly Recurring Costs (Estimated)

**Infrastructure:**
- Heroku: $605/month
- Redis: $15/month (Premium 0)

**APIs (Usage-Based, estimated for moderate volume):**
- Stripe: Variable (2.9% + $0.30 per transaction)
- Twilio SMS: $500/month (5,000 messages)
- Twilio Voice: $300/month (200 hours)
- SendGrid: $90/month (100K emails)
- Google Maps: $200/month (within credit)
- AWS S3: $50/month (500GB storage)
- Sentry: $80/month (100K events)
- Firebase: $0 (free tier sufficient)
- QuickBooks: $0 (customer pays)

**Total: ~$1,840/month**

### Cost Scaling
- At 100 customers: ~$2,000/month
- At 500 customers: ~$3,500/month
- At 1,000 customers: ~$5,500/month

**Note:** Most costs scale with usage. Start with lower tiers and upgrade as needed.

---

## API Security Best Practices

1. **Never commit API keys to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Use Heroku Config Vars for production

2. **Restrict API keys**
   - Google Maps: Restrict to specific domains/IPs
   - Stripe: Use test keys in development
   - Implement key rotation

3. **Validate webhook signatures**
   - Stripe webhooks: Verify signature
   - Twilio webhooks: Validate requests
   - Reject unsigned webhooks

4. **Rate limiting**
   - Implement rate limits on your API
   - Use Redis for rate limiting
   - Prevent API abuse

5. **Monitor API usage**
   - Track API calls and costs
   - Set up billing alerts
   - Log errors and retry logic

---

## Conclusion

This comprehensive list covers all third-party APIs needed to replicate HouseCall Pro functionality in Surv. The phased approach ensures you implement critical APIs first (payments, communication) before adding nice-to-have features (calendar sync, weather).

**Key Recommendations:**
1. Start with Phase 1-3 APIs for MVP
2. Use Stripe for payments (best documentation)
3. Twilio for SMS and Voice (single provider for both)
4. Google Maps for all location services (integrated ecosystem)
5. SendGrid for email (reliable and affordable)
6. Self-host PDF generation with WeasyPrint (cost savings)

**Total API setup time:** Plan for 2-3 weeks to set up accounts, test integrations, and configure webhooks properly.

---

*Document prepared for Surv development team*  
*Last updated: October 16, 2025*

