"""
IP Blocker Action for PayShield AI Escalation Service
Maintains blocked IP lists with expiration and reason tracking.
Matches Prisma schema: BlockedIp (id, ip_address, reason, blocked_at, expires_at)
"""
import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger("escalation_service.ip_blocker")

class IPBlocker:
    def __init__(self, default_block_hours: float = 24.0):
        self.default_block_hours = default_block_hours
        self._blocked_ips: Dict[str, Dict[str, Any]] = {}

    def block_ip(
        self,
        ip_address: str,
        reason: str,
        duration_hours: Optional[float] = None,
        incident_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Blocks an IP address for a specified duration."""
        if not ip_address:
            raise ValueError("IP address is required")

        now = datetime.now(timezone.utc)
        hours = duration_hours if duration_hours is not None else self.default_block_hours
        expires_at = now + timedelta(hours=hours)
        block_id = f"blk_{uuid.uuid4().hex[:12]}"

        record = {
            "id": block_id,
            "ip_address": ip_address,
            "reason": reason,
            "incident_id": incident_id,
            "blocked_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "duration_hours": hours,
            "is_active": True
        }
        self._blocked_ips[ip_address] = record
        logger.warning(f"IP BLOCKED: {ip_address} until {expires_at.isoformat()}. Reason: {reason}")
        return record

    def is_ip_blocked(self, ip_address: str) -> Dict[str, Any]:
        """Checks if an IP address is currently blocked."""
        record = self._blocked_ips.get(ip_address)
        if not record:
            return {"ip_address": ip_address, "is_blocked": False}

        expires_dt = datetime.fromisoformat(record["expires_at"])
        now = datetime.now(timezone.utc)
        if now >= expires_dt:
            record["is_active"] = False
            return {"ip_address": ip_address, "is_blocked": False, "expired": True}

        remaining_seconds = int((expires_dt - now).total_seconds())
        return {
            "ip_address": ip_address,
            "is_blocked": True,
            "reason": record["reason"],
            "blocked_at": record["blocked_at"],
            "expires_at": record["expires_at"],
            "remaining_seconds": remaining_seconds,
            "incident_id": record.get("incident_id")
        }

    def unblock_ip(self, ip_address: str, reason: str = "Manual admin unblock") -> Dict[str, Any]:
        """Removes an active block on an IP."""
        if ip_address in self._blocked_ips:
            record = self._blocked_ips.pop(ip_address)
            record["is_active"] = False
            record["unblocked_at"] = datetime.now(timezone.utc).isoformat()
            record["unblock_reason"] = reason
            return {"ip_address": ip_address, "unblocked": True, "record": record}
        return {"ip_address": ip_address, "unblocked": False, "message": "IP was not blocked"}

    def list_blocked_ips(self) -> List[Dict[str, Any]]:
        """Returns all currently active blocked IPs."""
        now = datetime.now(timezone.utc)
        active = []
        for record in self._blocked_ips.values():
            expires_dt = datetime.fromisoformat(record["expires_at"])
            if now < expires_dt:
                active.append(record)
        return active
