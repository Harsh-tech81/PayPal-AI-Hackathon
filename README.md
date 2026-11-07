# 🛡️ PayShield AI — Cognitive Payment Verification Architecture

> **PayPal AI Hackathon 2026 Production Edition**  
> *"Verifying the human behind the screen through private cognitive memory, not vulnerable device credentials."*

---

## 🌟 Executive Summary

When a user's PayPal-linked device or account is compromised, traditional authentication mechanisms (passwords, PINs, SMS OTPs, and hardware biometrics) fail because the attacker already controls the physical device or session cookies.

**PayShield AI** solves this fundamentally by verifying **cognitive human memory** that exists only inside the legitimate user's mind:
1. **Zero-Knowledge Memory Vault**: During onboarding, users deposit 10 personal memory anchors encrypted at rest with **AES-256-GCM** in an isolated **MongoDB** vault, physically separated from financial ledgers in **PostgreSQL**.
2. **Real-Time 10-Second Cognitive Interception**: High-risk payments ($\ge 0.30$) are intercepted by a **LangGraph Agent** powered by **Google Gemini 1.5 Flash**, formulating an unpredictable dynamic riddle within $< 400\text{ms}$.
3. **10-Second Challenge Window**: A legitimate human recalls and types their intimate memory in 5–8 seconds, whereas a remote hacker or phishing bot cannot research personal memories in 10 seconds.
4. **Autonomous Multi-Channel Defense**: If verification fails or hits 0.0s, the system executes an atomic **1-hour account freeze**, voids the PayPal order, dispatches multi-channel alerts (**Twilio SMS**, **SendGrid HTML Email**, **Firebase Push**), and exports an automated **Bank Dispute Evidence Dossier**.

---

## 🏗️ Master System Architecture

```
[Web App (Next.js 15 - Port 3000)]
        │ 1. POST /api/v1/transactions/send
        ▼
[Transaction Service (Fastify - Port 8002)]
        │ 2. POST /api/v1/risk/score
        ▼
[Risk Engine (Fastify - Port 8004)] ──(Risk ≥ 0.30)──► [Transaction Service]
                                                               │ 3. Invokes Graph
                                                               ▼
[Web App 10s Modal] ◄──(Shows Dynamic Riddle)─── [LangGraph Agent (Port 8003)]
        │ 4. Submits Answer within 10s
        ▼
[LangGraph Agent: Evaluator Node (Gemini 1.5 Flash)]
   ├── If Correct ──► [Transaction Service] ──► Status: "APPROVED" ──► Funds Moved ✅
   └── If Wrong   ──► [Escalation Service (Port 8006)] ──► Account Frozen for 1 hr in PostgreSQL ❄️
                     └──► [Alert Service (Port 8005)]      ──► SMS + Email Dispatched 🚨
```

---

## 🚪 Microservices & Port Matrix

| Port | Service Name | Stack & Framework | Primary Responsibility |
|---|---|---|---|
| **3000** | `web-app` | Next.js 15, React 19, Tailwind CSS, Lucide | Web Shell, 10s Challenge Modal, 4-Step Intent Wizard |
| **8001** | `user-service` | Fastify 5, Prisma, MongoDB, Argon2id | Registration, login, profile, and AES-256 Intent Vault |
| **8002** | `transaction-service`| Fastify 5, Prisma, PayPal Sandbox SDK | Transfer creation, ledger, and payment orchestrator |
| **8003** | `verification-agent` | Fastify 5, LangGraph, Gemini 1.5 Flash, Redis | Dynamic questioning, 10s countdown, and LLM judge |
| **8004** | `risk-engine` | Fastify 5, TypeScript Heuristics | Real-time risk scoring ($0.00-1.00$), device & geo-velocity |
| **8005** | `alert-service` | Fastify 5, Twilio, SendGrid, Firebase | Carrier-grade SMS, HTML email, and mobile push alerts |
| **8006** | `escalation-service` | Fastify 5, Prisma (PostgreSQL) | 1-Hour atomic freeze, unfreeze, and Bank Dispute Exporter |
| **5432** | PostgreSQL 16 | Relational Financial DB via Prisma | Ledgers, users, devices, fraud incidents, and alert logs |
| **27017**| MongoDB 7 | Isolated Document Vault | AES-256-GCM encrypted user memory anchors |
| **6379** | Redis 7 | In-Memory Engine | 10-second challenge timer & session TTLs |

---

## 🧪 Comprehensive Automated Test Suite

All 7 test suites pass with 100% coverage across core cryptographic algorithms, heuristic risk rules, and microservice integration:

```bash
# Run Vitest test suite
npx vitest run
```

* `tests/unit/security.test.ts`: Argon2id password hashing, AES-256-GCM encryption/decryption, and RS256 JWT tokens.
* `tests/unit/risk-engine.test.ts`: Heuristic scoring thresholds ($0-$50 auto-approved, $1,200 at 3:15 AM from Berlin proxy scored as critical anomaly).
* `tests/unit/langgraph-agent.test.ts`: Dynamic riddle generation, 10-second countdown window, and LLM-as-a-judge semantic evaluation.
* `tests/integration/user-service.test.ts`: User registration, password hashing, and profile endpoints.
* `tests/integration/transaction-flow.test.ts`: Transaction creation, risk scoring interception, and verification triggers.
* `tests/integration/alert-escalation.test.ts`: Atomic 1-hour account freeze and multi-channel notification dispatches.
* `tests/e2e/payment-flow.spec.ts`: Scenario A (fraud lockout) and Scenario B (legitimate verification) flow specifications.

---

## 🚀 Quickstart Guide

### 1. Environment Setup
The environment configuration is loaded from `.env`:
* `GEMINI_API_KEY`: Google Gemini 1.5 Flash
* `DATABASE_URL`: PostgreSQL / Supabase
* `MONGODB_URI`: MongoDB Atlas
* `REDIS_URL`: Redis 7
* `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal Sandbox
* `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: Twilio SMS
* `SENDGRID_API_KEY`: SendGrid Email Dispatcher
* `AES_MASTER_KEY`: 32-byte Master Key for Vault Encryption

### 2. Database Migrations & Demo Data Seeding
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push --schema=database/prisma/schema.prisma

# Seed Alice Smith, trusted devices, transactions, and 10 encrypted memory secrets
npx tsx database/seeds/seed-demo-data.ts
```

### 3. Launching the Services
* **Windows (PowerShell)**:
  ```powershell
  .\scripts\dev-all.ps1
  ```
* **Linux / macOS**:
  ```bash
  bash scripts/dev-all.sh
  ```
* **Docker Compose**:
  ```bash
  docker-compose up --build
  ```

Visit **http://localhost:3000** to interact with the full PayShield AI platform!

---

*PayShield AI — Created for PayPal AI Hackathon 2026*
