"""
Freeze Manager Action for PayShield AI Escalation Service
Handles 1-hour account freezes, duplicate prevention, User Service integration,
and non-blocking Alert Service dispatch.
"""
import os
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger("escalation_service.freeze_manager")

class FreezeManager:
    def __init__(
        self,
        default_freeze_hours: Optional[float] = None,
        user_service_url: Optional[str] = None,
        alert_service_url: Optional[str] = None,
    ):
        raw_hours = default_freeze_hours or os.getenv("DEFAULT_FREEZE_DURATION_HOURS", "1")
        try:
            self.default_freeze_hours = float(raw_hours)
        except ValueError:
            self.default_freeze_hours = 1.0

        self.user_service_url = (user_service_url or os.getenv("USER_SERVICE_URL", "http://localhost:8001")).rstrip("/")
        self.alert_service_url = (alert_service_url or os.getenv("ALERT_SERVICE_URL", "http://localhost:8005")).rstrip("/")
        
        # Local state store for freezes & audit log
        self._freeze_state: Dict[str, Dict[str, Any]] = {}
        self._escalation_log: List[Dict[str, Any]] = []

    async def freeze_account(
        self,
        user_id: str,
        reason: str,
        incident_id: Optional[str] = None,
        duration_hours: Optional[float] = None,
        requested_by: str = "verification-agent",
        metadata: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Freezes a user account for 1 hour.
        Idempotent: If user is already actively frozen, returns existing freeze record
        to prevent duplicate escalation triggers.
        """
        now = datetime.now(timezone.utc)
        meta = metadata or {}

        # 1. Check if user is already frozen
        existing_freeze = self.get_freeze_status(user_id)
        if existing_freeze.get("is_frozen") and not existing_freeze.get("is_expired"):
            logger.info(f"User {user_id} is already frozen until {existing_freeze.get('frozen_until')}. Skipping duplicate freeze.")
            return {
                "escalation_id": existing_freeze.get("escalation_id"),
                "user_id": user_id,
                "status": "ALREADY_FROZEN",
                "is_frozen": True,
                "frozen_at": existing_freeze.get("frozen_at"),
                "frozen_until": existing_freeze.get("frozen_until"),
                "remaining_seconds": existing_freeze.get("remaining_seconds"),
                "message": "User is already actively frozen",
                "alert_dispatched": False
            }

        # 2. Calculate freeze expiration (1 hour default)
        hours = duration_hours if duration_hours is not None else self.default_freeze_hours
        frozen_until = now + timedelta(hours=hours)
        escalation_id = f"esc_frz_{uuid.uuid4().hex[:12]}"

        # 3. Request User Service to update user freeze status
        user_service_updated = await self._notify_user_service_freeze(
            user_id=user_id,
            is_frozen=True,
            frozen_until=frozen_until.isoformat(),
            reason=reason
        )

        # 4. Save local state
        freeze_record = {
            "escalation_id": escalation_id,
            "user_id": user_id,
            "incident_id": incident_id or f"inc_{uuid.uuid4().hex[:8]}",
            "reason": reason,
            "duration_hours": hours,
            "frozen_at": now.isoformat(),
            "frozen_until": frozen_until.isoformat(),
            "requested_by": requested_by,
            "metadata": meta,
            "user_service_synced": user_service_updated,
            "status": "FROZEN"
        }
        self._freeze_state[user_id] = freeze_record

        # Audit log entry
        audit_entry = {
            "escalation_id": escalation_id,
            "action": "ACCOUNT_FREEZE",
            "user_id": user_id,
            "incident_id": freeze_record["incident_id"],
            "reason": reason,
            "timestamp": now.isoformat(),
            "frozen_until": frozen_until.isoformat(),
            "requested_by": requested_by,
        }
        self._escalation_log.insert(0, audit_entry)
        logger.warning(f"SECURITY ESCALATION: Account {user_id} FROZEN until {frozen_until.isoformat()}. Reason: {reason}")

        # 5. Trigger Alert Service (Fire-and-forget; never block or fail freeze)
        alert_dispatched = await self._trigger_freeze_alert(
            user_id=user_id,
            freeze_record=freeze_record,
            user_email=meta.get("email"),
            user_phone=meta.get("phone_number"),
            device_tokens=meta.get("device_tokens")
        )

        return {
            "escalation_id": escalation_id,
            "user_id": user_id,
            "status": "FROZEN",
            "is_frozen": True,
            "frozen_at": now.isoformat(),
            "frozen_until": frozen_until.isoformat(),
            "duration_hours": hours,
            "remaining_seconds": int((frozen_until - now).total_seconds()),
            "incident_id": freeze_record["incident_id"],
            "user_service_synced": user_service_updated,
            "alert_dispatched": alert_dispatched,
        }

    def get_freeze_status(self, user_id: str) -> Dict[str, Any]:
        """
        Returns active freeze status and remaining time for a user.
        """
        record = self._freeze_state.get(user_id)
        if not record:
            return {
                "user_id": user_id,
                "is_frozen": False,
                "frozen_at": None,
                "frozen_until": None,
                "remaining_seconds": 0,
                "is_expired": True
            }

        frozen_until_dt = datetime.fromisoformat(record["frozen_until"])
        now = datetime.now(timezone.utc)
        is_expired = now >= frozen_until_dt
        remaining = max(0, int((frozen_until_dt - now).total_seconds()))

        return {
            "user_id": user_id,
            "escalation_id": record["escalation_id"],
            "is_frozen": not is_expired and record.get("status") == "FROZEN",
            "status": "EXPIRED" if is_expired else record.get("status"),
            "frozen_at": record["frozen_at"],
            "frozen_until": record["frozen_until"],
            "remaining_seconds": remaining,
            "is_expired": is_expired,
            "incident_id": record.get("incident_id"),
            "reason": record.get("reason"),
        }

    def get_audit_log(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns escalation audit history."""
        if user_id:
            return [x for x in self._escalation_log if x.get("user_id") == user_id]
        return self._escalation_log

    async def _notify_user_service_freeze(
        self,
        user_id: str,
        is_frozen: bool,
        frozen_until: Optional[str],
        reason: str
    ) -> bool:
        """
        Calls DEV 2's User Service PATCH /api/v1/users/{id}/freeze
        Falls back safely if service is not yet deployed.
        """
        url = f"{self.user_service_url}/api/v1/users/{user_id}/freeze"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.patch(
                    url,
                    json={
                        "is_frozen": is_frozen,
                        "frozen_until": frozen_until,
                        "frozen_reason": reason
                    }
                )
                if res.status_code in [200, 204]:
                    return True
                logger.warning(f"User service responded with {res.status_code} for freeze")
                return False
        except Exception as e:
            logger.info(f"User service not reachable ({e}). Maintained in Escalation Service state.")
            return False

    async def _trigger_freeze_alert(
        self,
        user_id: str,
        freeze_record: Dict[str, Any],
        user_email: Optional[str],
        user_phone: Optional[str],
        device_tokens: Optional[List[str]]
    ) -> bool:
        """
        Dispatches account frozen alert to Alert Service (port 8005).
        """
        url = f"{self.alert_service_url}/api/v1/alerts/send"
        payload = {
            "user_id": user_id,
            "event_type": "account_frozen",
            "channels": ["sms", "email", "push"],
            "recipient_email": user_email,
            "recipient_phone": user_phone,
            "device_tokens": device_tokens or [],
            "context": {
                "user_name": f"User {user_id[-6:]}",
                "incident_id": freeze_record["incident_id"],
                "reason": freeze_record["reason"],
                "freeze_duration_hours": freeze_record["duration_hours"],
                "frozen_until": freeze_record["frozen_until"],
            },
            "idempotency_key": f"freeze_alert_{freeze_record['escalation_id']}",
            "mock_mode": False
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, json=payload)
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Could not reach Alert Service to dispatch freeze alert: {e}")
            return False
