"""
Escalation Service REST Routes - Port 8006
Handles account freezes (1-hour auto-expiry), manual unfreezes,
bank fraud reporting adapter, IP blocking, and escalation audit trail.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..actions.freeze_manager import FreezeManager
from ..actions.unfreeze_manager import UnfreezeManager
from ..actions.bank_reporter import BankFraudReporter
from ..actions.ip_blocker import IPBlocker

router = APIRouter(prefix="/api/v1/escalations", tags=["Escalations"])

# Singleton action instances
freeze_mgr = FreezeManager()
unfreeze_mgr = UnfreezeManager(freeze_manager=freeze_mgr)
bank_reporter = BankFraudReporter()
ip_blocker = IPBlocker()

# Request Schemas
class FreezeAccountRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "usr_12345"})
    reason: str = Field(..., json_schema_extra={"example": "Multiple failed secret riddle challenges"})
    incident_id: Optional[str] = None
    duration_hours: Optional[float] = Field(None, description="Override freeze duration in hours (default: 1.0)")
    requested_by: str = Field(default="verification-agent")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata including email, phone, device tokens")
    idempotency_key: Optional[str] = None

class UnfreezeAccountRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "usr_12345"})
    reason: str = Field(default="Security review concluded or expiration reached")
    authorized_by: str = Field(default="system")
    force: bool = Field(default=False, description="Force unfreeze even before 1-hour expiration")
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    device_tokens: Optional[List[str]] = None

class ReportFraudRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "usr_12345"})
    transaction_id: str = Field(..., json_schema_extra={"example": "txn_98765"})
    incident_id: str = Field(..., json_schema_extra={"example": "inc_54321"})
    reason: str = Field(..., json_schema_extra={"example": "Unauthorized payment attempt with high risk score"})
    risk_score: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.95})
    evidence_summary: Dict[str, Any] = Field(default_factory=dict)
    reported_by: str = Field(default="escalation-service")
    mock_mode: bool = Field(default=True, description="Use hackathon demonstration bank adapter")

class BlockIPRequest(BaseModel):
    ip_address: str = Field(..., json_schema_extra={"example": "198.51.100.42"})
    reason: str = Field(..., json_schema_extra={"example": "Rapid brute-force verification challenge attempts"})
    duration_hours: Optional[float] = Field(default=24.0)
    incident_id: Optional[str] = None

@router.post("/freeze", status_code=status.HTTP_200_OK)
async def freeze_account(payload: FreezeAccountRequest):
    """
    Freezes a user's account for one hour following failed verification or suspicious activity.
    Idempotent: Prevents duplicate or redundant escalation requests.
    """
    res = await freeze_mgr.freeze_account(
        user_id=payload.user_id,
        reason=payload.reason,
        incident_id=payload.incident_id,
        duration_hours=payload.duration_hours,
        requested_by=payload.requested_by,
        metadata=payload.metadata,
        idempotency_key=payload.idempotency_key
    )
    return res

@router.post("/unfreeze", status_code=status.HTTP_200_OK)
async def unfreeze_account(payload: UnfreezeAccountRequest):
    """
    Unfreezes account access when protection expires or via authorized manual review.
    """
    res = await unfreeze_mgr.unfreeze_account(
        user_id=payload.user_id,
        reason=payload.reason,
        authorized_by=payload.authorized_by,
        force=payload.force,
        user_email=payload.user_email,
        user_phone=payload.user_phone,
        device_tokens=payload.device_tokens
    )
    return res

@router.get("/freeze-status/{user_id}", status_code=status.HTTP_200_OK)
async def get_freeze_status(user_id: str):
    """Checks real-time account freeze status and remaining time."""
    return freeze_mgr.get_freeze_status(user_id)

@router.post("/report-fraud", status_code=status.HTTP_201_CREATED)
async def report_bank_fraud(payload: ReportFraudRequest):
    """
    Files a suspected bank fraud report using the hackathon mock partner adapter.
    """
    res = await bank_reporter.report_fraud(
        user_id=payload.user_id,
        transaction_id=payload.transaction_id,
        incident_id=payload.incident_id,
        reason=payload.reason,
        risk_score=payload.risk_score,
        evidence_summary=payload.evidence_summary,
        reported_by=payload.reported_by,
        mock_mode=payload.mock_mode
    )
    return res

@router.get("/fraud-reports", status_code=status.HTTP_200_OK)
async def list_fraud_reports(user_id: Optional[str] = Query(None)):
    """Lists fraud reports, optionally filtered by user."""
    return bank_reporter.list_reports(user_id)

@router.get("/history", status_code=status.HTTP_200_OK)
async def get_escalation_history(user_id: Optional[str] = Query(None)):
    """Retrieves escalation audit trail (freeze/unfreeze operations)."""
    return freeze_mgr.get_audit_log(user_id)

@router.post("/block-ip", status_code=status.HTTP_200_OK)
async def block_ip(payload: BlockIPRequest):
    """Blocks an offending IP address with expiration."""
    return ip_blocker.block_ip(
        ip_address=payload.ip_address,
        reason=payload.reason,
        duration_hours=payload.duration_hours,
        incident_id=payload.incident_id
    )

@router.get("/check-ip/{ip_address}", status_code=status.HTTP_200_OK)
async def check_ip(ip_address: str):
    """Checks if an IP address is actively blocked."""
    return ip_blocker.is_ip_blocked(ip_address)

@router.get("/blocked-ips", status_code=status.HTTP_200_OK)
async def list_blocked_ips():
    """Lists currently active blocked IPs."""
    return ip_blocker.list_blocked_ips()
