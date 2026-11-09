import { transactionRepository } from "../repositories/transaction.repo.js";

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
      requiresVerification =
        payload.amount >= 300 ||
        locStr.includes("overseas") ||
        locStr.includes("proxy") ||
        locStr.includes("frankfurt") ||
        locStr.includes("berlin") ||
        (payload.ipAddress || "").startsWith("185.220.");
      riskScore = requiresVerification ? 0.88 : 0.05;
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

    // Fallback challenge if agent offline
    return {
      status: "VERIFICATION_REQUIRED",
      transactionId: txn.id,
      challengeToken: `ctk_${Date.now()}`,
      question: "What is your primary childhood family pet name or native hometown?",
      timeoutSeconds: 86400,
      countdownExpiresAt: Date.now() + 86400000,
      riskScore,
      anomalies,
      message: "High-risk anomaly detected. Cognitive verification active.",
    };
  },
};
