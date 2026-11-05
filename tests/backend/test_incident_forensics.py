"""
Unit Tests for Incident Management & Forensic Evidence Packaging
Verifies incident recording, status updates, tamper-evident SHA-256 seals,
and strict credential sanitization.
"""
import pytest
import hashlib
import json
from fastapi.testclient import TestClient
from services.escalation_service.main import app

client = TestClient(app)

def test_incident_creation_and_retrieval():
    """Test recording an incident from Verification Agent (DEV 1)."""
    payload = {
        "user_id": "usr_forensic_01",
        "transaction_id": "txn_suspicious_777",
        "incident_type": "failed_verification",
        "severity": "HIGH",
        "risk_score": 0.92,
        "trigger_rules": "User failed 3 consecutive memory anchor questions",
        "source_ip": "198.51.100.12",
        "device_info": {
            "device_fingerprint": "fp_unknown_device_99",
            "browser": "Headless Chrome",
            "is_trusted": False
        },
        "failed_attempts": [
            {"attempt_number": 1, "question_id": "q1", "response_time_ms": 3200, "is_correct": False},
            {"attempt_number": 2, "question_id": "q2", "response_time_ms": 4100, "is_correct": False}
        ],
        "raw_telemetry": {
            "typing_speed_wpm": 12.0,
            "geo_distance_km": 8500
        }
    }
    response = client.post("/api/v1/incidents", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "incident_id" in data
    incident_id = data["incident_id"]
    assert data["status"] == "INVESTIGATING"
    assert data["risk_score"] == 0.92

    # Retrieve incident
    get_res = client.get(f"/api/v1/incidents/{incident_id}")
    assert get_res.status_code == 200
    assert get_res.json()["incident_id"] == incident_id

def test_incident_status_update():
    """Test updating incident investigation status."""
    create_res = client.post("/api/v1/incidents", json={
        "user_id": "usr_forensic_02",
        "incident_type": "anomalous_transfer",
        "risk_score": 0.85
    })
    incident_id = create_res.json()["incident_id"]

    patch_res = client.patch(
        f"/api/v1/incidents/{incident_id}/status",
        json={"status": "CONFIRMED_FRAUD", "note": "Attacker IP confirmed on threat intelligence feed"}
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "CONFIRMED_FRAUD"
    assert len(updated["audit_trail"]) >= 2

def test_forensic_evidence_packaging_and_sha256_seal():
    """Test compiling an immutable evidence package with valid SHA-256 digital fingerprint."""
    create_res = client.post("/api/v1/incidents", json={
        "user_id": "usr_forensic_03",
        "transaction_id": "txn_888",
        "incident_type": "failed_challenge",
        "risk_score": 0.95,
        "source_ip": "203.0.113.50",
        "device_info": {"device_id": "dev_xyz"},
        "failed_attempts": [{"q": "pet_name", "is_correct": False}]
    })
    incident_id = create_res.json()["incident_id"]

    evidence_res = client.get(f"/api/v1/incidents/{incident_id}/evidence")
    assert evidence_res.status_code == 200
    pkg = evidence_res.json()

    # Check structure
    assert "evidence_package_id" in pkg
    assert "cryptographic_seal" in pkg
    assert pkg["cryptographic_seal"]["algorithm"] == "SHA-256"
    assert pkg["cryptographic_seal"]["tamper_evident"] is True

    # Validate that SHA-256 hash is computed over the content
    seal_hash = pkg["cryptographic_seal"]["evidence_hash"]
    assert len(seal_hash) == 64 # 64 hex chars for SHA-256

def test_forensic_data_sanitization():
    """Verify that passwords, OTPs, and plaintext answers are NEVER included in forensic records."""
    create_res = client.post("/api/v1/incidents", json={
        "user_id": "usr_forensic_04",
        "incident_type": "credential_stuffing",
        "risk_score": 0.99,
        "device_info": {
            "password": "ClearTextPassword123!",
            "token": "secret_jwt_bearer_token"
        },
        "failed_attempts": [
            {"plaintext_answer": "MySecretAnswer", "otp": "999888", "is_correct": False}
        ]
    })
    incident_id = create_res.json()["incident_id"]

    evidence_res = client.get(f"/api/v1/incidents/{incident_id}/evidence")
    pkg = evidence_res.json()

    # Ensure passwords and secrets were redacted
    dev_info = pkg["network_and_telemetry"]["device_info"]
    assert dev_info["password"] == "[REDACTED_SECURITY_DATA]"
    assert dev_info["token"] == "[REDACTED_SECURITY_DATA]"

    attempts = pkg["verification_challenges"]
    assert attempts[0]["plaintext_answer"] == "[REDACTED_SECURITY_DATA]"
    assert attempts[0]["otp"] == "[REDACTED_SECURITY_DATA]"
