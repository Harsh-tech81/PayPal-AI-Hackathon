"""
Twilio SMS Channel Dispatcher for PayShield AI Alert Service
"""
import os
import logging
import asyncio
from typing import Optional, Dict, Any

logger = logging.getLogger("alert_service.sms")

class TwilioSMSDispatcher:
    def __init__(
        self,
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        from_number: Optional[str] = None,
        max_retries: int = 3,
        base_backoff: float = 0.5,
    ):
        self.account_sid = account_sid or os.getenv("TWILIO_ACCOUNT_SID", "")
        self.auth_token = auth_token or os.getenv("TWILIO_AUTH_TOKEN", "")
        self.from_number = from_number or os.getenv("TWILIO_PHONE_NUMBER", "")
        self.max_retries = max_retries
        self.base_backoff = base_backoff
        self._client = None
        
        self.is_configured = bool(
            self.account_sid 
            and self.auth_token 
            and self.from_number 
            and not self.account_sid.startswith("AC_your")
        )
        
        if self.is_configured:
            try:
                from twilio.rest import Client
                self._client = Client(self.account_sid, self.auth_token)
                logger.info("Twilio SMS Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Twilio client: {e}. Falling back to mock dispatch.")
                self.is_configured = False

    async def send_sms(
        self, 
        to_phone: str, 
        message_body: str,
        mock_override: bool = False
    ) -> Dict[str, Any]:
        """
        Sends an SMS with retry logic and error tracking.
        """
        if not to_phone:
            return {
                "channel": "sms",
                "status": "FAILED",
                "recipient": to_phone,
                "error": "Recipient phone number is required"
            }

        if mock_override or not self.is_configured or not self._client:
            logger.info(f"[MOCK SMS] To: {to_phone} | Msg: {message_body[:60]}...")
            return {
                "channel": "sms",
                "status": "SENT",
                "recipient": to_phone,
                "provider_id": f"mock_sms_{os.urandom(6).hex()}",
                "mode": "mock",
                "error": None
            }

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                # Twilio Python client is synchronous, so run in thread pool
                loop = asyncio.get_running_loop()
                message = await loop.run_in_executor(
                    None,
                    lambda: self._client.messages.create(
                        body=message_body,
                        from_=self.from_number,
                        to=to_phone
                    )
                )
                logger.info(f"SMS sent successfully: SID {message.sid} to {to_phone}")
                return {
                    "channel": "sms",
                    "status": "SENT",
                    "recipient": to_phone,
                    "provider_id": message.sid,
                    "mode": "live",
                    "error": None
                }
            except Exception as exc:
                last_error = str(exc)
                logger.warning(f"Twilio SMS attempt {attempt} failed for {to_phone}: {exc}")
                if attempt < self.max_retries:
                    await asyncio.sleep(self.base_backoff * (2 ** (attempt - 1)))

        return {
            "channel": "sms",
            "status": "FAILED",
            "recipient": to_phone,
            "provider_id": None,
            "mode": "live",
            "error": last_error
        }
