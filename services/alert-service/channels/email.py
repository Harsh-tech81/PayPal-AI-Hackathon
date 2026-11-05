"""
SendGrid Email Channel Dispatcher for PayShield AI Alert Service
"""
import os
import logging
import asyncio
from typing import Optional, Dict, Any
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger("alert_service.email")

class SendGridEmailDispatcher:
    def __init__(
        self,
        api_key: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        template_dir: Optional[str] = None,
        max_retries: int = 3,
        base_backoff: float = 0.5,
    ):
        self.api_key = api_key or os.getenv("SENDGRID_API_KEY", "")
        self.from_email = from_email or os.getenv("SENDGRID_FROM_EMAIL", "security@payshield.ai")
        self.from_name = from_name or os.getenv("SENDGRID_FROM_NAME", "PayShield AI Security")
        self.max_retries = max_retries
        self.base_backoff = base_backoff
        self._client = None

        current_dir = os.path.dirname(os.path.abspath(__file__))
        default_templates = os.path.join(os.path.dirname(current_dir), "templates")
        self.template_dir = template_dir or default_templates
        
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.template_dir),
            autoescape=select_autoescape(["html", "xml"])
        )

        self.is_configured = bool(
            self.api_key 
            and not self.api_key.startswith("SG.your")
            and len(self.api_key) > 20
        )

        if self.is_configured:
            try:
                from sendgrid import SendGridAPIClient
                self._client = SendGridAPIClient(self.api_key)
                logger.info("SendGrid Email Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize SendGrid client: {e}. Falling back to mock dispatch.")
                self.is_configured = False

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Renders a Jinja2 template file with context.
        """
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Error rendering template {template_name}: {e}")
            return f"PayShield AI Notification: {context.get('subject', 'Security Notice')}"

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_text_content: Optional[str] = None,
        mock_override: bool = False
    ) -> Dict[str, Any]:
        """
        Sends an email via SendGrid with retries and exponential backoff.
        """
        if not to_email:
            return {
                "channel": "email",
                "status": "FAILED",
                "recipient": to_email,
                "error": "Recipient email address is required"
            }

        if mock_override or not self.is_configured or not self._client:
            logger.info(f"[MOCK EMAIL] To: {to_email} | Subject: {subject}")
            return {
                "channel": "email",
                "status": "SENT",
                "recipient": to_email,
                "provider_id": f"mock_sg_{os.urandom(6).hex()}",
                "mode": "mock",
                "error": None
            }

        last_error = None
        for attempt in range(1, self.max_retries + 1):
            try:
                from sendgrid.helpers.mail import Mail, Email, To, Content
                
                from_obj = Email(self.from_email, self.from_name)
                to_obj = To(to_email)
                content_obj = Content("text/html", html_content)
                mail = Mail(from_obj, to_obj, subject, content_obj)
                
                if plain_text_content:
                    mail.add_content(Content("text/plain", plain_text_content))

                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self._client.send(mail)
                )

                if 200 <= response.status_code < 300:
                    msg_id = response.headers.get("X-Message-Id", f"sg_{os.urandom(6).hex()}")
                    logger.info(f"Email sent via SendGrid to {to_email}: Status {response.status_code}")
                    return {
                        "channel": "email",
                        "status": "SENT",
                        "recipient": to_email,
                        "provider_id": msg_id,
                        "mode": "live",
                        "error": None
                    }
                else:
                    last_error = f"SendGrid returned HTTP {response.status_code}: {response.body}"
                    logger.warning(f"SendGrid delivery attempt {attempt} failed: {last_error}")
            except Exception as exc:
                last_error = str(exc)
                logger.warning(f"SendGrid delivery attempt {attempt} error: {exc}")

            if attempt < self.max_retries:
                await asyncio.sleep(self.base_backoff * (2 ** (attempt - 1)))

        return {
            "channel": "email",
            "status": "FAILED",
            "recipient": to_email,
            "provider_id": None,
            "mode": "live",
            "error": last_error
        }
