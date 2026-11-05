"""
Forensic Evidence Packager for PayShield AI Incident Management
Constructs immutable, tamper-evident forensic packages with SHA-256 integrity verification
and strict credential/secret sanitization.
"""
import json
import hashlib
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger("escalation_service.forensics")

# Sensitive fields to sanitize from forensic export
SENSITIVE_KEYS = {
    "password", "password_hash", "passwordhash", "secret", "answer",
    "answer_hash", "plaintext_answer", "otp", "token", "access_token",
    "refresh_token", "jwt", "private_key", "salt", "cvv", "pin"
}

def sanitize_data(data: Any) -> Any:
    """
    Recursively removes passwords, OTPs, secret answers, and auth tokens.
    """
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if str(k).lower() in SENSITIVE_KEYS:
                cleaned[k] = "[REDACTED_SECURITY_DATA]"
            else:
                cleaned[k] = sanitize_data(v)
        return cleaned
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data

class ForensicPackager:
    def __init__(self):
        # In-memory store for incidents and their forensic packages
        self._incidents: Dict[str, Dict[str, Any]] = {}

    def record_incident(
        self,
        user_id: str,
        transaction_id: Optional[str],
        incident_type: str,
        severity: str,
        risk_score: float,
        trigger_rules: Optional[str] = None,
        source_ip: Optional[str] = None,
        device_info: Optional[Dict[str, Any]] = None,
        failed_attempts: Optional[List[Dict[str, Any]]] = None,
        associated_escalation_id: Optional[str] = None,
        raw_telemetry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Records a security incident and initializes its forensic record.
        """
        now = datetime.now(timezone.utc)
        incident_id = f"inc_{uuid.uuid4().hex[:12]}"

        clean_device = sanitize_data(device_info or {})
        clean_attempts = sanitize_data(failed_attempts or [])
        clean_telemetry = sanitize_data(raw_telemetry or {})

        record = {
            "incident_id": incident_id,
            "user_id": user_id,
            "transaction_id": transaction_id,
            "incident_type": incident_type,
            "severity": severity.upper(),
            "risk_score": float(risk_score),
            "trigger_rules": trigger_rules or "Anomalous Security Pattern",
            "source_ip": source_ip,
            "device_info": clean_device,
            "failed_attempts": clean_attempts,
            "status": "INVESTIGATING",
            "associated_escalation_id": associated_escalation_id,
            "reported_to_bank": False,
            "bank_reference_id": None,
            "created_at": now.isoformat(),
            "resolved_at": None,
            "audit_trail": [
                {
                    "action": "INCIDENT_RECORDED",
                    "timestamp": now.isoformat(),
                    "details": f"Incident logged with severity {severity.upper()} and risk score {risk_score:.2f}"
                }
            ],
            "raw_telemetry": clean_telemetry
        }

        self._incidents[incident_id] = record
        logger.warning(f"INCIDENT LOGGED: #{incident_id} [{severity.upper()}] User {user_id} Risk: {risk_score}")
        return record

    def update_incident_status(
        self,
        incident_id: str,
        status: str,
        note: Optional[str] = None,
        bank_reference_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Updates investigation status (e.g. INVESTIGATING, CONFIRMED_FRAUD, RESOLVED, FALSE_POSITIVE).
        """
        incident = self._incidents.get(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        now = datetime.now(timezone.utc)
        incident["status"] = status.upper()
        if status.upper() in ["RESOLVED", "FALSE_POSITIVE", "CLOSED"]:
            incident["resolved_at"] = now.isoformat()
        if bank_reference_id:
            incident["reported_to_bank"] = True
            incident["bank_reference_id"] = bank_reference_id

        incident["audit_trail"].append({
            "action": f"STATUS_UPDATED_TO_{status.upper()}",
            "timestamp": now.isoformat(),
            "note": note or "Status updated by security service"
        })

        return incident

    def build_forensic_evidence_package(self, incident_id: str) -> Dict[str, Any]:
        """
        Compiles an immutable evidence package with cryptographic SHA-256 fingerprint.
        """
        incident = self._incidents.get(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")

        now = datetime.now(timezone.utc)
        package_id = f"pkg_frn_{uuid.uuid4().hex[:12]}"

        evidence_payload = {
            "evidence_package_id": package_id,
            "package_version": "1.0-psa",
            "incident_id": incident["incident_id"],
            "collected_at": now.isoformat(),
            "incident_overview": {
                "user_id": incident["user_id"],
                "transaction_id": incident["transaction_id"],
                "incident_type": incident["incident_type"],
                "severity": incident["severity"],
                "risk_score": incident["risk_score"],
                "trigger_rules": incident["trigger_rules"],
                "status": incident["status"],
                "created_at": incident["created_at"],
                "resolved_at": incident["resolved_at"]
            },
            "network_and_telemetry": {
                "source_ip": incident["source_ip"],
                "device_info": incident["device_info"],
                "telemetry": incident["raw_telemetry"]
            },
            "verification_challenges": incident["failed_attempts"],
            "escalation_links": {
                "escalation_id": incident.get("associated_escalation_id"),
                "reported_to_bank": incident.get("reported_to_bank"),
                "bank_reference_id": incident.get("bank_reference_id")
            },
            "audit_history": incident["audit_trail"]
        }

        # Compute SHA-256 canonical hash over evidence contents
        canonical_json = json.dumps(evidence_payload, sort_keys=True, separators=(",", ":"))
        evidence_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

        evidence_package = {
            **evidence_payload,
            "cryptographic_seal": {
                "algorithm": "SHA-256",
                "evidence_hash": evidence_hash,
                "tamper_evident": True,
                "sealed_at": now.isoformat()
            }
        }

        # Log packaging event in audit trail
        incident["audit_trail"].append({
            "action": "FORENSIC_PACKAGE_COMPILED",
            "timestamp": now.isoformat(),
            "package_id": package_id,
            "evidence_hash": evidence_hash
        })

        return evidence_package

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves raw incident details."""
        return self._incidents.get(incident_id)

    def list_user_incidents(self, user_id: str) -> List[Dict[str, Any]]:
        """Returns all incidents for a specific user, ordered newest first."""
        user_incidents = [inc for inc in self._incidents.values() if inc.get("user_id") == user_id]
        return sorted(user_incidents, key=lambda x: x.get("created_at", ""), reverse=True)

    def list_all_incidents(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Returns paginated incidents list."""
        all_inc = sorted(self._incidents.values(), key=lambda x: x.get("created_at", ""), reverse=True)
        return all_inc[offset : offset + limit]
