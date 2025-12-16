# Lemma IAM Integration Guide

This guide explains how to set up and configure Lemma IAM authentication for Surv.

## Overview

Surv uses [Lemma IAM](https://lemma.id) for secure, passwordless authentication:

- **Email-based login** - No passwords to manage or leak
- **Ed25519 cryptographic signatures** - Unforgeable credentials
- **~63µs client-side verification** - 3,000-8,000x faster than traditional auth
- **Privacy-preserving** - OPRF-based revocation, zero tracking

## Setup Steps

### 1. Register Your Site with Lemma

Visit [https://lemma.id](https://lemma.id) and create an account. Then register your site:

```bash
curl -X POST https://lemma.id/api/v1/sites/register \
  -H "Content-Type: application/json" \
  -d '{
    "site_domain": "your-surv-domain.herokuapp.com",
    "company_name": "Your Company",
    "admin_email": "admin@yourcompany.com",
    "plan": "starter"
  }'
```

Save the returned `site_id` and `api_key`.

### 2. Define Permissions

Create permission levels for Surv roles:

```bash
# Admin permission
curl -X POST https://lemma.id/api/v1/sites/YOUR_SITE_ID/permissions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": "surv_admin",
    "display_name": "Administrator",
    "scope": ["*"],
    "description": "Full access to all Surv features"
  }'

# Manager permission
curl -X POST https://lemma.id/api/v1/sites/YOUR_SITE_ID/permissions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": "surv_manager",
    "display_name": "Manager",
    "scope": ["/customers:*", "/jobs:*", "/invoices:*", "/reports:read"],
    "description": "Manage customers, jobs, and invoices"
  }'

# Technician permission
curl -X POST https://lemma.id/api/v1/sites/YOUR_SITE_ID/permissions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": "surv_technician",
    "display_name": "Technician",
    "scope": ["/jobs:read", "/time-tracking:*"],
    "description": "View assigned jobs and clock in/out"
  }'
```

### 3. Configure Heroku Environment

Set the Lemma configuration in Heroku:

```bash
heroku config:set LEMMA_API_KEY=lemma_api_your_key_here
heroku config:set LEMMA_SITE_ID=site_your_site_id_here
```

For the frontend, also set:

```bash
heroku config:set VITE_LEMMA_API_KEY=lemma_api_your_key_here
heroku config:set VITE_LEMMA_SITE_ID=site_your_site_id_here
```

### 4. Deploy

Push the changes to Heroku:

```bash
git push heroku main
```

## How It Works

### Authentication Flow

1. **User enters email** on the login page
2. **Lemma sends confirmation email** with cryptographic challenge
3. **User clicks link** in email
4. **Lemma issues permission credential** (Ed25519 signed)
5. **Credential stored in browser wallet** (AES-256-GCM encrypted)
6. **Backend verifies and issues JWT** for API access

### Verification Architecture

```
User Browser                    Surv Backend                    Lemma API
     │                               │                              │
     │ ─── Request Access ──────────>│                              │
     │                               │ ─── Forward Request ────────>│
     │                               │                              │
     │ <───────────────────── Email Confirmation ──────────────────│
     │                               │                              │
     │ ─── Click Confirmation Link ─────────────────────────────────>│
     │                               │                              │
     │ <─────────────────── Ed25519 Signed Credential ─────────────│
     │                               │                              │
     │ ─── Verify & Get JWT ────────>│                              │
     │                               │ ─── Verify Signature ───────>│
     │                               │ <─── Valid ─────────────────│
     │ <─── JWT Token ──────────────│                              │
     │                               │                              │
     │ ─── API Calls with JWT ──────>│                              │
     │ <─── Protected Data ─────────│                              │
```

### Client-Side Verification (~63µs)

After initial login, access verification happens client-side using WebCrypto API:

```typescript
// Check access (microsecond verification)
const result = await lemmaIAM.verifyAccess('/admin/users', 'read');

if (result.hasAccess) {
  // Show content
}
```

### Background Revocation Checks

Every 5 minutes, the system performs background checks to ensure credentials haven't been revoked:

```typescript
// Automatic background check (handled by SDK)
// Uses OPRF + Bloom filter for privacy-preserving revocation
```

## Role Mapping

Lemma permissions map to Surv roles:

| Lemma Permission | Surv Role | Access Level |
|-----------------|-----------|--------------|
| `surv_admin` | admin | Full access |
| `surv_manager` | manager | Customers, Jobs, Invoices, Reports |
| `surv_technician` | technician | Assigned Jobs, Time Clock |
| `*` | admin | Full access (wildcard) |

## Frontend Components

### Protected Routes

```tsx
import { LemmaAccessGuard } from './components/auth/LemmaAccessGuard';

// Protect admin-only content
<LemmaAccessGuard requiredRoles={['admin']} resource="/admin">
  <AdminDashboard />
</LemmaAccessGuard>

// Protect with fallback
<LemmaAccessGuard 
  requiredRoles={['admin', 'manager']} 
  fallback={<AccessDenied />}
>
  <ReportsPage />
</LemmaAccessGuard>
```

### Access Hooks

```tsx
import { useLemmaAccess, useRoleAccess } from './components/auth/LemmaAccessGuard';

function MyComponent() {
  // Check specific resource
  const { hasAccess, loading } = useLemmaAccess('/customers', 'write');
  
  // Check role only
  const canManage = useRoleAccess(['admin', 'manager']);
  
  if (loading) return <Loading />;
  if (!hasAccess) return <Denied />;
  
  return <Content />;
}
```

### Convenience Guards

```tsx
import { AdminOnly, ManagerOnly } from './components/auth/LemmaAccessGuard';

// Admin-only content
<AdminOnly>
  <SystemSettings />
</AdminOnly>

// Manager and above
<ManagerOnly>
  <RevenueReport />
</ManagerOnly>
```

## Backend Verification

### Dependency Injection

```python
from app.api.v1.lemma_auth import verify_lemma_credentials

@router.get("/protected-resource")
async def get_protected(current_user: User = Depends(get_current_user)):
    # User already verified via JWT
    return {"data": "protected"}
```

### Manual Verification

```python
from app.api.v1.lemma_auth import verify_lemma_credentials

async def check_access(user_did: str, email: str, lemmas: list):
    result = await verify_lemma_credentials(user_did, email, lemmas)
    return result["valid"]
```

## Troubleshooting

### "Lemma not initialized"

Ensure `VITE_LEMMA_API_KEY` and `VITE_LEMMA_SITE_ID` are set in your environment.

### "Failed to load Lemma SDK"

Check that the CDN script is loading:
```html
<script src="https://lemma.id/static/js/lemma-iam-sdk.js"></script>
```

### "Verification failed"

1. Check that the site_id matches your registered site
2. Ensure the user's email domain is allowed
3. Verify API key hasn't expired

### Fallback to Password Auth

If Lemma isn't configured, the system falls back to traditional password authentication. Users can still log in using email/password.

## Security Considerations

1. **Never expose `LEMMA_API_KEY`** in frontend code
2. **Use HTTPS** for all Lemma API calls
3. **Validate all credentials** on backend before issuing JWTs
4. **Implement rate limiting** on auth endpoints
5. **Monitor for unusual** authentication patterns

## Support

- Lemma Documentation: https://lemma.id/docs
- Lemma Support: support@lemma.id
- Surv Issues: GitHub Issues

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| Email request | ~200ms | Network dependent |
| Credential storage | <1ms | Browser localStorage |
| Access verification | ~63µs | WebCrypto API |
| JWT issuance | ~10ms | Backend processing |
| Background check | ~100ms | Every 5 minutes |

Total login time (first time): ~5-10 seconds (email confirmation)
Subsequent access checks: ~63µs (client-side)

