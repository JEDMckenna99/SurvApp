from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.api.v1 import auth, customers, jobs, invoices, estimates, time_tracking, recurring_jobs, reports, files, payments, notifications, booking, campaigns, sms_webhook, users, lemma_auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Surv API",
    description="Field Service Management Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "https://surv-report-gen-d8f9f99b4dc3.herokuapp.com",
        "https://lemma.id",  # Lemma IAM authentication
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(estimates.router, prefix="/api/v1")
app.include_router(time_tracking.router, prefix="/api/v1")
app.include_router(recurring_jobs.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(booking.router, prefix="/api/v1")
app.include_router(campaigns.router, prefix="/api/v1")
app.include_router(sms_webhook.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(lemma_auth.router, prefix="/api/v1")


@app.get("/api")
async def api_root():
    return {
        "message": "Surv API is running",
        "version": "1.0.0",
        "app": settings.APP_NAME
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }


# Serve static files (React app)
static_dir = Path(__file__).parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes"""
        # If it's an API route, let it pass through
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        # Check if it's a static file
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Otherwise, serve index.html (SPA fallback)
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return {"message": "Frontend not built yet. Run 'npm run build' in the frontend directory."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)

