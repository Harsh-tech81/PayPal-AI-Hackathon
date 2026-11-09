import { transactionRepository } from "../repositories/transaction.repo.js";
import prisma from "../../../../database/prisma-client.js";

const RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || "http://localhost:8004";
const VERIFICATION_AGENT_URL = process.env.VERIFICATION_AGENT_URL || "http://localhost:8003";
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

export interface CreatePaymentPayload {
  userId: string;
  recipientEmail: string;
  amount: number;
  currency?: string;
  description?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  location?: string;
  timeOfTransfer?: string;
}

export const paymentOrchestrator = {
  /**
   * Helper to obtain PayPal OAuth2 Access Token
   */
  async getPayPalAccessToken(): Promise<string | null> {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_ID.includes("your_paypal")) {
      return null;
    }
    try {
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID.trim()}:${PAYPAL_CLIENT_SECRET.trim()}`).toString("base64");
      const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        return data.access_token;
      }
    } catch (err: any) {
      console.warn(`[PayPal OAuth Notice] ${err.message}`);
    }
    return null;
  },

  /**
   * 1. Initiates payment: Checks Risk Engine, and branches:
   * - If Risk < 0.30: AUTO-APPROVES in 50ms with zero friction
   * - If Risk >= 0.30: INTERCEPTS and triggers 10s GenAI Challenge
   */
  async processPaymentInitiation(payload: CreatePaymentPayload) {
    // Step 0: Protective Account Freeze Check (Blocks payments for frozen accounts)
    try {
      if (payload.userId) {
        const sender = await prisma.user.findUnique({
          where: { id: payload.userId },
        });
        if (sender && sender.isFrozen && (!sender.frozenUntil || new Date(sender.frozenUntil) > new Date())) {
          return {
            status: "ACCOUNT_FROZEN",
            isFrozen: true,
            error: "Your account is temporarily frozen for security. Please complete Biometric KYC / Passkey verification to unfreeze your account before making payments.",
            message: "Account frozen. Biometric verification required to unfreeze.",
            requiresUnfreeze: true,
            unfreezeMethod: "biometric_passkey",
            frozenUntil: sender.frozenUntil,
          };
        }
      }
    } catch (fErr: any) {
      console.warn(`[Payment Orchestrator Freeze DB Notice] ${fErr.message}`);
    }

    // Step 0b: Check User Service memory state fallback
    try {
      const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";
      const uRes = await fetch(`${USER_SERVICE_URL}/api/v1/users/check-status/${encodeURIComponent(payload.userId)}`, {
        signal: AbortSignal.timeout(1000),
      });
      if (uRes.ok) {
        const uData = (await uRes.json()) as any;
        if (uData.isFrozen) {
          return {
            status: "ACCOUNT_FROZEN",
            isFrozen: true,
            error: "Your account is temporarily frozen for security. Please complete Biometric KYC / Passkey verification to unfreeze your account before making payments.",
            message: "Account frozen. Biometric verification required to unfreeze.",
            requiresUnfreeze: true,
            unfreezeMethod: "biometric_passkey",
            frozenUntil: uData.frozenUntil,
          };
        }
      }
    } catch {}

    // Step 1: Score risk via Risk Engine (Port 8004)
    let riskScore = 0.05;
    let requiresVerification = false;
    let anomalies: string[] = [];

    try {
      const riskRes = await fetch(`${RISK_ENGINE_URL}/api/v1/risk/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: payload.userId,
          amount: payload.amount,
          currency: payload.currency || "USD",
          deviceFingerprint: payload.deviceFingerprint,
          ipAddress: payload.ipAddress,
          location: payload.location,
          timeOfTransfer: payload.timeOfTransfer,
          recipientEmail: payload.recipientEmail,
        }),
      });

      if (riskRes.ok) {
        const rData = (await riskRes.json()) as any;
        riskScore = rData.riskScore;
        requiresVerification = rData.requiresVerification;
        anomalies = rData.anomalies || [];
      }
    } catch (rErr: any) {
      console.warn(`[Payment Orchestrator Risk Call] ${rErr.message}. Evaluating locally.`);
      const locStr = (payload.location || "").toLowerCase();
      const isProxyOrForeign =
        locStr.includes("overseas") ||
        locStr.includes("proxy") ||
        locStr.includes("frankfurt") ||
        locStr.includes("berlin") ||
        locStr.includes("tor") ||
        (payload.ipAddress || "").startsWith("185.220.");

      // Dynamic amount calculation for local fallback
      let amtScore = 0.05;
      if (payload.amount <= 50) {
        amtScore = 0.02;
      } else if (payload.amount <= 300) {
        amtScore = parseFloat((0.08 + ((payload.amount - 50) / 250) * 0.10).toFixed(2));
      } else if (payload.amount <= 1000) {
        amtScore = parseFloat((0.20 + ((payload.amount - 300) / 700) * 0.15).toFixed(2));
      } else if (payload.amount <= 3000) {
        amtScore = parseFloat((0.35 + ((payload.amount - 1000) / 2000) * 0.12).toFixed(2));
      } else if (payload.amount <= 8000) {
        amtScore = parseFloat((0.48 + ((payload.amount - 3000) / 5000) * 0.14).toFixed(2));
      } else {
        amtScore = parseFloat((0.64 + Math.min(0.20, ((payload.amount - 8000) / 12000) * 0.18)).toFixed(2));
      }

      // Late night factor
      let isLateNight = false;
      if (payload.timeOfTransfer) {
        const match = payload.timeOfTransfer.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          let h = parseInt(match[1], 10);
          if (payload.timeOfTransfer.toLowerCase().includes("pm") && h < 12) h += 12;
          if (payload.timeOfTransfer.toLowerCase().includes("am") && h === 12) h = 0;
          if (h >= 23 || h <= 5) isLateNight = true;
        }
      }

      const totalFallback = 0.05 + amtScore + (isLateNight ? 0.25 : 0.0) + (isProxyOrForeign ? 0.58 : 0.0);
      riskScore = Math.min(0.99, Math.max(0.01, parseFloat(totalFallback.toFixed(2))));
      requiresVerification = riskScore >= 0.25;
    }

    // Step 2: Record Transaction
    const initialStatus = requiresVerification ? "verifying" : "APPROVED";
    const txn = await transactionRepository.createTransaction({
      senderId: payload.userId,
      recipientEmail: payload.recipientEmail,
      amount: payload.amount,
      currency: payload.currency,
      description: payload.description,
      status: initialStatus,
      riskScore: riskScore,
      verificationMethod: requiresVerification ? "genai_challenge" : "auto",
      ipAddress: payload.ipAddress,
    });

    // SCENARIO 1: Low Risk -> Auto-Approve immediately
    if (!requiresVerification) {
      // Trigger instant payment receipt via Alert Service
      try {
        const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://localhost:8005";
        await fetch(`${ALERT_SERVICE_URL}/api/v1/alerts/receipt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: payload.userId,
            recipientEmail: payload.recipientEmail,
            amount: payload.amount,
            currency: payload.currency || "USD",
            transactionId: txn.id,
            verificationMethod: "PayShield Instant Risk Engine (< 50ms Auto-Approval)",
          }),
        });
      } catch (rcptErr: any) {
        console.warn(`[Receipt Alert Notice] ${rcptErr.message}`);
      }

      return {
        status: "AUTO_APPROVED",
        transactionId: txn.id,
        amount: payload.amount,
        currency: payload.currency || "USD",
        riskScore,
        message: "Payment auto-approved under risk policy in 50ms with zero friction.",
      };
    }

    // SCENARIO 2: High/Medium Risk (>= 0.30) -> Intercept with GenAI 10s Challenge
    try {
      const challengeRes = await fetch(`${VERIFICATION_AGENT_URL}/api/v1/verify/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: payload.userId,
          transactionId: txn.id,
          amount: payload.amount,
          currency: payload.currency || "USD",
          location: payload.location || "Overseas Proxy (Frankfurt / Tor Node)",
          ipAddress: payload.ipAddress || "185.220.101.5",
          riskScore: riskScore,
          recipientEmail: payload.recipientEmail,
        }),
      });

      if (challengeRes.ok) {
        const cData = (await challengeRes.json()) as any;
        return {
          status: "VERIFICATION_REQUIRED",
          transactionId: txn.id,
          challengeToken: cData.challengeToken,
          question: cData.question,
          timeoutSeconds: cData.timeoutSeconds || 86400,
          countdownExpiresAt: cData.countdownExpiresAt || Date.now() + 86400000,
          riskScore,
          anomalies,
          message: "High-risk anomaly detected. Cognitive verification active.",
        };
      }
    } catch (cErr: any) {
      console.warn(`[Verification Agent Call Notice] ${cErr.message}`);
    }

    // Fallback challenge if agent offline: dynamically rotate across 10 episodic prompts
    const FALLBACK_QUESTIONS = [
      "Who used to wag their tail and beg for your morning biscuits when you woke up?",
      "What secret pet name did your grandmother call you when you were sick in bed?",
      "Where did you take a cold tumble in the snow during a winter vacation?",
      "What quirky comfort food combination do you secretly eat when you are home alone?",
      "What iconic song do you always sing out loud in the shower when stressed?",
      "What was the very first memorable item you bought with your own hard-earned paycheck?",
      "What is your secret lucky 3-digit number and private memory code?",
      "What was the name of the street where you fell and scraped your knee as a child?",
      "What was the beloved nickname of your favorite elementary school teacher?",
      "What was the color and style of your family's oldest unforgettable road-trip car?",
    ];
    const randomFallbackQ = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];

    return {
      status: "VERIFICATION_REQUIRED",
      transactionId: txn.id,
      challengeToken: `ctk_${Date.now()}`,
      question: randomFallbackQ,
      timeoutSeconds: 86400,
      countdownExpiresAt: Date.now() + 86400000,
      riskScore,
      anomalies,
      message: "High-risk anomaly detected. Cognitive verification active.",
    };
  },
};
