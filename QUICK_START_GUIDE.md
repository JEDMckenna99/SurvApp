# Surv - Quick Start Guide
## Getting Your Development Environment Running

---

## Prerequisites

### Required Software
- **Node.js**: 18+ (https://nodejs.org/)
- **Python**: 3.11+ (https://www.python.org/)
- **PostgreSQL**: 14+ (https://www.postgresql.org/)
- **Redis**: 7+ (https://redis.io/)
- **Git**: Latest version
- **VS Code** or your preferred IDE

### Required Accounts
- [ ] Heroku account (https://signup.heroku.com/)
- [ ] GitHub account (for version control)
- [ ] Stripe account (https://dashboard.stripe.com/register)
- [ ] Twilio account (https://www.twilio.com/try-twilio)
- [ ] SendGrid account (https://signup.sendgrid.com/)
- [ ] Google Cloud Platform account (https://console.cloud.google.com/)
- [ ] AWS account (for S3 storage)

---

## Phase 1: Project Setup (Day 1)

### Step 1: Create Project Repository

```bash
# Create project directory
mkdir surv-app
cd surv-app

# Initialize git repository
git init

# Create main branch
git checkout -b main

# Create project structure
mkdir -p surv-frontend surv-backend
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create repository named `surv-app`
3. Don't initialize with README (we already have a local repo)
4. Copy the remote URL

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/surv-app.git

# Push initial commit
git add .
git commit -m "Initial project structure"
git push -u origin main
```

---

## Phase 2: Backend Setup

### Step 1: Initialize Python Project

```bash
cd surv-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.103.0
uvicorn[standard]==0.23.2
sqlalchemy==2.0.20
alembic==1.11.3
psycopg2-binary==2.9.7
pydantic==2.3.0
pydantic-settings==2.0.3
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
celery==5.3.1
redis==5.0.0
stripe==6.5.0
twilio==8.8.0
sendgrid==6.10.0
boto3==1.28.0
googlemaps==4.10.0
python-dotenv==1.0.0
httpx==0.24.1
sentry-sdk==1.30.0
pytest==7.4.0
pytest-asyncio==0.21.1
EOF

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Create Project Structure

```bash
mkdir -p app/{api/v1,models,schemas,services,tasks,utils,middleware}
touch app/__init__.py
touch app/main.py
touch app/config.py
touch app/database.py
```

### Step 3: Create Basic FastAPI App

Create `app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(
    title="Surv API",
    description="Field Service Management Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Surv API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Create `app/config.py`:

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Surv"
    DEBUG: bool = True
    API_VERSION: str = "v1"
    
    # Database
    DATABASE_URL: str = "postgresql://localhost/surv_dev"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # API Keys (will be set via environment variables)
    STRIPE_SECRET_KEY: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    SENDGRID_API_KEY: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

Create `.env.example`:

```bash
# Database
DATABASE_URL=postgresql://localhost/surv_dev

# Security
SECRET_KEY=change-this-to-a-random-secret-key

# Redis
REDIS_URL=redis://localhost:6379

# Stripe (get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Twilio (get from https://console.twilio.com/)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# SendGrid (get from https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=SG...

# Google Maps (get from https://console.cloud.google.com/)
GOOGLE_MAPS_API_KEY=AIza...

# AWS S3 (get from https://console.aws.amazon.com/iam/)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=surv-files-dev
AWS_REGION=us-east-1
```

Copy to actual .env:
```bash
cp .env.example .env
# Then edit .env with your actual values
```

### Step 4: Setup Database

```bash
# Create PostgreSQL database
# On Windows with PostgreSQL installed:
createdb surv_dev

# On Mac with PostgreSQL:
createdb surv_dev

# Or using psql:
psql -U postgres
CREATE DATABASE surv_dev;
\q
```

Create `app/database.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Convert postgresql:// to postgresql+asyncpg://
DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Dependency for getting DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### Step 5: Initialize Alembic (Database Migrations)

```bash
# Initialize Alembic
alembic init migrations

# Edit alembic.ini - update sqlalchemy.url line to:
# sqlalchemy.url = postgresql://localhost/surv_dev
```

Edit `migrations/env.py` to use our Base:

```python
from app.database import Base
from app.models import *  # Import all models

target_metadata = Base.metadata
```

### Step 6: Run Backend

```bash
# Make sure you're in surv-backend directory
# Make sure virtual environment is activated

# Run the server
uvicorn app.main:app --reload --port 8000

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

Test it:
```bash
# In another terminal
curl http://localhost:8000/
# Should return: {"message": "Surv API is running", "version": "1.0.0"}
```

---

## Phase 3: Frontend Setup

### Step 1: Create React App with TypeScript

```bash
cd ../surv-frontend

# Create React app with TypeScript
npx create-react-app . --template typescript

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/x-date-pickers
npm install @mui/x-data-grid
npm install @reduxjs/toolkit react-redux
npm install react-router-dom
npm install axios
npm install react-hook-form zod @hookform/resolvers
npm install date-fns
npm install react-big-calendar
npm install mapbox-gl react-map-gl
npm install recharts
npm install socket.io-client
npm install react-dropzone
npm install react-toastify
npm install @stripe/react-stripe-js @stripe/stripe-js

# Install dev dependencies
npm install --save-dev @types/react-big-calendar
npm install --save-dev @types/mapbox-gl
```

### Step 2: Create Project Structure

```bash
cd src
mkdir -p {api,components/{common,layout,customers,jobs,schedule},features,hooks,pages/{auth,customers,schedule},routes,store,styles,types,utils}
```

### Step 3: Create API Client

Create `src/api/client.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses (redirect to login)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Step 4: Create Environment Variables

Create `.env.local`:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_GOOGLE_MAPS_API_KEY=AIza...
```

Create `.env.example`:

```bash
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_key
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Step 5: Update App.tsx

Replace `src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store/store';

// Create Surv theme based on branding
const theme = createTheme({
  palette: {
    primary: {
      main: '#0066CC', // Surv blue from logo
      light: '#3399FF',
      dark: '#004499',
    },
    secondary: {
      main: '#00CC66',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <div className="App">
            <h1>Surv - Field Service Management</h1>
            <p>API Status: Check console</p>
          </div>
        </Router>
        <ToastContainer position="top-right" autoClose={3000} />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
```

### Step 6: Create Redux Store

Create `src/store/store.ts`:

```typescript
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Add reducers here as we build features
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Step 7: Run Frontend

```bash
# Make sure you're in surv-frontend directory
npm start

# Should open browser to http://localhost:3000
```

---

## Phase 4: Heroku Setup

### Step 1: Install Heroku CLI

**Windows:**
Download from https://devcenter.heroku.com/articles/heroku-cli

**Mac:**
```bash
brew tap heroku/brew && brew install heroku
```

**Verify installation:**
```bash
heroku --version
```

### Step 2: Login to Heroku

```bash
heroku login
# Opens browser for authentication
```

### Step 3: Create Heroku Apps

```bash
# Create backend API app
heroku create surv-api-staging

# Create frontend app (optional - can use Vercel/Netlify instead)
heroku create surv-web-staging

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0 -a surv-api-staging

# Add Redis
heroku addons:create heroku-redis:premium-0 -a surv-api-staging

# Verify add-ons
heroku addons -a surv-api-staging
```

### Step 4: Configure Backend for Heroku

Create `surv-backend/Procfile`:

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: celery -A app.tasks.celery_app worker --loglevel=info
```

Create `surv-backend/runtime.txt`:

```
python-3.11.5
```

### Step 5: Set Environment Variables

```bash
# Set config vars on Heroku
heroku config:set SECRET_KEY="your-secret-key-here" -a surv-api-staging
heroku config:set DEBUG=False -a surv-api-staging
heroku config:set STRIPE_SECRET_KEY="sk_test_..." -a surv-api-staging
heroku config:set TWILIO_ACCOUNT_SID="AC..." -a surv-api-staging
heroku config:set SENDGRID_API_KEY="SG..." -a surv-api-staging

# View all config vars
heroku config -a surv-api-staging
```

### Step 6: Deploy Backend to Heroku

```bash
cd surv-backend

# Initialize git if not already done
git init

# Add Heroku remote
heroku git:remote -a surv-api-staging

# Deploy
git add .
git commit -m "Initial backend deployment"
git push heroku main

# Run database migrations
heroku run alembic upgrade head -a surv-api-staging

# View logs
heroku logs --tail -a surv-api-staging

# Open app
heroku open -a surv-api-staging
```

---

## Phase 5: Development Workflow

### Daily Development

1. **Start Backend:**
```bash
cd surv-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

2. **Start Frontend:**
```bash
cd surv-frontend
npm start
```

3. **Start Redis (if using locally):**
```bash
redis-server
```

4. **Start Celery Worker (for background tasks):**
```bash
cd surv-backend
celery -A app.tasks.celery_app worker --loglevel=info
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/customer-management

# Make changes, commit often
git add .
git commit -m "Add customer list component"

# Push to GitHub
git push origin feature/customer-management

# Create Pull Request on GitHub
# After review, merge to main

# Deploy to Heroku staging
git checkout main
git pull
git push heroku main
```

### Database Migrations

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "Add customers table"

# Apply migrations locally
alembic upgrade head

# Apply migrations on Heroku
heroku run alembic upgrade head -a surv-api-staging
```

---

## Phase 6: Testing Your Setup

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# API documentation (auto-generated by FastAPI)
# Open in browser:
http://localhost:8000/docs
```

### Test Frontend

1. Open browser to http://localhost:3000
2. Check browser console for errors
3. Verify API connection

### Test Database Connection

```python
# In surv-backend directory
python

>>> from app.database import engine
>>> from sqlalchemy import text
>>> import asyncio
>>> 
>>> async def test_connection():
...     async with engine.connect() as conn:
...         result = await conn.execute(text("SELECT 1"))
...         print(result.scalar())
... 
>>> asyncio.run(test_connection())
# Should print: 1
```

---

## Common Issues & Solutions

### Issue: Module not found errors in Python

**Solution:**
```bash
# Make sure virtual environment is activated
# Reinstall requirements
pip install -r requirements.txt
```

### Issue: Database connection errors

**Solution:**
```bash
# Check PostgreSQL is running
# On Windows: Check Services
# On Mac: brew services list

# Verify database exists
psql -U postgres -l
```

### Issue: CORS errors in browser

**Solution:**
- Check `app/main.py` CORS settings
- Ensure frontend URL is in `allow_origins`
- Clear browser cache

### Issue: React app won't start

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Heroku deployment fails

**Solution:**
```bash
# Check build logs
heroku logs --tail -a surv-api-staging

# Common issues:
# - Missing Procfile
# - Wrong Python version in runtime.txt
# - Missing dependencies in requirements.txt
```

---

## Next Steps

After completing this quick start guide, you should have:

- ✅ Backend API running on http://localhost:8000
- ✅ Frontend React app running on http://localhost:3000
- ✅ PostgreSQL database set up
- ✅ Heroku staging environment configured
- ✅ Git repository connected to GitHub

**Now you're ready to start building features!**

### Recommended First Features to Build:

1. **Authentication System** (Week 1)
   - User registration
   - Login/logout
   - JWT token management
   - Protected routes

2. **Customer Management** (Week 2)
   - Customer list page
   - Add/edit customer form
   - Customer details page
   - Search and filtering

3. **Basic Job Scheduling** (Week 3)
   - Calendar view
   - Create job form
   - Assign to technician
   - Job status updates

### Resources

- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **React Documentation**: https://react.dev/
- **Material-UI**: https://mui.com/
- **Redux Toolkit**: https://redux-toolkit.js.org/
- **Heroku Python Guide**: https://devcenter.heroku.com/articles/getting-started-with-python

---

## Support

For questions or issues:
1. Check the documentation in this repository
2. Review API documentation at `/docs` endpoint
3. Contact the development team

---

*Quick Start Guide for Surv Development*  
*Last updated: October 16, 2025*

