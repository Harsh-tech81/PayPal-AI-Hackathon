# 🚀 PayShield AI — Local Setup & Development Guide

Follow this guide to run the complete PayShield AI microservices ecosystem and Next.js 15 web application locally.

---

## 🛠️ Prerequisites

* **Node.js**: v22 LTS (`node -v` $\ge 22.0.0$)
* **npm**: v10+ (`npm -v`)
* **Docker & Docker Compose** (Optional for local container orchestration)

---

## ⚙️ 1. Environment Configuration

All credentials have been configured into `.env` (derived from `.env.local`).

Key variables include:
* `GEMINI_API_KEY`: Google Gemini 1.5 Flash API Key
* `DATABASE_URL`: PostgreSQL / Supabase connection
* `MONGODB_URI`: MongoDB Atlas connection
* `REDIS_URL`: Redis connection (graceful in-memory fallback enabled if offline)
* `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal Sandbox Developer credentials
* `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`: Twilio SMS credentials
* `EMAIL_USER`, `EMAIL_PASS`: Nodemailer Gmail SMTP credentials (16-char App Password)
* `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Firebase Admin push credentials
* `AES_MASTER_KEY`: 32-byte hex key for AES-256-GCM vault encryption

---

## 📦 2. Install Dependencies

From the repository root:
```bash
npm install
```

---

## 🗄️ 3. Database Initialization & Seeding

Run Prisma schema setup and demo data seeding:
```bash
# Push Prisma schema to PostgreSQL
npx prisma db push --schema=database/prisma/schema.prisma

# Seed test users (Alice Smith, Bob), trusted devices, transactions, and 10 encrypted memory anchors
npx tsx database/seeds/seed-demo-data.ts
```

---

## 🏃 4. Launching the Services

### Option A: Direct Launch (Recommended)
You can start all 6 Fastify microservices and the Next.js web application concurrently:

On Linux / macOS:
```bash
bash scripts/dev-all.sh
```

On Windows (PowerShell):
```powershell
.\scripts\dev-all.ps1
```

Or run individual services in separate terminals:
* **User Service**: `npx tsx services/user-service/src/index.ts` (Port 8001)
* **Transaction Service**: `npx tsx services/transaction-service/src/index.ts` (Port 8002)
* **Verification Agent**: `npx tsx services/verification-agent/src/index.ts` (Port 8003)
* **Risk Engine**: `npx tsx services/risk-engine/src/index.ts` (Port 8004)
* **Alert Service**: `npx tsx services/alert-service/src/index.ts` (Port 8005)
* **Escalation Service**: `npx tsx services/escalation-service/src/index.ts` (Port 8006)
* **Web App**: `cd web-app && npm run dev` (Port 3000)

### Option B: Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 5. Running the Test Suite

```bash
# Run Unit & Integration Tests (Argon2, AES, Risk Engine, LangGraph Agent, Supertest)
npx vitest run
```

---

## 📱 6. Interactive Walkthrough

1. Open **http://localhost:3000** in your browser.
2. Sign in with **`alice@example.com`** / **`Password123!`** (or create a new account).
3. Walk through the **4-Step Intent Form Wizard** (`/intent-form`) to seal your 10 memory anchors.
4. Go to **Send Money** (`/dashboard/transactions`):
   * Select **Scenario A** (Attacker simulation): Transfer $1,200 from Berlin at 3:15 AM.
   * Watch the **10-Second Interactive Challenge Modal** pop up with animated countdown!
   * Test wrong answer or timeout $\rightarrow$ redirects to **1-Hour Lockdown Screen** (`/alerts/lockdown`).
   * Test right answer ("My dog Bruno") $\rightarrow$ instant approval in $< 400\text{ms}$!
