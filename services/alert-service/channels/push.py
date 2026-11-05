"""
Firebase Cloud Messaging (FCM) Channel Dispatcher for PayShield AI Alert Service
"""
import os
import json
import logging
import asyncio
from typing import Optional, Dict, Any, List

logger = logging.getLogger("alert_service.push")

class FirebasePushDispatcher:
    def __init__(
        self,
        project_id: Optional[str] = None,
        client_email: Optional[str] = None,
        private_key: Optional[str] = None,
    ):
        self.project_id = project_id or os.getenv("FIREBASE_PROJECT_ID", "")
        self.client_email = client_email or os.getenv("FIREBASE_CLIENT_EMAIL", "")
        raw_key = private_key or os.getenv("FIREBASE_PRIVATE_KEY", "")
        # Handle escaped newlines in env string
        self.private_key = raw_key.replace("\\n", "\n") if raw_key else ""
        self._app = None
        self.is_configured = False

        if (
            self.project_id 
            and self.client_email 
            and self.private_key 
            and "BEGIN PRIVATE KEY" in self.private_key
            and not self.project_id.startswith("payshield-ai-prod") # avoid dummy placeholder
        ):
            try:
                import firebase_admin
                from firebase_admin import credentials
                
                # Check if default app is already initialized
                if not firebase_admin._apps:
                    cred = credentials.Certificate({
                        "type": "service_account",
                        "project_id": self.project_id,
                        "private_key": self.private_key,
                        "client_email": self.client_email,
                        "token_uri": "https://oauth2.googleapis.com/token",
                    })
                    self._app = firebase_admin.initialize_app(cred)
                else:
                    self._app = firebase_admin.get_app()

                self.is_configured = True
                logger.info(f"Firebase Admin SDK initialized successfully for project {self.project_id}.")
            except Exception as e:
                logger.warning(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to mock push.")
                self.is_configured = False

    async def send_push_notification(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None,
        mock_override: bool = False
    ) -> Dict[str, Any]:
        """
        Sends push notifications to one or multiple device tokens.
        """
        if not device_tokens:
            return {
                "channel": "push",
                "status": "FAILED",
                "recipients": [],
                "error": "At least one device token is required"
            }

        sanitized_data = {str(k): str(v) for k, v in (data or {}).items()}

        if mock_override or not self.is_configured:
            logger.info(f"[MOCK PUSH] Tokens ({len(device_tokens)}): {device_tokens[:2]} | Title: {title}")
            return {
                "channel": "push",
                "status": "SENT",
                "recipients": device_tokens,
                "success_count": len(device_tokens),
                "failure_count": 0,
                "invalid_tokens": [],
                "provider_id": f"mock_fcm_{os.urandom(6).hex()}",
                "mode": "mock",
                "error": None
            }

        try:
            from firebase_admin import messaging

            loop = asyncio.get_running_loop()
            
            if len(device_tokens) == 1:
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    data=sanitized_data,
                    token=device_tokens[0]
                )
                response = await loop.run_in_executor(
                    None,
                    lambda: messaging.send(message)
                )
                return {
                    "channel": "push",
                    "status": "SENT",
                    "recipients": device_tokens,
                    "success_count": 1,
                    "failure_count": 0,
                    "invalid_tokens": [],
                    "provider_id": response,
                    "mode": "live",
                    "error": None
                }
            else:
                multicast_message = messaging.MulticastMessage(
                    notification=messaging.Notification(title=title, body=body),
                    data=sanitized_data,
                    tokens=device_tokens
                )
                batch_response = await loop.run_in_executor(
                    None,
                    lambda: messaging.send_each_for_multicast(multicast_message)
                )

                invalid_tokens = []
                for idx, resp in enumerate(batch_response.responses):
                    if not resp.success:
                        err_code = getattr(resp.exception, "code", str(resp.exception))
                        if "registration-token-not-registered" in str(err_code).lower() or "invalid-argument" in str(err_code).lower():
                            invalid_tokens.append(device_tokens[idx])

                logger.info(
                    f"FCM Multicast result: {batch_response.success_count} success, "
                    f"{batch_response.failure_count} failure"
                )

                return {
                    "channel": "push",
                    "status": "SENT" if batch_response.success_count > 0 else "FAILED",
                    "recipients": device_tokens,
                    "success_count": batch_response.success_count,
                    "failure_count": batch_response.failure_count,
                    "invalid_tokens": invalid_tokens,
                    "provider_id": f"fcm_batch_{os.urandom(6).hex()}",
                    "mode": "live",
                    "error": None if batch_response.success_count > 0 else "All tokens failed delivery"
                }

        except Exception as exc:
            logger.error(f"FCM push dispatch error: {exc}")
            return {
                "channel": "push",
                "status": "FAILED",
                "recipients": device_tokens,
                "success_count": 0,
                "failure_count": len(device_tokens),
                "invalid_tokens": [],
                "provider_id": None,
                "mode": "live",
                "error": str(exc)
            }
