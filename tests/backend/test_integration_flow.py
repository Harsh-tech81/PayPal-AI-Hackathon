"""
End-to-End Integration Tests for Dev 5
Tests the complete multi-service flow:
Verification Failure -> Incident Creation -> Account Freeze (1h) -> Alert Dispatch -> Forensic Packaging -> Account Unfreeze.
"""
import pytest
from fastapi.testclient import TestClient
from services.alert_service.main import app as alert_app
from services.escalation_service.main import app as escalation_app

alert_client = TestClient(alert_app)
escalation_client = TestClient(escalation_app)

def test_full_security_incident_and_escalation_lifecycle():
    """
    Simulates the complete PayShield AI security escalation pipeline:
    1. DEV 1 Verification Agent flags failed challenges.
    2. DEV 5 Escalation Service logs the Incident.
    3. DEV 5 Escalation Service executes a 1-hour Account Freeze.
    4. DEV 5 Alert Service dispatches multi-channel notification (SMS, Email, Push).
    5. DEV 5 Escalation Service files a bank fraud report.
    6. DEV 5 Escalation Service generates a tamper-evident forensic package.
    7. Authorized security personnel unfreezes account when review clears.
    8. Alert Service dispatches restoration notice.
    """
    user_id = "usr_integration_lifecycle_100"
    txn_id = "txn_suspicious_payment_888"

    # Step 1 & 2: DEV 1 Verification Agent posts verification failure incident
    inc_payload = {
        "user_id": user_id,
        "transaction_id": txn_id,
        "incident_type": "failed_verification",
        "severity": "CRITICAL",
        "risk_score": 0.94,
        "trigger_rules": "Timed-out and incorrect memory anchor response",
        "source_ip": "198.51.100.77",
        "device_info": {
            "device_id": "unrecognized_device_01",
            "browser": "Firefox Nightly on Linux"
        },
        "failed_attempts": [
            {"attempt": 1, "prompt": "Childhood pet name", "is_correct": False, "duration_ms": 3800}
        ]
    }
    inc_res = escalation_client.post("/api/v1/incidents", json=inc_payload)
    assert inc_res.status_code == 201
    incident_data = inc_res.json()
    incident_id = incident_data["incident_id"]
    assert incident_data["status"] == "INVESTIGATING"

    # Step 3: Trigger Account Freeze (1 hour)
    freeze_payload = {
        "user_id": user_id,
        "reason": "Exceeded failed verification threshold",
        "incident_id": incident_id,
        "duration_hours": 1.0,
        "requested_by": "verification-agent",
        "metadata": {
            "email": "victim_user@payshield.ai",
            "phone_number": "+17372508034",
            "device_tokens": ["device_push_token_abc"]
        }
    }
    freeze_res = escalation_client.post("/api/v1/escalations/freeze", json=freeze_payload)
    assert freeze_res.status_code == 200
    freeze_data = freeze_res.json()
    assert freeze_data["is_frozen"] is True
    assert freeze_data["status"] == "FROZEN"
    assert freeze_data["duration_hours"] == 1.0
    escalation_id = freeze_data["escalation_id"]

    # Step 4: Dispatch Security Alert via Alert Service
    alert_payload = {
        "user_id": user_id,
        "event_type": "account_frozen",
        "channels": ["sms", "email", "push"],
        "recipient_email": "victim_user@payshield.ai",
        "recipient_phone": "+17372508034",
        "device_tokens": ["device_push_token_abc"],
        "context": {
            "user_name": "Valued User",
            "incident_id": incident_id,
            "reason": "Suspicious login attempt blocked",
            "freeze_duration_hours": 1,
            "frozen_until": freeze_data["frozen_until"],
            "ip_address": "198.51.100.77"
        },
        "idempotency_key": f"idemp_{incident_id}",
        "mock_mode": True
    }
    alert_res = alert_client.post("/api/v1/alerts/send", json=alert_payload)
    assert alert_res.status_code == 200
    alert_data = alert_res.json()
    assert alert_data["status"] == "SENT"
    assert alert_data["channels"]["sms"]["status"] == "SENT"
    assert alert_data["channels"]["email"]["status"] == "SENT"
    assert alert_data["channels"]["push"]["status"] == "SENT"

    # Step 5: Report to partner bank
    bank_payload = {
        "user_id": user_id,
        "transaction_id": txn_id,
        "incident_id": incident_id,
        "reason": "Account hijacked attempt blocked",
        "risk_score": 0.94,
        "evidence_summary": {"source_ip": "198.51.100.77", "escalation_id": escalation_id},
        "mock_mode": True
    }
    bank_res = escalation_client.post("/api/v1/escalations/report-fraud", json=bank_payload)
    assert bank_res.status_code == 201
    bank_data = bank_res.json()
    bank_ref = bank_data["bank_reference_id"]
    assert "BNK-" in bank_ref

    # Update incident with bank ref
    escalation_client.patch(
        f"/api/v1/incidents/{incident_id}/status",
        json={"status": "CONFIRMED_FRAUD", "bank_reference_id": bank_ref}
    )

    # Step 6: Generate tamper-evident forensic evidence package
    evidence_res = escalation_client.get(f"/api/v1/incidents/{incident_id}/evidence")
    assert evidence_res.status_code == 200
    evidence_pkg = evidence_res.json()
    assert evidence_pkg["incident_id"] == incident_id
    assert evidence_pkg["incident_overview"]["status"] == "CONFIRMED_FRAUD"
    assert evidence_pkg["cryptographic_seal"]["algorithm"] == "SHA-256"
    assert len(evidence_pkg["cryptographic_seal"]["evidence_hash"]) == 64

    # Step 7: Authorized Account Unfreeze (Resolution Flow)
    unfreeze_res = escalation_client.post(
        "/api/v1/escalations/unfreeze",
        json={
            "user_id": user_id,
            "reason": "User contacted support and passed live KYC challenge",
            "authorized_by": "compliance_lead_07",
            "force": True
        }
    )
    assert unfreeze_res.status_code == 200
    assert unfreeze_res.json()["is_frozen"] is False
    assert unfreeze_res.json()["status"] == "UNFROZEN"

    # Step 8: Send Unfreeze Notification
    unfreeze_alert = alert_client.post(
        "/api/v1/alerts/send",
        json={
            "user_id": user_id,
            "event_type": "account_unfrozen",
            "channels": ["sms", "email"],
            "recipient_email": "victim_user@payshield.ai",
            "recipient_phone": "+17372508034",
            "context": {"user_name": "Valued User", "reason": "Support verification complete"},
            "mock_mode": True
        }
    )
    assert unfreeze_alert.status_code == 200
    assert unfreeze_alert.json()["status"] == "SENT"

    # Step 9: Final check on escalation history
    history_res = escalation_client.get(f"/api/v1/escalations/history?user_id={user_id}")
    assert history_res.status_code == 200
    history = history_res.json()
    assert len(history) >= 2 # 1 freeze, 1 unfreeze
    actions = [h["action"] for h in history]
    assert "ACCOUNT_FREEZE" in actions
    assert "ACCOUNT_UNFREEZE" in actions
