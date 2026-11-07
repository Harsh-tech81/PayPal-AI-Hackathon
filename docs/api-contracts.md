# 📜 PayShield AI — Master API Contracts & Microservices Specification

This document details the HTTP REST endpoints, request payloads, response bodies, and error formats for all 6 microservices in PayShield AI.

---

## 🚪 Master Port Allocation

| Port | Microservice | Responsibility |
|---|---|---|
| **3000** | `web-app` | Next.js 15 Web App Shell, 10-Second Modal, Intent Form Wizard |
| **8001** | `user-service` | Auth, user profiles, device registry, MongoDB Intent Vault storage |
| **8002** | `transaction-service` | Payment creation, ledger history, PayPal SDK & Risk Orchestration |
| **8003** | `verification-agent` | LangGraph StateMachine, Gemini 1.5 Flash dynamic riddle, 10s timer |
| **8004** | `risk-engine` | Transaction risk scoring ($0.00-1.00$), device & geo-velocity checks |
| **8005** | `alert-service` | Twilio SMS, SendGrid HTML email, and Firebase push notification dispatch |
| **8006** | `escalation-service` | 1-Hour PostgreSQL account freeze, unfreeze, and Bank Dispute Dossier export |

---

## 1. User Service (Port 8001)

### `POST /api/v1/auth/register`
Creates a user account and hashes the password with Argon2id.
* **Request Body:**
  ```json
  {
    "fullName": "Alice Smith",
    "email": "alice@example.com",
    "phone": "+15550192834",
    "password": "Password123!",
    "agreeToSecurityProtocol": true
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a0000000-0000-0000-0000-000000000001",
      "email": "alice@example.com",
      "fullName": "Alice Smith"
    }
  }
  ```

### `POST /api/v1/auth/login`
Authenticates credentials and returns session JWT.
* **Request Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "Password123!"
  }
  ```

### `POST /api/v1/intent-form/setup`
Encrypts 10 personal memory anchors with AES-256-GCM and stores them into the isolated MongoDB vault.
* **Request Body:**
  ```json
  {
    "userId": "a0000000-0000-0000-0000-000000000001",
    "secrets": [
      {
        "category": "memory_anchors",
        "prompt": "Name of your first childhood dog and their favorite snack",
        "answer": "Bruno who loved biscuits",
        "hint": "Childhood family pet"
      }
    ]
  }
  ```

---

## 2. Transaction Service (Port 8002)

### `POST /api/v1/transactions/send`
Initiates money transfer. Calls Risk Engine (Port 8004). If Risk $< 0.30$, auto-approves in 50ms; if Risk $\ge 0.30$, intercepts with Verification Agent (Port 8003).
* **Request Body:**
  ```json
  {
    "recipientEmail": "international-merchant@berlin-tech.de",
    "amount": 1200.00,
    "currency": "USD",
    "description": "Late night electronics order",
    "deviceFingerprint": "fp_unknown_linux_attacker",
    "ipAddress": "185.220.101.5",
    "location": "Berlin, Germany"
  }
  ```
* **Response (High Risk -> Intercepted):**
  ```json
  {
    "status": "VERIFICATION_REQUIRED",
    "transactionId": "tx_12345",
    "challengeToken": "ctk_98765",
    "question": "Who used to wag their tail and beg for your morning biscuits?",
    "timeoutSeconds": 10,
    "countdownExpiresAt": 1793892010000,
    "riskScore": 0.88
  }
  ```

---

## 3. GenAI Verification Agent (Port 8003)

### `POST /api/v1/verify/challenge`
Queries RAG for contextual secret anchor and formulates dynamic riddle in $< 400\text{ms}$ with Gemini 1.5 Flash.
* **Response (200 OK):**
  ```json
  {
    "status": "CHALLENGE_ACTIVE",
    "challengeToken": "ctk_98765",
    "question": "Who used to wag their tail and beg for your morning biscuits?",
    "timeoutSeconds": 10
  }
  ```

### `POST /api/v1/verify/answer`
Evaluates submitted answer within 10-second countdown window using Gemini LLM-as-a-judge.
* **Request Body:**
  ```json
  {
    "challengeToken": "ctk_98765",
    "transactionId": "tx_12345",
    "userId": "a0000000-0000-0000-0000-000000000001",
    "answer": "My dog Bruno",
    "responseTimeMs": 5200,
    "isTimeout": false
  }
  ```
* **Response (Scenario B: Correct):**
  ```json
  {
    "status": "APPROVED",
    "is_verified": true,
    "confidence": 0.98,
    "reasoning": "User recalled pet Bruno"
  }
  ```
* **Response (Scenario A: Wrong / Timeout):**
  ```json
  {
    "status": "REJECTED_FRAUD",
    "is_verified": false,
    "confidence": 0.04,
    "accountFrozen": true,
    "frozenDurationHours": 1,
    "dossier": {
      "incidentReference": "PS-FR-2026-9812A",
      "paypalOrderStatus": "VOIDED_BY_COGNITIVE_SHIELD"
    }
  }
  ```

---

## 4. Risk Scoring Engine (Port 8004)

### `POST /api/v1/risk/score`
Calculates composite risk score ($0.00-1.00$) evaluating amount, midnight hours, unrecognized device, and Berlin proxy IP.
* **Response (200 OK):**
  ```json
  {
    "riskScore": 0.88,
    "tier": "CRITICAL",
    "requiresVerification": true,
    "anomalies": [
      "High transfer value: $1,200.00 exceeds $1,000 threshold",
      "Circadian Anomaly: Transfer initiated during dormant hours (3:15 AM)",
      "High-risk foreign node detected: Berlin proxy/VPN node"
    ]
  }
  ```

---

## 5. Alert Service (Port 8005)

### `POST /api/v1/alerts/send`
Dispatches SMS via Twilio, HTML Incident Report via SendGrid, and Push Alert via Firebase Admin.

---

## 6. Escalation Service (Port 8006)

### `POST /api/v1/escalate/freeze`
Enforces atomic 1-hour account freeze (`isFrozen = true`, `frozenUntil = NOW() + 1 hour`).

### `POST /api/v1/escalate/report-to-bank`
Exports structured JSON Bank Dispute Dossier for fraud investigations.
