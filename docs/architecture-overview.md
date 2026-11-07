# 🏛️ PayShield AI — Master System Architecture & LangGraph Design

PayShield AI solves the fundamental vulnerability of modern payment systems:  
**Current mechanisms verify the device or credential (password, PIN, OTP, device biometric) — not the actual person behind the screen.**

---

## 🌟 The 3 Pillars of PayShield AI

1. **Private Human Cognitive Memory (Zero-Knowledge Vault)**:  
   During onboarding, users deposit 10 personal memory anchors (e.g. childhood pet, unrecorded vacation incidents, nostalgic habits). These secrets cannot be scraped from social media or guessed by OSINT bots. They are encrypted at rest with **AES-256-GCM** and stored in an isolated **MongoDB** vault, physically separated from the financial ledgers in **PostgreSQL**.

2. **10-Second Real-Time Cognitive Interception**:  
   When a payment exhibits risk ($\ge 0.30$), the **LangGraph Agent** pairs the context with an anchor via **Contextual RAG** and invokes **Google Gemini 1.5 Flash** to generate a dynamic, one-sentence riddle in $< 400\text{ms}$. A 10-second Redis countdown window opens. Legitimate humans recall and type their answer in 5–8 seconds; remote hackers and bots cannot phish or research intimate memories within 10 seconds.

3. **Autonomous Defense Chain**:  
   If the answer fails semantic verification or the countdown hits 0.0s, the system executes an automated defense protocol:
   * **1-Hour PostgreSQL Account Freeze** (`isFrozen = true`, `frozenUntil = NOW() + 1 hour`).
   * **PayPal Authorization Voided** (no funds lost).
   * **Multi-Channel Emergency Alert Dispatch** (Twilio SMS + SendGrid HTML Email + Firebase Push).
   * **Forensic Bank Dispute Dossier** compiled with attacker IP, headers, and failed challenge evidence.

---

## 🕸️ LangGraph Verification State Machine

```
[Start: Payment Initiated]
        │
        ▼
[Node 1: Risk Engine (Port 8004)]
        │
        ├─► If Risk < 0.30 ──► [Auto-Approve Node (50ms)] ──► [Funds Transferred ✅]
        │
        └─► If Risk ≥ 0.30
                │
                ▼
        [Node 2: Contextual RAG Retriever]
                │ (Retrieves least-recently used / contextual memory anchor)
                ▼
        [Node 3: Gemini 1.5 Flash Challenge Formulator]
                │ (Generates dynamic riddle in <350ms)
                ▼
        [Node 4: 10-Second Redis Timer Interrupt]
                │ (Arms 10.0s TTL window)
                ▼
        [Node 5: LLM-as-a-Judge Evaluator Node]
                │
                ├── If Correct (≥85%) ──► [Approve Node] ──► [Funds Transferred ✅]
                ├── If Borderline (60-84%) ──► [Adaptive Micro-Challenge] ──► [Re-evaluate]
                └── If Wrong / Timeout (0.0s)
                            │
                            ▼
                    [Node 6: Forensic Node]
                            │ (Compiles Bank Dispute Dossier)
                            ▼
                    [Escalation & 1-Hr Freeze (Port 8006)]
                            │
                            ▼
                    [Multi-Channel Alert Dispatch (Port 8005)]
                            │ (Twilio SMS + SendGrid Email)
                            ▼
                    [Account Frozen for 1 Hour ❄️]
```

---

## 🛡️ Circuit Breakers & Mitigations

* **External LLM Latency / Outage**: If Gemini API exceeds 1,200ms or fails, the Verification Agent falls back to a deterministic string matcher with zero downtime.
* **Database Resiliency**: All microservices feature graceful in-memory fallbacks so services continue running even during external network disruptions.
* **Low-Risk Zero Friction**: Routine payments under $50 from trusted devices are auto-approved in 50ms without prompting the user.
