"""
Alert Service API Routes - Port 8005
Handles multi-channel notifications (SMS, Email, Push) with template rendering,
delivery status tracking, failure recovery, idempotency, and history query.
"""
import os
import uuid
import time
import logging
from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Header, status
from pydantic import BaseModel, Field

from ..channels.sms import TwilioSMSDispatcher
from ..channels.email import SendGridEmailDispatcher
from ..channels.push import FirebasePushDispatcher

logger = logging.getLogger("alert_service.routes")
router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

# Initialize channel dispatchers
sms_dispatcher = TwilioSMSDispatcher()
email_dispatcher = SendGridEmailDispatcher()
push_dispatcher = FirebasePushDispatcher()

# In-memory store for alert history and idempotency tracking
# Can be synced to PostgreSQL / Redis if available
ALERT_HISTORY: List[Dict[str, Any]] = []
IDEMPOTENCY_CACHE: Dict[str, float] = {}
IDEMPOTENCY_WINDOW_SECONDS = 60.0

class AlertChannel(str, Enum):
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"

class SecurityEventType(str, Enum):
    FAILED_VERIFICATION = "failed_verification"
    SUSPICIOUS_TRANSACTION = "suspicious_transaction"
    ACCOUNT_FROZEN = "account_frozen"
    ACCOUNT_UNFROZEN = "account_unfrozen"
    FRAUD_INVESTIGATION_INITIATED = "fraud_investigation_initiated"
    SECURITY_INCIDENT_RESOLVED = "security_incident_resolved"
    CUSTOM = "custom"

# Request Schemas
class SendSMSRequest(BaseModel):
    to_phone: str = Field(..., json_schema_extra={"example": "+17372508034"})
    message: Optional[str] = Field(None, description="Raw message text if not using template")
    event_type: Optional[SecurityEventType] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    mock_mode: bool = False

class SendEmailRequest(BaseModel):
    to_email: str = Field(..., json_schema_extra={"example": "user@example.com"})
    subject: str = Field(..., json_schema_extra={"example": "PayShield Security Alert"})
    template_name: Optional[str] = Field(None, json_schema_extra={"example": "fraud_alert.html"})
    html_content: Optional[str] = None
    plain_text_content: Optional[str] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    mock_mode: bool = False

class SendPushRequest(BaseModel):
    device_tokens: List[str] = Field(..., min_length=1)
    title: str = Field(..., json_schema_extra={"example": "PayShield Security Alert"})
    body: str = Field(..., json_schema_extra={"example": "Anomalous transaction blocked."})
    data: Dict[str, str] = Field(default_factory=dict)
    mock_mode: bool = False

class UnifiedAlertRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "usr_12345"})
    event_type: SecurityEventType = Field(..., json_schema_extra={"example": SecurityEventType.ACCOUNT_FROZEN})
    channels: List[AlertChannel] = Field(
        default=[AlertChannel.SMS, AlertChannel.EMAIL, AlertChannel.PUSH]
    )
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    device_tokens: Optional[List[str]] = None
    context: Dict[str, Any] = Field(default_factory=dict)
    idempotency_key: Optional[str] = None
    mock_mode: bool = False

# Mapping from event type to default templates and subjects
EVENT_CONFIG = {
    SecurityEventType.ACCOUNT_FROZEN: {
        "subject": "URGENT: Your PayShield Account has been Temporarily Frozen",
        "html_template": "account_frozen.html",
        "txt_template": "account_frozen.txt",
        "push_title": "Account Temporarily Frozen",
        "push_body": "PayShield placed your account under 1-hour security protection."
    },
    SecurityEventType.SUSPICIOUS_TRANSACTION: {
        "subject": "PayShield Security Warning: Suspicious Activity Detected",
        "html_template": "fraud_alert.html",
        "txt_template": "fraud_alert.txt",
        "push_title": "Suspicious Activity Detected",
        "push_body": "An anomalous transaction or challenge failure was flagged."
    },
    SecurityEventType.ACCOUNT_UNFROZEN: {
        "subject": "PayShield Security Update: Your Account has been Restored",
        "html_template": "account_unfrozen.html",
        "txt_template": "account_unfrozen.txt",
        "push_title": "Account Access Restored",
        "push_body": "The security freeze on your account has expired."
    },
    SecurityEventType.FRAUD_INVESTIGATION_INITIATED: {
        "subject": "PayShield Notice: Fraud Investigation Initiated",
        "html_template": "investigation_started.html",
        "txt_template": "investigation_started.txt",
        "push_title": "Fraud Investigation Started",
        "push_body": "A formal investigation into recent activity is in progress."
    },
    SecurityEventType.SECURITY_INCIDENT_RESOLVED: {
        "subject": "PayShield Notice: Security Incident Resolved",
        "html_template": "incident_resolved.html",
        "txt_template": "incident_resolved.txt",
        "push_title": "Incident Resolved",
        "push_body": "Your security incident review has concluded."
    },
    SecurityEventType.FAILED_VERIFICATION: {
        "subject": "PayShield Alert: Failed Identity Verification Attempt",
        "html_template": "fraud_alert.html",
        "txt_template": "fraud_alert.txt",
        "push_title": "Verification Challenge Failed",
        "push_body": "A secret challenge or intent verification was answered incorrectly."
    }
}

@router.post("/send", status_code=status.HTTP_200_OK)
async def send_unified_alert(payload: UnifiedAlertRequest):
    """
    Unified multi-channel alert dispatcher.
    Sends alerts via configured channels (SMS, Email, Push) with template rendering,
    idempotency checks, and delivery tracking.
    """
    # 1. Idempotency Check
    if payload.idempotency_key:
        now = time.time()
        last_sent = IDEMPOTENCY_CACHE.get(payload.idempotency_key)
        if last_sent and (now - last_sent) < IDEMPOTENCY_WINDOW_SECONDS:
            logger.info(f"Duplicate alert suppressed for idempotency_key: {payload.idempotency_key}")
            return {
                "alert_id": f"suppressed_{payload.idempotency_key}",
                "status": "SUPPRESSED_DUPLICATE",
                "message": "Duplicate alert suppressed within cooldown window",
                "channels": {}
            }
        IDEMPOTENCY_CACHE[payload.idempotency_key] = now

    alert_id = f"alt_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    # 2. Prepare Context & Templates
    cfg = EVENT_CONFIG.get(payload.event_type, {
        "subject": "PayShield AI Security Notice",
        "html_template": "fraud_alert.html",
        "txt_template": "fraud_alert.txt",
        "push_title": "Security Notice",
        "push_body": "A security event occurred on your account."
    })

    ctx = dict(payload.context)
    ctx.setdefault("user_name", "PayShield User")
    ctx.setdefault("incident_id", ctx.get("incident_id", f"inc_{uuid.uuid4().hex[:8]}"))
    ctx.setdefault("timestamp", created_at)

    channel_results = {}
    overall_sent = False

    # 3. Dispatch SMS
    if AlertChannel.SMS in payload.channels:
        phone = payload.recipient_phone or ctx.get("phone_number")
        if phone:
            msg_text = email_dispatcher.render_template(cfg["txt_template"], ctx)
            sms_res = await sms_dispatcher.send_sms(
                to_phone=phone,
                message_body=msg_text,
                mock_override=payload.mock_mode
            )
            channel_results["sms"] = sms_res
            if sms_res.get("status") == "SENT":
                overall_sent = True
        else:
            channel_results["sms"] = {"status": "SKIPPED", "reason": "No recipient phone number provided"}

    # 4. Dispatch Email
    if AlertChannel.EMAIL in payload.channels:
        email = payload.recipient_email or ctx.get("email")
        if email:
            html = email_dispatcher.render_template(cfg["html_template"], ctx)
            txt = email_dispatcher.render_template(cfg["txt_template"], ctx)
            email_res = await email_dispatcher.send_email(
                to_email=email,
                subject=cfg["subject"],
                html_content=html,
                plain_text_content=txt,
                mock_override=payload.mock_mode
            )
            channel_results["email"] = email_res
            if email_res.get("status") == "SENT":
                overall_sent = True
        else:
            channel_results["email"] = {"status": "SKIPPED", "reason": "No recipient email provided"}

    # 5. Dispatch Push Notification
    if AlertChannel.PUSH in payload.channels:
        tokens = payload.device_tokens or ctx.get("device_tokens", [])
        if tokens:
            push_res = await push_dispatcher.send_push_notification(
                device_tokens=tokens,
                title=cfg["push_title"],
                body=cfg["push_body"],
                data={"incident_id": str(ctx.get("incident_id")), "event_type": payload.event_type.value},
                mock_override=payload.mock_mode
            )
            channel_results["push"] = push_res
            if push_res.get("status") == "SENT":
                overall_sent = True
        else:
            channel_results["push"] = {"status": "SKIPPED", "reason": "No device tokens provided"}

    final_status = "SENT" if overall_sent else ("FAILED" if any(r.get("status") == "FAILED" for r in channel_results.values()) else "SKIPPED")

    # 6. Record in History
    log_record = {
        "alert_id": alert_id,
        "user_id": payload.user_id,
        "event_type": payload.event_type.value,
        "status": final_status,
        "channel_results": channel_results,
        "created_at": created_at,
        "incident_id": ctx.get("incident_id")
    }
    ALERT_HISTORY.insert(0, log_record)

    return {
        "alert_id": alert_id,
        "user_id": payload.user_id,
        "event_type": payload.event_type.value,
        "status": final_status,
        "channels": channel_results,
        "created_at": created_at
    }

@router.post("/sms", status_code=status.HTTP_200_OK)
async def send_direct_sms(payload: SendSMSRequest):
    """Direct SMS dispatch endpoint."""
    body = payload.message
    if not body and payload.event_type:
        cfg = EVENT_CONFIG.get(payload.event_type, {})
        body = email_dispatcher.render_template(cfg.get("txt_template", "fraud_alert.txt"), payload.context)
    
    if not body:
        body = "PayShield AI Security Notice: Please verify recent activity on your account."

    res = await sms_dispatcher.send_sms(
        to_phone=payload.to_phone,
        message_body=body,
        mock_override=payload.mock_mode
    )
    return res

@router.post("/email", status_code=status.HTTP_200_OK)
async def send_direct_email(payload: SendEmailRequest):
    """Direct Email dispatch endpoint."""
    html = payload.html_content
    txt = payload.plain_text_content

    if not html and payload.template_name:
        html = email_dispatcher.render_template(payload.template_name, payload.context)
    if not html:
        html = f"<p>{payload.subject}</p>"

    res = await email_dispatcher.send_email(
        to_email=payload.to_email,
        subject=payload.subject,
        html_content=html,
        plain_text_content=txt,
        mock_override=payload.mock_mode
    )
    return res

@router.post("/push", status_code=status.HTTP_200_OK)
async def send_direct_push(payload: SendPushRequest):
    """Direct FCM push notification endpoint."""
    res = await push_dispatcher.send_push_notification(
        device_tokens=payload.device_tokens,
        title=payload.title,
        body=payload.body,
        data=payload.data,
        mock_override=payload.mock_mode
    )
    return res

@router.get("/history", status_code=status.HTTP_200_OK)
async def get_alert_history(
    user_id: Optional[str] = Query(None, description="Filter by User ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by status (SENT, FAILED, SKIPPED)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Query notification history with filters."""
    filtered = ALERT_HISTORY
    if user_id:
        filtered = [x for x in filtered if x.get("user_id") == user_id]
    if event_type:
        filtered = [x for x in filtered if x.get("event_type") == event_type]
    if status:
        filtered = [x for x in filtered if x.get("status") == status]

    total = len(filtered)
    items = filtered[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items
    }

@router.get("/{alert_id}/status", status_code=status.HTTP_200_OK)
async def get_alert_status(alert_id: str):
    """Get delivery status of a specific alert."""
    for alert in ALERT_HISTORY:
        if alert.get("alert_id") == alert_id:
            return alert
    raise HTTPException(status_code=404, detail=f"Alert ID {alert_id} not found")
