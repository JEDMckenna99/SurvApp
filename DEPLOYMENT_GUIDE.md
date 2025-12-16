# Surv - Heroku Deployment Guide

## Prerequisites

Before deploying, you need:
- [ ] Heroku account (free at https://signup.heroku.com/)
- [ ] Heroku CLI installed
- [ ] Git installed

---

## Step-by-Step Deployment

### Part 1: Install Heroku CLI

**Windows:**
Download from: https://devcenter.heroku.com/articles/heroku-cli

**Verify Installation:**
```powershell
heroku --version
```

### Part 2: Login to Heroku

```powershell
heroku login
```

This will open your browser for authentication.

### Part 3: Deploy Backend API

#### 1. Create Heroku App

```powershell
cd surv-backend

# Login to Heroku (if not already)
heroku login

# Create app (replace 'your-surv-api' with your preferred name)
heroku create your-surv-api

# Add PostgreSQL database
heroku addons:create heroku-postgresql:mini -a your-surv-api

# Check your app URL
heroku apps:info -a your-surv-api
```

#### 2. Set Environment Variables

```powershell
# Set secret key (generate a secure random key)
heroku config:set SECRET_KEY="your-very-secure-random-secret-key-min-32-chars" -a your-surv-api

# Set other config
heroku config:set DEBUG=False -a your-surv-api
heroku config:set JWT_ALGORITHM=HS256 -a your-surv-api
heroku config:set ACCESS_TOKEN_EXPIRE_MINUTES=1440 -a your-surv-api

# View all config vars
heroku config -a your-surv-api
```

#### 3. Initialize Git and Deploy

```powershell
# Initialize git repository (if not already done)
git init

# Add Heroku remote
heroku git:remote -a your-surv-api

# Add files
git add .
git commit -m "Initial deployment to Heroku"

# Deploy!
git push heroku main
```

#### 4. Create Database Tables

```powershell
# Run init script on Heroku
heroku run python init_db.py -a your-surv-api

# Create test data
heroku run python create_test_data.py -a your-surv-api
```

#### 5. Verify Deployment

```powershell
# Open your API
heroku open -a your-surv-api

# View logs
heroku logs --tail -a your-surv-api
```

Your API should be live at: `https://your-surv-api.herokuapp.com`

### Part 4: Deploy Frontend

#### Option A: Deploy to Vercel (Recommended - Easiest)

1. Go to https://vercel.com/signup
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your `surv-frontend` repository
5. Set environment variables:
   - `VITE_API_URL` = `https://your-surv-api.herokuapp.com`
6. Click "Deploy"

Your frontend will be live at: `https://your-surv.vercel.app`

#### Option B: Deploy to Netlify

1. Go to https://app.netlify.com/signup
2. Sign up with GitHub
3. Click "Add new site"
4. Import your `surv-frontend` repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Environment variables:
   - `VITE_API_URL` = `https://your-surv-api.herokuapp.com`
7. Click "Deploy"

#### Option C: Deploy Frontend to Heroku (Static Site)

```powershell
cd surv-frontend

# Build the app
npm run build

# Create a simple static server
# Create package.json for server
```

---

## Quick Deployment Commands

### Deploy Backend to Heroku

```powershell
cd C:\Users\jedmc\SurvApp\surv-backend

# Initialize git if needed
git init

# Create Heroku app
heroku create

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SECRET_KEY="$(openssl rand -hex 32)"
heroku config:set DEBUG=False

# Deploy
git add .
git commit -m "Deploy Surv backend"
git push heroku main

# Initialize database
heroku run python init_db.py
heroku run python create_test_data.py

# Open your app
heroku open
```

---

## Environment Variables Reference

### Backend (Heroku Config Vars)

**Required:**
- `DATABASE_URL` - (Auto-set by Heroku PostgreSQL)
- `SECRET_KEY` - Random secure key for JWT signing

**Optional:**
- `DEBUG` - Set to `False` for production
- `JWT_ALGORITHM` - Default: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Default: `1440`

### Frontend Environment Variables

**Required:**
- `VITE_API_URL` - Your Heroku backend URL

---

## Post-Deployment Checklist

After deploying:

- [ ] Backend API is accessible
- [ ] `/health` endpoint returns healthy
- [ ] `/docs` shows Swagger UI
- [ ] Database tables created
- [ ] Test users exist
- [ ] Frontend loads
- [ ] Frontend can connect to backend API
- [ ] Login works
- [ ] Can create customers
- [ ] Can create jobs

---

## Troubleshooting

### Backend deployment fails

```powershell
# Check logs
heroku logs --tail -a your-app-name

# Common issues:
# - Missing Procfile (already created ✓)
# - Wrong Python version in runtime.txt (already set ✓)
# - Missing dependencies (requirements.txt complete ✓)
```

### Database not initialized

```powershell
# Manually run database init
heroku run python init_db.py -a your-app-name
heroku run python create_test_data.py -a your-app-name
```

### Frontend can't connect to backend

- Check `VITE_API_URL` environment variable
- Ensure CORS is configured in backend (already done ✓)
- Verify backend URL is correct

---

## Monitoring Your Deployment

```powershell
# View logs
heroku logs --tail -a your-app-name

# Check dyno status
heroku ps -a your-app-name

# View config
heroku config -a your-app-name

# Open app
heroku open -a your-app-name
```

---

## Scaling

### Free Tier
- Good for testing and small teams
- 550-1000 dyno hours/month free

### Paid Tier (Production)
```powershell
# Upgrade dyno type
heroku ps:scale web=1:basic -a your-app-name

# Scale to multiple dynos
heroku ps:scale web=2 -a your-app-name
```

---

## Cost Estimate

### Minimal Deployment (Testing)
- Hobby dyno: Free
- PostgreSQL Mini: $9/month
- **Total: $9/month**

### Production Deployment
- Basic dyno: $7/month
- PostgreSQL Standard-0: $50/month
- **Total: $57/month**

### High-Scale Deployment
- Standard dynos (2x): $50/month
- PostgreSQL Standard-4: $200/month
- **Total: $250/month**

**Still 90% cheaper than HouseCall Pro!**

---

*Ready to deploy? Run the commands above or let me know if you need help!*

