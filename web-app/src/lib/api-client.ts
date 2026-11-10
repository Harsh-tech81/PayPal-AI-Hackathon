/**
 * Centralized API Client & Service Proxy Routing for PayShield AI Web App.
 */

// Base gateway URL fallback (allows setting just 1 URL in Vercel)
const BASE_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_USER_SERVICE_URL ||
  process.env.NEXT_PUBLIC_TRANSACTION_SERVICE_URL ||
  "";

const USER_SERVICE =
  process.env.NEXT_PUBLIC_USER_SERVICE_URL || BASE_GATEWAY_URL || "http://localhost:8001";
const TRANSACTION_SERVICE =
  process.env.NEXT_PUBLIC_TRANSACTION_SERVICE_URL || BASE_GATEWAY_URL || "http://localhost:8002";
const VERIFICATION_AGENT =
  process.env.NEXT_PUBLIC_VERIFICATION_AGENT_URL || BASE_GATEWAY_URL || "http://localhost:8003";
const ESCALATION_SERVICE =
  process.env.NEXT_PUBLIC_ESCALATION_SERVICE_URL || BASE_GATEWAY_URL || "http://localhost:8006";
const ALERT_SERVICE =
  process.env.NEXT_PUBLIC_ALERT_SERVICE_URL || BASE_GATEWAY_URL || "http://localhost:8005";

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("payshield_token");
  const userId = localStorage.getItem("payshield_user_id") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(userId ? { "x-user-id": userId } : {}),
  };
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  if (!text || !text.trim()) {
    return { ok: res.ok, status: res.status };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { ok: res.ok, status: res.status, raw: text };
  }
}

export const api = {
  // Auth & Profile
  async sendOtp(email: string, phone?: string) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    return safeJson(res);
  },

  async verifyOtp(email: string, otp: string) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return safeJson(res);
  },

  async register(data: any) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async login(data: any) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async passkeyLogin(data: { credentialId?: string; email?: string }) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/passkey-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async passkeySignup(data: { fullName: string; email: string; credentialId: string; deviceName?: string }) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/passkey-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async registerPasskey(data: { credentialId: string; userId?: string; email?: string; deviceName?: string }) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/passkey-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async getProfile() {
    const res = await fetch(`${USER_SERVICE}/api/v1/users/me`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async setupIntentVault(secrets: any[], overrideUserId?: string) {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const finalUserId = overrideUserId || storedUserId;
    if (!finalUserId) {
      return { error: "User is not authenticated. Please log in first." };
    }
    const res = await fetch(`${USER_SERVICE}/api/v1/intent-form/setup`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: finalUserId, secrets }),
    });
    return safeJson(res);
  },

  async clearIntentVault(overrideUserId?: string) {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const finalUserId = overrideUserId || storedUserId;
    if (!finalUserId) {
      return { error: "User is not authenticated. Please log in first." };
    }
    const res = await fetch(`${USER_SERVICE}/api/v1/intent-form/clear`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: finalUserId }),
    });
    return safeJson(res);
  },

  async getVaultStatus(userId?: string) {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const finalUserId = userId || storedUserId;
    if (!finalUserId) {
      return { isConfigured: false, anchorsCount: 0, anchors: [] };
    }
    const res = await fetch(`${USER_SERVICE}/api/v1/intent-form/status/${encodeURIComponent(finalUserId)}`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getVaultAnchors(userId?: string) {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const finalUserId = userId || storedUserId;
    if (!finalUserId) {
      return { userId: "", anchors: [] };
    }
    const res = await fetch(`${USER_SERVICE}/api/v1/intent-form/internal-vault/${encodeURIComponent(finalUserId)}`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async getDevices() {
    const userId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const url = userId
      ? `${USER_SERVICE}/api/v1/users/me/devices?userId=${userId}`
      : `${USER_SERVICE}/api/v1/users/me/devices`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async revokeDevice(deviceId: string) {
    const userId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const res = await fetch(`${USER_SERVICE}/api/v1/users/me/devices/revoke`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ deviceId, userId }),
    });
    return safeJson(res);
  },

  // Transactions & PayShield Interception
  async sendMoney(data: any) {
    const res = await fetch(`${TRANSACTION_SERVICE}/api/v1/transactions/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  async getTransactionHistory() {
    const res = await fetch(`${TRANSACTION_SERVICE}/api/v1/transactions/history`, {
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  async cancelTransaction(transactionId: string) {
    const res = await fetch(`${TRANSACTION_SERVICE}/api/v1/transactions/${encodeURIComponent(transactionId)}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeJson(res);
  },

  // Verification Agent (10s Challenge Modal)
  async submitChallengeAnswer(data: {
    challengeToken: string;
    transactionId: string;
    userId: string;
    answer: string;
    responseTimeMs: number;
    isTimeout?: boolean;
    attackerIp?: string;
  }) {
    const res = await fetch(`${VERIFICATION_AGENT}/api/v1/verify/answer`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return safeJson(res);
  },

  // Alerts & Lockdowns
  async getAlertHistory(userId?: string) {
    const storedUserId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const uid = userId || storedUserId;
    if (!uid) {
      return { logs: [] };
    }
    const res = await fetch(`${ALERT_SERVICE}/api/v1/alerts/history/${encodeURIComponent(uid)}`);
    return safeJson(res);
  },

  async unfreezeAccount(method: string = "video_kyc") {
    const uid = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    if (!uid) {
      return { error: "No active user session to unfreeze." };
    }
    const res = await fetch(`${ESCALATION_SERVICE}/api/v1/escalate/unfreeze`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: uid, resolutionMethod: method }),
    });
    return safeJson(res);
  },

  async downloadBankReport(incidentReference: string) {
    const res = await fetch(`${ESCALATION_SERVICE}/api/v1/escalate/report-to-bank`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ incidentReference }),
    });
    return safeJson(res);
  },
};
