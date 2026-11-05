"""
Incident Management & Forensic Evidence Routes
Captures security events from Verification Agent (DEV 1) and generates tamper-evident evidence packages.
"""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from ..actions.forensic_packager import ForensicPackager

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents & Forensics"])

forensic_packager = ForensicPackager()

class CreateIncidentRequest(BaseModel):
    user_id: str = Field(..., json_schema_extra={"example": "usr_12345"})
    transaction_id: Optional[str] = Field(None, json_schema_extra={"example": "txn_98765"})
    incident_type: str = Field(..., json_schema_extra={"example": "failed_verification"})
    severity: str = Field(default="HIGH", json_schema_extra={"example": "HIGH"})
    risk_score: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.88})
    trigger_rules: Optional[str] = Field(None, json_schema_extra={"example": "Failed memory anchor secret answer 3 times"})
    source_ip: Optional[str] = Field(None, json_schema_extra={"example": "203.0.113.195"})
    device_info: Dict[str, Any] = Field(default_factory=dict)
    failed_attempts: List[Dict[str, Any]] = Field(default_factory=list)
    associated_escalation_id: Optional[str] = None
    raw_telemetry: Dict[str, Any] = Field(default_factory=dict)

class UpdateStatusRequest(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "CONFIRMED_FRAUD"})
    note: Optional[str] = Field(None, json_schema_extra={"example": "Suspicious foreign IP matched known botnet"})
    bank_reference_id: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_incident(payload: CreateIncidentRequest):
    """
    Records a failed verification or suspicious transaction incident.
    Called by DEV 1 (Verification Agent / Risk Engine).
    """
    record = forensic_packager.record_incident(
        user_id=payload.user_id,
        transaction_id=payload.transaction_id,
        incident_type=payload.incident_type,
        severity=payload.severity,
        risk_score=payload.risk_score,
        trigger_rules=payload.trigger_rules,
        source_ip=payload.source_ip,
        device_info=payload.device_info,
        failed_attempts=payload.failed_attempts,
        associated_escalation_id=payload.associated_escalation_id,
        raw_telemetry=payload.raw_telemetry
    )
    return record

@router.get("/{incident_id}", status_code=status.HTTP_200_OK)
async def get_incident(incident_id: str):
    """Retrieves incident details."""
    incident = forensic_packager.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return incident

@router.get("/user/{user_id}", status_code=status.HTTP_200_OK)
async def get_user_incidents(user_id: str):
    """Retrieves all incidents for a specific user."""
    return forensic_packager.list_user_incidents(user_id)

@router.patch("/{incident_id}/status", status_code=status.HTTP_200_OK)
async def update_status(incident_id: str, payload: UpdateStatusRequest):
    """Updates investigation status of an incident."""
    try:
        updated = forensic_packager.update_incident_status(
            incident_id=incident_id,
            status=payload.status,
            note=payload.note,
            bank_reference_id=payload.bank_reference_id
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{incident_id}/evidence", status_code=status.HTTP_200_OK)
async def get_forensic_evidence(incident_id: str):
    """
    Generates and returns structured, tamper-evident forensic evidence package
    with cryptographic SHA-256 seal and sanitized credentials.
    """
    try:
        package = forensic_packager.build_forensic_evidence_package(incident_id)
        return package
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("", status_code=status.HTTP_200_OK)
async def list_incidents(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Returns paginated list of all recorded incidents."""
    return forensic_packager.list_all_incidents(limit=limit, offset=offset)
