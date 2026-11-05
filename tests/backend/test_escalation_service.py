"""
Unit Tests for Escalation Service (Port 8006)
Covers 1-hour account freeze, duplicate escalation prevention, unfreeze,
bank fraud reporting mock adapter, and IP blocking.
"""
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from services.escalation_service.main import app

client = TestClient(app)

def test_escalation_service_health():
    """Verify health check endpoint returns 200."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["port"] == 8006
    assert data["default_freeze_hours"] == 1.0

def test_account_freeze_and_status():
    """Test freezing an account for 1 hour."""
    user_id = "usr_freeze_test_01"
    payload = {
        "user_id": user_id,
        "reason": "Suspicious login from high-risk location",
        "incident_id": "inc_frz_01",
        "duration_hours": 1.0,
        "requested_by": "verification-agent",
        "metadata": {
            "email": "frozen_user@payshield.ai",
            "phone_number": "+17372508034"
        }
    }
    response = client.post("/api/v1/escalations/freeze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user_id
    assert data["is_frozen"] is True
    assert data["status"] == "FROZEN"
    assert data["duration_hours"] == 1.0
    assert data["remaining_seconds"] > 3500 # ~3600s
    assert "frozen_until" in data

    # Verify freeze status endpoint
    status_res = client.get(f"/api/v1/escalations/freeze-status/{user_id}")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["is_frozen"] is True
    assert status_data["remaining_seconds"] > 0

def test_duplicate_freeze_prevention():
    """Verify that redundant freeze requests for an already frozen account are safely deduplicated."""
    user_id = "usr_freeze_test_02"
    payload = {
        "user_id": user_id,
        "reason": "Verification challenge failure",
        "duration_hours": 1.0
    }
    # Initial freeze
    r1 = client.post("/api/v1/escalations/freeze", json=payload)
    assert r1.status_code == 200
    assert r1.json()["status"] == "FROZEN"

    # Redundant second freeze
    r2 = client.post("/api/v1/escalations/freeze", json=payload)
    assert r2.status_code == 200
    r2_data = r2.json()
    assert r2_data["status"] == "ALREADY_FROZEN"
    assert r2_data["is_frozen"] is True
    assert r2_data["alert_dispatched"] is False # Avoid spamming user

def test_account_unfreeze():
    """Test unfreezing an account."""
    user_id = "usr_unfreeze_test_01"
    # First freeze
    client.post("/api/v1/escalations/freeze", json={"user_id": user_id, "reason": "Test freeze"})

    # Then unfreeze
    unfreeze_res = client.post(
        "/api/v1/escalations/unfreeze",
        json={"user_id": user_id, "reason": "Manual review completed", "authorized_by": "sec_analyst_01"}
    )
    assert unfreeze_res.status_code == 200
    unfreeze_data = unfreeze_res.json()
    assert unfreeze_data["status"] == "UNFROZEN"
    assert unfreeze_data["is_frozen"] is False
    assert unfreeze_data["authorized_by"] == "sec_analyst_01"

    # Verify status is now unfrozen
    status_res = client.get(f"/api/v1/escalations/freeze-status/{user_id}")
    assert status_res.json()["is_frozen"] is False

def test_bank_fraud_reporting_mock():
    """Test bank fraud report filing through the hackathon mock partner adapter."""
    payload = {
        "user_id": "usr_bank_01",
        "transaction_id": "txn_bank_999",
        "incident_id": "inc_bank_456",
        "reason": "Confirmed unauthorized transfer attempt",
        "risk_score": 0.98,
        "evidence_summary": {"source_ip": "198.51.100.99", "failed_questions": 3},
        "mock_mode": True
    }
    response = client.post("/api/v1/escalations/report-fraud", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "SUBMITTED"
    assert data["delivery_mode"] == "MOCK_DEMO_ADAPTER"
    assert "BNK-" in data["bank_reference_id"]
    assert data["acknowledgement"]["acknowledged"] is True

def test_ip_blocking_and_check():
    """Test blocking an IP address and checking block status."""
    ip = "203.0.113.88"
    block_res = client.post(
        "/api/v1/escalations/block-ip",
        json={"ip_address": ip, "reason": "DDoS attempt against challenge endpoint", "duration_hours": 12.0}
    )
    assert block_res.status_code == 200
    assert block_res.json()["is_active"] is True

    # Check status
    check_res = client.get(f"/api/v1/escalations/check-ip/{ip}")
    assert check_res.status_code == 200
    check_data = check_res.json()
    assert check_data["is_blocked"] is True
    assert check_data["remaining_seconds"] > 0
