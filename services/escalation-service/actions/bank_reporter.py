"""
Bank Fraud Reporting Adapter for PayShield AI Escalation Service
Supports filing structured fraud reports to partner financial institutions.
Includes an explicit, transparent Hackathon Mock Adapter.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger("escalation_service.bank_reporter")

class BankFraudReporter:
    def __init__(
        self,
        bank_routing_number: Optional[str] = None,
        gateway_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.bank_routing_number = bank_routing_number or os.getenv("BANK_ROUTING_NUMBER", "121000358")
        self.gateway_url = gateway_url or os.getenv("BANK_API_GATEWAY_URL", "https://api.partnerbank.com/v1/fraud-reporting")
        self.api_key = api_key or os.getenv("BANK_API_KEY", "")
        
        # In-memory store for fraud reports
        self._fraud_reports: Dict[str, Dict[str, Any]] = {}

    async def report_fraud(
        self,
        user_id: str,
        transaction_id: str,
        incident_id: str,
        reason: str,
        risk_score: float,
        evidence_summary: Optional[Dict[str, Any]] = None,
        reported_by: str = "escalation-service",
        mock_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Files a formal fraud report associated with user, transaction, and incident.
        Uses a clearly identified Hackathon Mock Adapter for demonstration.
        """
        now = datetime.now(timezone.utc)
        report_id = f"rpt_frd_{uuid.uuid4().hex[:12]}"
        
        # Bank reference format: BNK-<ROUTING>-<TIMESTAMP>-<HASH>
        bank_ref = f"BNK-{self.bank_routing_number[:4]}-{int(now.timestamp())}-{uuid.uuid4().hex[:6].upper()}"

        report_payload = {
            "report_id": report_id,
            "bank_reference_id": bank_ref,
            "bank_routing_number": self.bank_routing_number,
            "user_id": user_id,
            "transaction_id": transaction_id,
            "incident_id": incident_id,
            "reason": reason,
            "risk_score": risk_score,
            "status": "SUBMITTED",
            "reported_by": reported_by,
            "reported_at": now.isoformat(),
            "evidence_summary": evidence_summary or {},
            "delivery_mode": "MOCK_DEMO_ADAPTER", # Transparently identified
            "acknowledgement": {
                "acknowledged": True,
                "ack_code": f"ACK-SUCCESS-{uuid.uuid4().hex[:4].upper()}",
                "note": "[HACKATHON MOCK] Partner bank fraud intake endpoint simulated successfully."
            }
        }

        # If live gateway URL and real API key exist and mock_mode is False, attempt external dispatch
        if not mock_mode and self.api_key and not self.api_key.startswith("your_"):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(
                        self.gateway_url,
                        json=report_payload,
                        headers={"Authorization": f"Bearer {self.api_key}"}
                    )
                    if resp.status_code in [200, 201]:
                        report_payload["delivery_mode"] = "LIVE_PARTNER_GATEWAY"
                        report_payload["gateway_response"] = resp.json()
            except Exception as e:
                logger.warning(f"Live bank gateway dispatch failed: {e}. Preserving mock acknowledgement.")

        self._fraud_reports[report_id] = report_payload
        logger.info(f"BANK FRAUD REPORT filed: Ref #{bank_ref} for Incident {incident_id}")

        return report_payload

    def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a specific fraud report by ID."""
        return self._fraud_reports.get(report_id)

    def list_reports(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists fraud reports, optionally filtered by user_id."""
        reports = list(self._fraud_reports.values())
        if user_id:
            reports = [r for r in reports if r.get("user_id") == user_id]
        return sorted(reports, key=lambda x: x.get("reported_at", ""), reverse=True)
