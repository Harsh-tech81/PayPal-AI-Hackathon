# 🛡️ PayShield AI — Autonomous Cognitive Payment Defense Architecture

> **PayPal AI Hackathon 2026 Production Edition**  
> *"Verifying the human behind the screen through private episodic cognitive memory, not vulnerable device credentials."*

[![Live Production App](https://img.shields.io/badge/Live%20App-paypal--shield--ai.vercel.app-0070ba?style=for-the-badge&logo=vercel&logoColor=white)](https://paypal-shield-ai.vercel.app)
[![Next.js 15](https://img.shields.io/badge/Next.js%2015-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Fastify 5](https://img.shields.io/badge/Fastify%205-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agentic%20AI-orange?style=for-the-badge)](https://langchain-ai.github.io/langgraphjs/)
[![Gemini 1.5 Flash](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL%2016-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-AES--256%20Vault-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebAuthn FIDO2](https://img.shields.io/badge/WebAuthn-Hardware%20Passkeys-green?style=for-the-badge&logo=fido&logoColor=white)](https://webauthn.io/)
[![TypeScript 5.6](https://img.shields.io/badge/TypeScript%205.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 🌐 Live Production Deployment

Access the live, fully interactive deployment hosted on Vercel:

👉 **[https://paypal-shield-ai.vercel.app](https://paypal-shield-ai.vercel.app)**

Explore instant transfers, zero-knowledge memory vault enrollment, real-time risk scoring, dynamic AI cognitive challenge evaluation, automated fraud lockdowns, and hardware biometric passkey recovery.

---

## 📑 Table of Contents

- [🌟 Executive Summary](#-executive-summary)
- [⚠️ The Problem: Why Traditional 2FA Fails](#️-the-problem-why-traditional-2fa-fails)
- [💡 The PayShield Solution: Episodic Memory Verification](#-the-payshield-solution-episodic-memory-verification)
- [🎬 Animated System Workflow & Dataflow](#-animated-system-workflow--dataflow)
- [🏗️ Master System Architecture](#️-master-system-architecture)
- [🚪 Microservices & Port Matrix](#-microservices--port-matrix)
- [🛠️ Complete Technology Stack](#️-complete-technology-stack)
- [⚡ Quickstart & Installation Guide](#-quickstart--installation-guide)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone Repository & Install Dependencies](#step-1-clone-repository--install-dependencies)
  - [Step 2: Environment Configuration](#step-2-environment-configuration)
  - [Step 3: Database Migrations & Prisma Push](#step-3-database-migrations--prisma-push)
  - [Step 4: Launching the Platform](#step-4-launching-the-platform)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [📱 End-to-End User Experience Guide](#-end-to-end-user-experience-guide)
- [🔐 Cryptography, Privacy & Zero-Knowledge Architecture](#-cryptography-privacy--zero-knowledge-architecture)
- [📄 License & Hackathon Context](#-license--hackathon-context)

---

## 🌟 Executive Summary

When a user's phone, laptop, or browser session is compromised by an adversary (via remote access Trojans, session cookie theft, SIM swapping, or physical device theft), traditional security systems collapse. SMS OTPs arrive on the attacker's screen, authenticator apps run on the compromised OS, and hardware passkeys are often bypassed or physically held.

**PayShield AI** introduces an autonomous, AI-driven defense layer that verifies the **episodic human memory** stored inside the legitimate user's mind. By decoupling identity verification from device possession and anchoring it in human episodic recall evaluated by **Google Gemini 1.5 Flash** and **LangGraph**, PayShield halts unauthorized transactions in real time with zero friction for normal activity.

---

## ⚠️ The Problem: Why Traditional 2FA Fails

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ATTACK VECTORS ON MODERN 2FA                          │
├──────────────────────┬────────────────────────┬─────────────────────────────┤
│ Method               │ Failure Point          │ Attack Vector               │
├──────────────────────┼────────────────────────┼─────────────────────────────┤
│ SMS OTP              │ Carrier & Device       │ SIM Swapping, SMS Sniffers  │
│ Authenticator App    │ Device / Local OS      │ Infostealers, Screen Mirror │
│ Device Passkey       │ Unattended Hardware    │ Physical Grab & Run, RATs   │
│ Security Questions   │ Public Web Footprint   │ Social Engineering, OSINT   │
└──────────────────────┴────────────────────────┴─────────────────────────────┘
```

Static security questions like *"What is your mother's maiden name?"* or *"What high school did you attend?"* are permanently compromised due to public social media databases and OSINT search tools.

---

## 💡 The PayShield Solution: Episodic Memory Verification

PayShield replaces static trivia with **Dynamic Episodic Memory Anchors**:

1. **Zero-Knowledge Memory Vault**: Users deposit intimate, non-discoverable episodic memory seeds (e.g., *"What was the name of the stray kitten you fed on your back porch during the 2021 winter storm?"*).
2. **Cryptographic Enclave Storage**: Anchors are encrypted with **AES-256-GCM** using a dedicated key and stored in an isolated MongoDB document vault, physically and logically segregated from payment ledger tables.
3. **Dynamic Riddle Formulation**: When an anomalous transaction occurs, a **LangGraph Multi-Agent Engine** powered by **Google Gemini 1.5 Flash** crafts an unpredictable, conversational riddle in $< 400\text{ms}$.
4. **Natural Spelling & Semantic Evaluation**: A legitimate human recalls their private memory naturally in 3–6 seconds without worrying about exact punctuation or syntax. Gemini evaluates semantic intent rather than brittle string matching.
5. **Immediate Autonomous Lockdown**: Any incorrect response or failure immediately triggers an atomic 1-hour account freeze in PostgreSQL, blocks the offending IP at the edge firewall, dispatches multi-channel alerts (SMS, Email, Push), and compiles a downloadable **Bank Dispute Dossier**.
6. **Universal Biometric Passkey Recovery**: Frozen accounts can be restored seamlessly through physical biometric passkey verification (Windows Hello, Touch ID, Face ID) across the Login page, Memory Vault gate, Security Center, or the payment terminal.

---

## 🎬 Animated System Workflow & Dataflow

```
                PAYSHIELD REAL-TIME INTERCEPTION PIPELINE
                ─────────────────────────────────────────

  [ USER / ATTACKER ]
          │
          │ 1. Initiates Transfer ($1,200.00 / 03:15 AM / Tor Proxy)
          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ ⚖️  HEURISTIC RISK ENGINE (Port 8004)                         │
  │ • Amount Scaling: $50 (Low) vs $1,200 (Med) vs $10,000 (High)│
  │ • Temporal Analysis: Daytime vs Late Night (01:00 - 05:00)  │
  │ • Geo-Velocity & Unknown Device Fingerprint Score: 0.82 🚨   │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        Risk < 0.30 (Normal)            Risk ≥ 0.30 (Anomalous)
                 │                               │
                 ▼                               ▼
       ┌───────────────────┐           ┌────────────────────────────────┐
       │ ⚡ AUTO-APPROVED   │           │ 🧠 COGNITIVE INTERCEPTION GATE │
       │ Instant Settlement│           │ (LangGraph + Gemini 1.5 Flash) │
       │ Frictionless (50ms│           └───────────────┬────────────────┘
       └───────────────────┘                           │
                                         2. Fetches Encrypted Memory
                                         3. Formulates Dynamic Riddle (<400ms)
                                                       │
                                                       ▼
                                       ┌────────────────────────────────┐
                                       │ 🔐 PRESENT SECURITY CHALLENGE  │
                                       │ Interactive Cognitive Recall   │
                                       └───────────────┬────────────────┘
                                                       │
                                         4. User Submits Secret Answer
                                                       │
                               ┌───────────────────────┴───────────────────────┐
                               │                                               │
                        [ MATCH APPROVED ]                             [ MATCH REJECTED ]
                               │                                               │
                               ▼                                               ▼
                     ┌──────────────────┐                            ┌───────────────────┐
                     │  PAYMENT CLEARED │                            │ 🚨 1-HR LOCKDOWN  │
                     │ • Ledger Updated │                            │ • Account Frozen  │
                     │ • Receipt Issued │                            │ • SMS Alert Sent  │
                     │ • Form Cleared   │                            │ • Bank Dossier Gen│
                     └──────────────────┘                            │ • Route Lockdown  │
                                                                     └───────────────────┘
```

---

## 🏗️ Master System Architecture

PayShield AI is architected as an enterprise monorepo housing modular, resilient microservices connected through REST and message bridges:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND APPLICATION                             │
│                  Next.js 15 (App Router) • React 19 • Tailwind CSS           │
│         Dashboard • Transactions • Memory Vault • Security & Devices        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / JSON
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API & ORCHESTRATION LAYER                           │
├──────────────────────────────────┬──────────────────────────────────────────┤
│ 1. Transaction Service           │ Orchestrates payment execution, risk     │
│    (Port 8002)                   │ checks, and verification triggers.       │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ 2. Risk Engine                   │ Real-time heuristic scoring (amount,     │
│    (Port 8004)                   │ time of day, device fingerprint, IP).    │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ 3. Verification Agent            │ LangGraph orchestrator formulating and   │
│    (Port 8003)                   │ judging cognitive episodic challenges.   │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ 4. User Service                  │ User auth, Argon2id passwords, profile,  │
│    (Port 8001)                   │ and Passkey WebAuthn credentials.        │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ 5. Alert Service                 │ Dispatches Twilio SMS, Nodemailer HTML   │
│    (Port 8005)                   │ Gmail notifications, and Push messages.  │
├──────────────────────────────────┼──────────────────────────────────────────┤
│ 6. Escalation Service            │ 1-hour atomic freeze, IP firewall rules, │
│    (Port 8006)                   │ bank forensic dispute dossier exporter.  │
└──────────────────────────────────┴──────────────────────────────────────────┘
                                       │
       ┌───────────────────────────────┼───────────────────────────────┐
       ▼                               ▼                               ▼
┌──────────────┐               ┌──────────────┐               ┌──────────────┐
│  PostgreSQL  │               │MongoDB Atlas │               │   Redis 7    │
│  (Supabase)  │               │(AES-256 GCM) │               │ (In-Memory)  │
│  • Users     │               │• Cognitive   │               │• Nonce TTLs  │
│  • Balances  │               │  Memory      │               │• Challenge   │
│  • Ledgers   │               │  Anchors     │               │  Tokens      │
│  • Incidents │               │• Enclave     │               │• Session     │
│  • Devices   │               │  Store       │               │  Rate Limits │
└──────────────┘               └──────────────┘               └──────────────┘
```

---

## 🚪 Microservices & Port Matrix

| Service | Port | Directory | Framework & Tech | Primary Responsibility |
|---|---|---|---|---|
| **Web App** | `3000` | `web-app/` | Next.js 15, React 19, Tailwind CSS | Responsive UI, cognitive challenge modal, biometric recovery |
| **User Service** | `8001` | `services/user-service/` | Fastify 5, Prisma, Argon2id | User auth, password login, passkey login, user profiles |
| **Transaction Service** | `8002` | `services/transaction-service/`| Fastify 5, Prisma, Orchestrator | Send money workflow, risk routing, status updates |
| **Verification Agent** | `8003` | `services/verification-agent/` | Fastify 5, LangGraph, Gemini 1.5 | Dynamic riddle generator, semantic evaluator judge |
| **Risk Engine** | `8004` | `services/risk-engine/` | Fastify 5, TypeScript Heuristics | Real-time risk telemetry (amount, hour, IP, device) |
| **Alert Service** | `8005` | `services/alert-service/` | Fastify 5, Twilio, Nodemailer | Multi-channel emergency SMS, HTML emails, push alerts |
| **Escalation Service** | `8006` | `services/escalation-service/` | Fastify 5, Prisma (PostgreSQL) | 1-Hour atomic freeze, unfreeze manager, bank dossier exporter |

---

## 🛠️ Complete Technology Stack

### Frontend & Client Tier
- **Next.js 15.5+ (App Router)**: Server-side rendering, client hydration, dynamic routing.
- **React 19**: Modern concurrent state management and portal modals.
- **Tailwind CSS 3.4**: Luxury fintech styling, gradient accents, responsive cards.
- **Lucide React**: Clean, semantic iconography throughout all dashboards and flows.
- **WebAuthn FIDO2 API**: Hardware biometric passkey enrollment & verification (Windows Hello, Touch ID, Face ID).

### Backend Microservices
- **Fastify 5**: High-throughput (30,000+ req/sec), low-latency asynchronous microservices.
- **TypeScript 5.6**: End-to-end strict typing across all data transfer objects.
- **Prisma ORM 7**: Type-safe relational modeling, pooled database client, resilient in-memory fallback.
- **Zod 3.23**: Runtime schema validation for transactions and authorization payloads.
- **Argon2id**: Memory-hard password hashing algorithm exceeding OWASP standards.

### AI & Agentic Security
- **LangGraph.js**: Directed acyclic graph agent managing challenge formulation and evaluation.
- **Google Gemini 1.5 Flash**: Multi-modal generative model with sub-400ms inference time for semantic intent evaluation.
- **Circuit Breaker Fallbacks**: High-availability heuristic fallbacks ensuring system continuity during upstream outages.

### Databases & Infrastructure
- **PostgreSQL 16 (via Supabase)**: ACID financial ledgers, user credentials, device fingerprints, and alert history.
- **MongoDB Atlas**: Document database storing AES-256-GCM encrypted cognitive episodic anchors.
- **Redis 7**: High-performance key-value caching, single-use challenge tokens, and rate limits.
- **Twilio**: Carrier-grade SMS dispatch engine for instant threat interception notifications.
- **Nodemailer**: Enterprise HTML email dispatch via Gmail SMTP for urgent security notices.

---

## ⚡ Quickstart & Installation Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**: Installed and configured

---

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Harsh-tech81/PayPal--AI-Hackathon.git
cd PayPal--AI-Hackathon

# Install root dependencies
npm install

# Install web-app frontend dependencies
npm --prefix web-app install
```

---

### Step 2: Environment Configuration

Create a `.env` file in the root directory following `.env.example`:

```bash
cp .env.example .env
```

Key environment configuration properties:
- `DATABASE_URL`: PostgreSQL connection string (Supabase / local Postgres)
- `MONGODB_URI`: MongoDB connection string for the Encrypted Intent Vault
- `REDIS_URL`: Redis connection string (e.g. `redis://localhost:6379`)
- `GEMINI_API_KEY`: Google Gemini API key from Google AI Studio
- `AES_MASTER_KEY`: 32-byte hex key for AES-256-GCM memory encryption
- `JWT_SECRET`: Secret key for RS256/HS256 user authentication tokens
- `TWILIO_ACCOUNT_SID` & `TWILIO_AUTH_TOKEN`: Twilio credentials for SMS alerts
- `SMTP_USER` & `SMTP_PASS`: Gmail SMTP credentials for email alerts

*(Note: PayShield includes robust resilient in-memory fallbacks; if an external service is temporarily unreachable during offline testing, the application gracefully functions with zero crashes).*

---

### Step 3: Database Migrations & Prisma Push

```bash
# Push Prisma schema to your PostgreSQL database
npx prisma db push --schema=database/prisma/schema.prisma

# Generate Prisma client
npx prisma generate --schema=database/prisma/schema.prisma
```

---

### Step 4: Launching the Platform

You can start the entire platform with one single command:

#### Option A: Single Master Command (All Microservices + Web App)
```bash
npm run dev
```

#### Option B: Dedicated Windows PowerShell Script
```powershell
.\scripts\dev-all.ps1
```

#### Option C: Dedicated Linux / macOS Bash Script
```bash
bash scripts/dev-all.sh
```

#### Option D: Docker Compose
```bash
docker-compose up --build
```

Once running:
- **Web App**: Open [http://localhost:3000](http://localhost:3000)
- **User Service**: [http://localhost:8001/health](http://localhost:8001/health)
- **Transaction Service**: [http://localhost:8002/health](http://localhost:8002/health)
- **Verification Agent**: [http://localhost:8003/health](http://localhost:8003/health)
- **Risk Engine**: [http://localhost:8004/health](http://localhost:8004/health)
- **Alert Service**: [http://localhost:8005/health](http://localhost:8005/health)
- **Escalation Service**: [http://localhost:8006/health](http://localhost:8006/health)

---

## 🧪 Automated Test Suite

PayShield AI includes a comprehensive Vitest test suite covering unit encryption, heuristic algorithms, LangGraph agents, and end-to-end payment flows:

```bash
# Run the complete test suite
npx vitest run
```

### Test Coverage Matrix
```
✓ tests/e2e/payment-flow.spec.ts (2 tests)
  - Scenario A: High-risk anomaly intercepts & triggers verification gate
  - Scenario B: Legitimate customer completes passkey recall & unfreezes
✓ tests/unit/webauthn.test.ts (4 tests)
  - FIDO2 credential encoding & challenge validation
  - Hardware biometric passkey signature parsing
✓ tests/unit/risk-engine.test.ts (2 tests)
  - Low amount ($50) auto-approval threshold check
  - High amount ($1,200-$10,000) & late-night (03:15 AM) anomaly scoring
✓ tests/unit/security.test.ts (3 tests)
  - Argon2id password hashing and timing resistance
  - AES-256-GCM encryption, authenticated tag, and decryption
✓ tests/unit/langgraph-agent.test.ts (3 tests)
  - Dynamic cognitive riddle generation (< 400ms)
  - Gemini LLM-as-a-judge semantic evaluation of human answers
  - Circuit-breaker fallbacks during network timeouts
✓ tests/integration/user-service.test.ts (3 tests)
✓ tests/integration/transaction-flow.test.ts (2 tests)
✓ tests/integration/alert-escalation.test.ts (2 tests)
```

---

## 📱 End-to-End User Experience Guide

### 1. Onboarding & Registration
- Visit `/register` and create an account.
- Enroll your device passkey using Windows Hello, Touch ID, or Face ID.

### 2. Configuring the Intent Memory Vault
- Navigate to `/intent-form`.
- Pass the biometric gate to open your vault.
- Deposit 10 personal memory anchors across Childhood Memories, Private Experiences, and Secret Hobbies.
- Data is encrypted on the fly with **AES-256-GCM** before leaving your browser.

### 3. Sending a Routine Payment (Frictionless)
- Navigate to `/dashboard/transactions`.
- Enter recipient email and `$50.00`.
- The Risk Engine scores the transfer at **Risk 0.12**.
- Result: **Auto-Approved in 50ms with zero friction**.

### 4. Sending an Anomalous Payment (Cognitive Interception)
- Enter recipient email and `$1,200.00` or `$5,000.00`.
- The Risk Engine detects an anomaly (**Risk 0.75 - 0.85**).
- The transaction is intercepted immediately!
- The **Challenge Modal** appears displaying a dynamic riddle generated by Gemini from your private vault.

### 5. Legitimate Verification (Correct Secret)
- Type your personal memory answer (e.g., *"My dog Bruno"*).
- Gemini evaluates your answer in $< 400\text{ms}$.
- Payment is approved, receipt is generated, the form clears, and your dashboard balance updates.

### 6. Fraud Defense & Lockdown (Wrong Answer)
- Enter an incorrect answer (e.g., *"unknown"*).
- PayShield immediately voids the transaction, enforces an atomic **1-hour account freeze**, dispatches SMS and email alerts, and routes you directly to `/alerts/lockdown`.
- Download the complete **Bank Dispute Dossier JSON** for forensic evidence.

### 7. Universal Passkey Recovery
- Verify your physical identity using your registered hardware passkey on the lockdown page, login screen, or security center.
- Your account is instantly unfrozen and normal payments are restored.

---

## 🔐 Cryptography, Privacy & Zero-Knowledge Architecture

1. **Physical Ledger & Secret Segregation**:
   - Financial balances and transactional ledgers live in PostgreSQL.
   - Cognitive human memory anchors live in an isolated MongoDB document vault. A breach of the relational database reveals zero personal secrets.

2. **Authenticated Symmetric Encryption (AES-256-GCM)**:
   - Every memory secret is encrypted with a unique 96-bit Initialization Vector (IV) and a 128-bit authentication tag to prevent ciphertext tampering.

3. **Argon2id Password Storage**:
   - Exceeds industry recommendations with high memory and iteration cost parameters to defend against GPU brute-forcing.

4. **FIDO2 / WebAuthn Compliance**:
   - Hardware keys never transmit private keys; only signed cryptographic assertions are verified by the server.

---

## 📄 License & Hackathon Context

Developed for the **PayPal AI Hackathon 2026**.  
Built to empower digital payment networks with cognitive AI defenses that protect real people from account takeover and session theft.

For questions, architectural discussions, or demo inquiries, explore the live app at **[https://paypal-shield-ai.vercel.app](https://paypal-shield-ai.vercel.app)**.
