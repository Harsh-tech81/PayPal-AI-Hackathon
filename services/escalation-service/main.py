"""
PayShield AI - Escalation & Incident Service
Port: 8006
Responsible for 1-hour account freezes, unfreezes, bank fraud reporting adapter,
incident management, and cryptographic forensic evidence packaging.
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
from .routes.escalations import router as escalations_router
from .routes.incidents import router as incidents_router

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("escalation_service")

app = FastAPI(
    title="PayShield AI — Escalation & Incident Service",
    description="Account security escalation, 1-hour freezes, bank fraud reporting, and forensic evidence packaging.",
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

app.include_router(escalations_router)
app.include_router(incidents_router)

@app.get("/health", tags=["System"])
async def health_check():
    """Service health check endpoint."""
    return {
        "status": "HEALTHY",
        "service": "escalation-service",
        "port": 8006,
        "default_freeze_hours": float(os.getenv("DEFAULT_FREEZE_DURATION_HOURS", "1")),
        "bank_adapter": "MOCK_DEMO_ACTIVE"
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "service": "PayShield AI Escalation & Incident Service",
        "version": "1.0.0",
        "port": 8006,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ESCALATION_SERVICE_PORT", 8006))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
