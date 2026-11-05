"""
Unit Tests for Alert Service (Port 8005)
Covers SMS, Email, Push dispatch, template rendering, retry logic,
idempotency, and history querying.
"""
import pytest
import os
from fastapi.testclient import TestClient
from services.alert_service.main import app
from services.alert_service.channels.sms import TwilioSMSDispatcher
from services.alert_service.channels.email import SendGridEmailDispatcher
from services.alert_service.channels.push import FirebasePushDispatcher

client = TestClient(app)

def test_alert_service_health():
    """Verify health check endpoint returns 200 and channel availability."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["port"] == 8005
    assert "channels" in data

@pytest.mark.asyncio
async def test_sms_mock_dispatch():
    """Test SMS dispatch in mock mode."""
    dispatcher = TwilioSMSDispatcher(account_sid="AC_mock", auth_token="mock_token", from_number="+18005550199")
    res = await dispatcher.send_sms(to_phone="+17372508034", message_body="Test PayShield Alert", mock_override=True)
    assert res["status"] == "SENT"
    assert res["channel"] == "sms"
    assert res["mode"] == "mock"
    assert res["provider_id"] is not None

@pytest.mark.asyncio
async def test_sms_missing_recipient():
    """Test SMS dispatch failure when recipient phone is empty."""
    dispatcher = TwilioSMSDispatcher()
    res = await dispatcher.send_sms(to_phone="", message_body="Test alert")
    assert res["status"] == "FAILED"
    assert "required" in res["error"]

@pytest.mark.asyncio
async def test_email_template_rendering_and_dispatch():
    """Test Email dispatch with Jinja2 template rendering."""
    dispatcher = SendGridEmailDispatcher(api_key="SG.mock_key")
    rendered_html = dispatcher.render_template(
        "account_frozen.html",
        {"user_name": "Alice Smith", "incident_id": "inc_test_01", "frozen_until": "2026-11-05T19:30:00Z"}
    )
    assert "Account Temporarily Frozen" in rendered_html
    assert "Alice Smith" in rendered_html
    assert "inc_test_01" in rendered_html

    # Test send in mock mode
    res = await dispatcher.send_email(
        to_email="alice@example.com",
        subject="Account Frozen",
        html_content=rendered_html,
        mock_override=True
    )
    assert res["status"] == "SENT"
    assert res["channel"] == "email"
    assert res["recipient"] == "alice@example.com"

@pytest.mark.asyncio
async def test_push_notification_dispatch():
    """Test FCM push dispatch for multiple tokens."""
    dispatcher = FirebasePushDispatcher()
    tokens = ["token_device_a", "token_device_b"]
    res = await dispatcher.send_push_notification(
        device_tokens=tokens,
        title="Security Alert",
        body="Suspicious login blocked",
        mock_override=True
    )
    assert res["status"] == "SENT"
    assert res["channel"] == "push"
    assert res["success_count"] == 2

def test_unified_alert_send_endpoint():
    """Test POST /api/v1/alerts/send multi-channel dispatch."""
    payload = {
        "user_id": "usr_9901",
        "event_type": "account_frozen",
        "channels": ["sms", "email", "push"],
        "recipient_email": "security_test@payshield.ai",
        "recipient_phone": "+17372508034",
        "device_tokens": ["fcm_token_test_123"],
        "context": {
            "user_name": "Test User",
            "incident_id": "inc_unified_99",
            "reason": "3 consecutive failed verification attempts",
            "frozen_until": "2026-11-05T20:00:00Z"
        },
        "idempotency_key": "idemp_test_unique_001",
        "mock_mode": True
    }
    response = client.post("/api/v1/alerts/send", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SENT"
    assert data["user_id"] == "usr_9901"
    assert "sms" in data["channels"]
    assert "email" in data["channels"]
    assert "push" in data["channels"]
    assert data["channels"]["sms"]["status"] == "SENT"
    assert data["channels"]["email"]["status"] == "SENT"
    assert data["channels"]["push"]["status"] == "SENT"

def test_alert_idempotency_duplicate_suppression():
    """Verify that identical alerts within the cooldown window are suppressed."""
    payload = {
        "user_id": "usr_9902",
        "event_type": "suspicious_transaction",
        "channels": ["email"],
        "recipient_email": "dup@payshield.ai",
        "context": {"incident_id": "inc_dup_1"},
        "idempotency_key": "idemp_duplicate_test_key",
        "mock_mode": True
    }
    # First request succeeds
    r1 = client.post("/api/v1/alerts/send", json=payload)
    assert r1.status_code == 200
    assert r1.json()["status"] == "SENT"

    # Immediate second request with same key is suppressed
    r2 = client.post("/api/v1/alerts/send", json=payload)
    assert r2.status_code == 200
    assert r2.json()["status"] == "SUPPRESSED_DUPLICATE"

def test_alert_history_and_status():
    """Verify notification history and delivery status queries."""
    hist_res = client.get("/api/v1/alerts/history?limit=10")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert history["total"] >= 1
    assert len(history["items"]) > 0

    alert_id = history["items"][0]["alert_id"]
    status_res = client.get(f"/api/v1/alerts/{alert_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["alert_id"] == alert_id
