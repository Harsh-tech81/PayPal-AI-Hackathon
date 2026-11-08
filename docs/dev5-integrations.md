# PayShield AI — Dev 5 Integrations & Architecture Documentation
**Role: DEV 5 — Integrations & Incident Escalation Backend Lead**

---

## 1. Architecture Overview

PayShield AI integrates automated verification with autonomous incident response and real-time defense. **DEV 5** provides the backbone for:
1. **Alert Service (Port 8005)**: High-reliability multi-channel notification engine (Twilio SMS, Nodemailer Gmail SMTP, Firebase Cloud Messaging).
2. **Escalation Service (Port 8006)**: Automated 1-hour account freeze management, state synchronization with User Service, IP blocking, and partner bank fraud reporting.
3. **Incident Logging & Forensic Data Packaging**: Immutable, tamper-evident security incident records with canonical JSON SHA-256 digital seals and credential redaction.

```mermaid
flowchart TD
    VA["Verification Agent (Port 8003)"] -->|"POST /api/v1/escalate/freeze"| ESC["Escalation Service (Port 8006)"]
    
    ESC -->|"1. Update PostgreSQL & Prisma"| DB["Supabase / PostgreSQL"]
    ESC -->|"2. POST /api/v1/alerts/send"| AS["Alert Service (Port 8005)"]
    
    AS -->|"SMS (Twilio)"| SMS["Registered Mobile"]
    AS -->|"Email (Nodemailer SMTP)"| EMAIL["User Inbox"]
    AS -->|"FCM Push (Firebase)"| PUSH["User Devices"]
    
    ESC -->|"POST /api/v1/escalate/report-to-bank"| BANK["Partner Bank Adapter (Mock)"]
    ESC -->|"GET /api/v1/escalate/evidence/:incidentId"| FORENSIC["SHA-256 Sealed Evidence Package"]
```

---

## 2. Service Responsibilities

### A. Alert Service (Port 8005 — TypeScript / Fastify)
- **Twilio SMS**: Security text messages to registered phone numbers with a 5-second circuit-breaker timeout and fallback.
- **Nodemailer SMTP Email**: Direct primary inbox delivery via Gmail SMTP / Custom SMTP with branded HTML templates and plain-text fallback.
- **Firebase Cloud Messaging**: Optional push notifications to mobile and web clients via Firebase Admin SDK with graceful fallback.
- **Delivery Tracking**: Records timestamped audit logs in `AlertLog` table in PostgreSQL.

### B. Escalation Service & Incident Management (Port 8006 — TypeScript / Fastify)
- **1-Hour Account Freeze**: Calculates exact 1-hour expiration timestamp (`frozenUntil = now() + 1h`), updates state, and persists to PostgreSQL.
- **Dynamic Freeze Status & Auto-Unfreeze**: Exposes real-time remaining seconds (`GET /api/v1/escalate/status/:userId`) and automatically unfreezes when duration expires.
- **Duplicate Escalation Prevention**: Idempotency check prevents duplicate or spam freezes if an account is already actively frozen.
- **Safe Unfreeze**: Verifies resolution method (e.g. video KYC or security question) and restores access (`POST /api/v1/escalate/unfreeze`).
- **Partner Bank Fraud Reporter**: Structured fraud intake compliant with bank routing standards (`BANK_ROUTING_NUMBER=121000358`), generating unique bank references (`BNK-...`).
- **IP Blocker**: Temporary and permanent IP blocking for malicious clients with remaining block duration queries.
- **Forensic Evidence Packager**: Assembles user metadata, transaction details, failed challenges, network telemetry, and seals the package with an immutable SHA-256 digital fingerprint.

---

## 3. API Endpoint Reference

### Alert Service (Port 8005)
- `POST /api/v1/alerts/send`: Unified multi-channel alert dispatch (SMS, Email, Push).
- `POST /api/v1/alerts/receipt`: Dispatch transaction receipt email.
- `GET /api/v1/alerts/history/:userId`: Query alert notification history.
- `GET /health`: Health check endpoint.

### Escalation Service (Port 8006)
- `POST /api/v1/escalate/freeze`: Freeze user account for 1 hour.
- `POST /api/v1/escalate/unfreeze`: Unfreeze user account (e.g., via video KYC).
- `GET /api/v1/escalate/status/:userId`: Real-time freeze status and remaining seconds countdown.
- `POST /api/v1/escalate/report-to-bank`: File fraud dispute report with partner bank adapter.
- `GET /api/v1/escalate/incidents/:userId`: List incidents for a specific user.
- `GET /api/v1/escalate/evidence/:incidentId`: Generate tamper-evident SHA-256 sealed forensic evidence package.
- `GET /health`: Health check endpoint.

---

## 4. Environment Variables Reference

| Variable | Description | Example / Default |
|---|---|---|
| `ALERT_SERVICE_PORT` | Port for Alert Service | `8005` |
| `ESCALATION_SERVICE_PORT` | Port for Escalation Service | `8006` |
| `USER_SERVICE_URL` | User Service Base URL | `http://localhost:8001` |
| `ALERT_SERVICE_URL` | Alert Service Base URL | `http://localhost:8005` |
| `DATABASE_URL` | PostgreSQL / Supabase pooler connection URL | `postgresql://...` |
| `DEFAULT_FREEZE_DURATION_HOURS` | Duration in hours for account freeze | `1` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC...` (Optional, has mock fallback) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `...` (Optional) |
| `TWILIO_PHONE_NUMBER` | Twilio Outbound Number | `+18005550199` |
| `EMAIL_USER` | Gmail / SMTP sender address | `your_email@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (16 chars) | `your_app_password` |
| `EMAIL_HOST` | SMTP Host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP Port | `465` |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | `payshield-ai-prod` (Optional) |
| `FIREBASE_CLIENT_EMAIL` | Firebase Service Account Email | `firebase-adminsdk-...` (Optional) |
| `FIREBASE_PRIVATE_KEY` | Firebase Service Account Key | `-----BEGIN PRIVATE KEY...` (Optional) |
| `BANK_ROUTING_NUMBER` | Partner Bank Routing Number | `121000358` |

---

## 5. Local Setup Instructions

```bash
# 1. Install root dependencies
npm install

# 2. Run all microservices & Next.js frontend concurrently
npm run dev

# Or run individual services:
npx tsx services/alert-service/src/index.ts
npx tsx services/escalation-service/src/index.ts
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

All automated tests use Vitest with TypeScript:

```bash
# Run full integration test suite
npm test

# Run alert & escalation integration tests specifically
npx vitest run tests/integration/alert-escalation.test.ts
```

---

## 8. Integration Instructions for Teammates

### For Verification Agent (Port 8003)
When cognitive verification fails:
```http
POST http://localhost:8006/api/v1/escalate/freeze
Content-Type: application/json

{
  "userId": "a0000000-0000-0000-0000-000000000001",
  "reason": "Failed 10-second cognitive verification",
  "attackerIp": "185.220.101.5",
  "amount": 1200
}
```

### For Frontend Web App (Port 3000)
1. **Check Live Freeze Status**:
   ```http
   GET http://localhost:8006/api/v1/escalate/status/a0000000-0000-0000-0000-000000000001
   ```
2. **Inspect Forensic Package with SHA-256 Seal**:
   ```http
   GET http://localhost:8006/api/v1/escalate/evidence/PS-FR-2026-9812A
   ```
3. **Download Bank Dispute Dossier**:
   ```http
   POST http://localhost:8006/api/v1/escalate/report-to-bank
   Content-Type: application/json

   {
     "incidentReference": "PS-FR-2026-9812A"
   }
   ```
4. **Unfreeze Account (Video KYC)**:
   ```http
   POST http://localhost:8006/api/v1/escalate/unfreeze
   Content-Type: application/json

   {
     "userId": "a0000000-0000-0000-0000-000000000001",
     "resolutionMethod": "video_kyc"
   }
   ```

---

## 9. Hackathon Demo Features
- **Tamper-Evident SHA-256 Digital Fingerprint**: Incident dossiers generate a cryptographic SHA-256 seal of the canonical JSON payload, verifiable on the frontend.
- **Dynamic Lockdown Screen**: Replaced static countdowns with real-time server-synced seconds remaining.
- **Non-blocking Resilience**: Twilio SMS and Nodemailer SMTP dispatches include 5-second timeouts and mock fallbacks so the app never hangs during offline or flaky network presentations.
