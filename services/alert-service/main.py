"""
PayShield AI - Alert Service
Port: 8005
Responsible for multi-channel notification dispatch (Twilio SMS, SendGrid Email, FCM Push).
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Ensure environment variables are loaded from root .env if present
root_dir = Path(__file__).resolve().parent.parent.parent
env_path = root_dir / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.alerts import router as alerts_router

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("alert_service")

app = FastAPI(
    title="PayShield AI — Alert Service",
    description="Multi-channel notification dispatch service for security events, account freezes, and fraud alerts.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for Next.js frontend (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alerts_router)

@app.get("/health", tags=["System"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": "alert-service",
        "port": 8005,
        "channels": {
            "sms": bool(os.getenv("TWILIO_ACCOUNT_SID")),
            "email": bool(os.getenv("SENDGRID_API_KEY")),
            "push": bool(os.getenv("FIREBASE_PROJECT_ID"))
        }
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "PayShield AI Alert Service",
        "version": "1.0.0",
        "port": 8005,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ALERT_SERVICE_PORT", 8005))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
