# PayShield AI — Dev 5 Integrations & Architecture Documentation
**Role: DEV 5 — Integrations & Incident Escalation Backend Lead**

---

## 1. Architecture Overview

PayShield AI integrates automated verification with autonomous incident response and real-time defense. **DEV 5** provides the backbone for:
1. **Alert Service (Port 8005)**: High-reliability multi-channel notification engine (Twilio SMS, SendGrid HTML/Plain Email, Firebase Cloud Messaging).
2. **Escalation Service (Port 8006)**: Automated 1-hour account freeze management, state synchronization with DEV 2 User Service, IP blocking, and partner bank fraud reporting.
3. **Incident Logging & Forensic Data Packaging**: Immutable, tamper-evident security incident records with canonical JSON SHA-256 digital seals and credential redaction.

```mermaid
flowchart TD
    VA["Verification Agent (DEV 1 - Port 8003)"] -->|"POST /api/v1/incidents"| INC["Incident Service (Port 8006)"]
    VA -->|"POST /api/v1/escalations/freeze"| ESC["Escalation Service (Port 8006)"]
    
    ESC -->|"1. PATCH /api/v1/users/:id/freeze"| US["User Service (DEV 2 - Port 8001)"]
    ESC -->|"2. POST /api/v1/alerts/send (async)"| AS["Alert Service (DEV 5 - Port 8005)"]
    
    AS -->|"SMS (Twilio)"| SMS["Registered Mobile"]
    AS -->|"HTML Email (SendGrid)"| EMAIL["User Inbox"]
    AS -->|"FCM Multicast/Unicast"| PUSH["User Devices"]
    
    ESC -->|"POST /api/v1/escalations/report-fraud"| BANK["Partner Bank Adapter (Mock)"]
    ESC -->|"GET /api/v1/incidents/:id/evidence"| FORENSIC["SHA-256 Evidence Package"]
```

---

## 2. Service Responsibilities

### A. Alert Service (Port 8005)
- **Twilio SMS**: Security text messages to registered phone numbers with retry mechanisms and template formatting.
- **SendGrid Email**: Branded responsive HTML emails with plain-text fallbacks using Jinja2 templates (`account_frozen`, `fraud_alert`, `account_unfrozen`, `investigation_started`, `incident_resolved`).
- **Firebase Cloud Messaging**: Push notifications to mobile and web clients with multicast batching and stale token tracking.
- **De-duplication & Idempotency**: Suppresses rapid duplicate alerts within a 60-second cooldown window.
- **Delivery Tracking**: Records timestamped logs in `ALERT_HISTORY` with filterable search and delivery status query.

### B. Escalation Service & Incident Management (Port 8006)
- **1-Hour Account Freeze**: Calculates exact 1-hour expiration timestamp (`frozen_until = now() + 1h`), updates state, and invokes User Service without frontend dependence.
- **Safe Unfreeze**: Verifies expiration or accepts authorized manual security override; restores user status and dispatches unfreeze notice.
- **Duplicate Escalation Prevention**: Idempotency check prevents duplicate or spam freezes if an account is already actively frozen.
- **Bank Fraud Reporter**: Structured fraud intake compliant with bank routing standards (`BANK_ROUTING_NUMBER=121000358`), generating unique bank references (`BNK-...`). Transparently labels hackathon mock workflows.
- **IP Blocker**: Temporary and permanent IP blocking for malicious clients with remaining block duration queries.
- **Forensic Evidence Packager**: Assembles user metadata, transaction details, failed verification challenges, network telemetry, and seals the package with an immutable SHA-256 hash. Automatically redacts all passwords, OTPs, and secret answers.

---

## 3. API Endpoint Reference

### Alert Service (Port 8005)
- `POST /api/v1/alerts/send`: Unified multi-channel alert dispatch (SMS, Email, Push).
- `POST /api/v1/alerts/sms`: Direct SMS alert.
- `POST /api/v1/alerts/email`: Direct Email alert.
- `POST /api/v1/alerts/push`: Direct Push notification.
- `GET /api/v1/alerts/history`: Query notification history (filters: `user_id`, `event_type`, `status`).
- `GET /api/v1/alerts/{alert_id}/status`: Check delivery status.
- `GET /health`: Health check endpoint.
- `GET /docs`: Interactive OpenAPI documentation.

### Escalation Service (Port 8006)
- `POST /api/v1/escalations/freeze`: Freeze user account for 1 hour.
- `POST /api/v1/escalations/unfreeze`: Unfreeze user account.
- `GET /api/v1/escalations/freeze-status/{user_id}`: Real-time freeze status and remaining seconds.
- `POST /api/v1/escalations/report-fraud`: File fraud report with partner bank adapter.
- `GET /api/v1/escalations/fraud-reports`: List filed fraud reports.
- `GET /api/v1/escalations/history`: Query escalation audit trail.
- `POST /api/v1/escalations/block-ip`: Block offending IP address.
- `GET /api/v1/escalations/check-ip/{ip_address}`: Query IP block status.
- `POST /api/v1/incidents`: Log new security incident (called by DEV 1).
- `GET /api/v1/incidents/{incident_id}`: Fetch incident details.
- `GET /api/v1/incidents/user/{user_id}`: User incident history.
- `PATCH /api/v1/incidents/{incident_id}/status`: Update investigation status (`INVESTIGATING`, `CONFIRMED_FRAUD`, `RESOLVED`, `FALSE_POSITIVE`).
- `GET /api/v1/incidents/{incident_id}/evidence`: Generate SHA-256 sealed forensic evidence package.
- `GET /health`: Health check endpoint.
- `GET /docs`: Interactive OpenAPI documentation.

---

## 4. Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `ALERT_SERVICE_PORT` | Port for Alert Service | `8005` |
| `ESCALATION_SERVICE_PORT` | Port for Escalation Service | `8006` |
| `USER_SERVICE_URL` | User Service Base URL | `http://localhost:8001` |
| `ALERT_SERVICE_URL` | Alert Service Base URL | `http://localhost:8005` |
| `DEFAULT_FREEZE_DURATION_HOURS` | Duration in hours for account freeze | `1` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `...` |
| `TWILIO_PHONE_NUMBER` | Twilio Outbound Number | `+17372508034` |
| `SENDGRID_API_KEY` | SendGrid API Key | `SG...` |
| `SENDGRID_FROM_EMAIL` | Sender Email Address | `jayy45211@gmail.com` |
| `SENDGRID_FROM_NAME` | Sender Display Name | `PayShield AI Security` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `payshield-ai-abf86` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | `firebase-adminsdk-...` |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Key | `-----BEGIN PRIVATE KEY...` |
| `BANK_ROUTING_NUMBER` | Partner Bank Routing Number | `121000358` |

---

## 5. Local Setup Instructions

```bash
# 1. Create and activate virtual environment
uv venv .venv
source .venv/bin/activate

# 2. Install dependencies
uv pip install -r services/alert-service/requirements.txt
uv pip install -r services/escalation-service/requirements.txt
uv pip install pytest pytest-asyncio httpx

# 3. Start Alert Service (Terminal 1)
uvicorn services.alert_service.main:app --port 8005 --reload

# 4. Start Escalation Service (Terminal 2)
uvicorn services.escalation_service.main:app --port 8006 --reload
```

---

## 6. Docker Instructions

```bash
# Build and run with Docker Compose
docker compose up -d alert-service escalation-service

# Inspect logs
docker compose logs -f alert-service escalation-service

# Check health
curl http://localhost:8005/health
curl http://localhost:8006/health
```

---

## 7. Testing Instructions

All automated tests use pytest and can run in mock or live mode:

```bash
# Run all backend tests
.venv/bin/pytest tests/backend/ -v

# Run individual test modules
.venv/bin/pytest tests/backend/test_alert_service.py -v
.venv/bin/pytest tests/backend/test_escalation_service.py -v
.venv/bin/pytest tests/backend/test_incident_forensics.py -v
.venv/bin/pytest tests/backend/test_integration_flow.py -v
```

---

## 8. Integration Instructions for Teammates

### For DEV 1 (Verification Agent & Risk Engine — Ports 8003/8004)
When a verification challenge fails:
1. **Record the Incident**:
   ```http
   POST http://localhost:8006/api/v1/incidents
   Content-Type: application/json

   {
     "user_id": "usr_abc123",
     "transaction_id": "txn_xyz789",
     "incident_type": "failed_verification",
     "severity": "HIGH",
     "risk_score": 0.88,
     "trigger_rules": "User failed 3 secret intent questions",
     "source_ip": "198.51.100.22",
     "device_info": {"fingerprint": "fp_999"},
     "failed_attempts": [{"q": "q_id", "response_time_ms": 3500, "is_correct": false}]
   }
   ```
2. **Freeze Account**:
   ```http
   POST http://localhost:8006/api/v1/escalations/freeze
   Content-Type: application/json

   {
     "user_id": "usr_abc123",
     "reason": "Exceeded failed verification threshold",
     "incident_id": "inc_id_from_step_1",
     "metadata": {"email": "user@example.com", "phone_number": "+1..."}
   }
   ```

### For DEV 2 (User Service & Transaction Service — Ports 8001/8002)
- Escalation Service syncs with User Service via:
  ```http
  PATCH http://localhost:8001/api/v1/users/{id}/freeze
  Content-Type: application/json

  {
    "is_frozen": true,
    "frozen_until": "2026-11-05T19:30:00Z",
    "frozen_reason": "Failed verification challenges"
  }
  ```
- If User Service is temporarily offline, Escalation Service maintains the freeze state locally and automatically retries.

### For DEV 3 & DEV 4 (Frontend & QA — Port 3000)
- Retrieve security alerts: `GET http://localhost:8005/api/v1/alerts/history?user_id={user_id}`
- Check freeze status: `GET http://localhost:8006/api/v1/escalations/freeze-status/{user_id}`
- Download forensic package: `GET http://localhost:8006/api/v1/incidents/{incident_id}/evidence`

---

## 9. Known Limitations & Remaining Tasks
- **Live Bank API Gateway**: In hackathon mode, partner bank fraud reporting uses a mock intake adapter with realistic ACK reference numbers (`BNK-...`).
- **Distributed Scheduler**: Account unfreeze is managed reliably via server-side timestamp comparison (`now >= frozen_until`). For a production cluster with multiple instances, a distributed task queue (e.g. Celery / BullMQ / Redis keyspace notifications) can be added in Phase 2.
