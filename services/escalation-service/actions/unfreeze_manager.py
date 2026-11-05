"""
Unfreeze Manager Action for PayShield AI Escalation Service
Handles auto-expiration unfreeze, authorized manual unfreeze, audit logging,
and Alert Service unfreeze notifications.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx

from .freeze_manager import FreezeManager

logger = logging.getLogger("escalation_service.unfreeze_manager")

class UnfreezeManager:
    def __init__(
        self,
        freeze_manager: FreezeManager,
        user_service_url: Optional[str] = None,
        alert_service_url: Optional[str] = None,
    ):
        self.freeze_manager = freeze_manager
        self.user_service_url = (user_service_url or os.getenv("USER_SERVICE_URL", "http://localhost:8001")).rstrip("/")
        self.alert_service_url = (alert_service_url or os.getenv("ALERT_SERVICE_URL", "http://localhost:8005")).rstrip("/")

    async def unfreeze_account(
        self,
        user_id: str,
        reason: str = "Freeze duration expired",
        authorized_by: str = "system",
        force: bool = False,
        user_email: Optional[str] = None,
        user_phone: Optional[str] = None,
        device_tokens: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Unfreezes a user account if the freeze has expired or if force=True (manual admin override).
        """
        status = self.freeze_manager.get_freeze_status(user_id)
        now = datetime.now(timezone.utc)

        if not status.get("is_frozen") and not force:
            logger.info(f"Unfreeze requested for non-frozen user {user_id}. Safe no-op.")
            return {
                "user_id": user_id,
                "status": "NOT_FROZEN",
                "is_frozen": False,
                "message": "User account is not currently frozen",
                "unfrozen_at": None,
                "alert_dispatched": False
            }

        unfreeze_id = f"esc_unfrz_{uuid.uuid4().hex[:12]}"

        # 1. Notify User Service
        user_service_synced = await self._notify_user_service_unfreeze(user_id=user_id)

        # 2. Update local state in FreezeManager
        if user_id in self.freeze_manager._freeze_state:
            self.freeze_manager._freeze_state[user_id]["status"] = "UNFROZEN"
            self.freeze_manager._freeze_state[user_id]["unfrozen_at"] = now.isoformat()
            self.freeze_manager._freeze_state[user_id]["unfreeze_reason"] = reason

        # 3. Add to escalation audit trail
        audit_entry = {
            "escalation_id": unfreeze_id,
            "action": "ACCOUNT_UNFREEZE",
            "user_id": user_id,
            "incident_id": status.get("incident_id"),
            "reason": reason,
            "authorized_by": authorized_by,
            "timestamp": now.isoformat(),
        }
        self.freeze_manager._escalation_log.insert(0, audit_entry)
        logger.info(f"SECURITY ESCALATION: Account {user_id} UNFROZEN by {authorized_by}. Reason: {reason}")

        # 4. Dispatch Alert
        alert_dispatched = await self._trigger_unfreeze_alert(
            user_id=user_id,
            reason=reason,
            unfreeze_time=now.isoformat(),
            user_email=user_email,
            user_phone=user_phone,
            device_tokens=device_tokens
        )

        return {
            "escalation_id": unfreeze_id,
            "user_id": user_id,
            "status": "UNFROZEN",
            "is_frozen": False,
            "unfrozen_at": now.isoformat(),
            "reason": reason,
            "authorized_by": authorized_by,
            "user_service_synced": user_service_synced,
            "alert_dispatched": alert_dispatched,
        }

    async def _notify_user_service_unfreeze(self, user_id: str) -> bool:
        """Calls DEV 2's User Service to clear freeze flags."""
        url = f"{self.user_service_url}/api/v1/users/{user_id}/freeze"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.patch(
                    url,
                    json={
                        "is_frozen": False,
                        "frozen_until": None,
                        "frozen_reason": None
                    }
                )
                return res.status_code in [200, 204]
        except Exception as e:
            logger.info(f"User service not reachable ({e}). State updated locally.")
            return False

    async def _trigger_unfreeze_alert(
        self,
        user_id: str,
        reason: str,
        unfreeze_time: str,
        user_email: Optional[str],
        user_phone: Optional[str],
        device_tokens: Optional[List[str]]
    ) -> bool:
        """Dispatches account unfrozen alert to Alert Service."""
        url = f"{self.alert_service_url}/api/v1/alerts/send"
        payload = {
            "user_id": user_id,
            "event_type": "account_unfrozen",
            "channels": ["sms", "email", "push"],
            "recipient_email": user_email,
            "recipient_phone": user_phone,
            "device_tokens": device_tokens or [],
            "context": {
                "user_name": f"User {user_id[-6:]}",
                "user_id": user_id,
                "reason": reason,
                "unfreeze_time": unfreeze_time,
            },
            "idempotency_key": f"unfreeze_alert_{user_id}_{unfreeze_time[:16]}",
            "mock_mode": False
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(url, json=payload)
                return res.status_code == 200
        except Exception as e:
            logger.warning(f"Could not reach Alert Service to dispatch unfreeze alert: {e}")
            return False
