/**
 * Centralized API Client & Service Proxy Routing for PayShield AI Web App.
 */

const USER_SERVICE = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:8001";
const TRANSACTION_SERVICE = process.env.NEXT_PUBLIC_TRANSACTION_SERVICE_URL || "http://localhost:8002";
const VERIFICATION_AGENT = process.env.NEXT_PUBLIC_VERIFICATION_AGENT_URL || "http://localhost:8003";
const ESCALATION_SERVICE = process.env.NEXT_PUBLIC_ESCALATION_SERVICE_URL || "http://localhost:8006";
const ALERT_SERVICE = process.env.NEXT_PUBLIC_ALERT_SERVICE_URL || "http://localhost:8005";

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

export const api = {
  // Auth & Profile
  async sendOtp(email: string, phone?: string) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone }),
    });
    return res.json();
  },

  async verifyOtp(email: string, otp: string) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  async register(data: any) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${USER_SERVICE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${USER_SERVICE}/api/v1/users/me`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async setupIntentVault(secrets: any[]) {
    const userId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const res = await fetch(`${USER_SERVICE}/api/v1/intent-form/setup`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: userId || "", secrets }),
    });
    return res.json();
  },

  async getDevices() {
    const userId = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : null;
    const url = userId
      ? `${USER_SERVICE}/api/v1/users/me/devices?userId=${userId}`
      : `${USER_SERVICE}/api/v1/users/me/devices`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async revokeDevice(deviceId: string) {
    const res = await fetch(`${USER_SERVICE}/api/v1/users/me/devices/revoke`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ deviceId }),
    });
    return res.json();
  },

  // Transactions & PayPal Interception
  async sendMoney(data: any) {
    const res = await fetch(`${TRANSACTION_SERVICE}/api/v1/transactions/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTransactionHistory() {
    const res = await fetch(`${TRANSACTION_SERVICE}/api/v1/transactions/history`, {
      headers: getAuthHeaders(),
    });
    return res.json();
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
    return res.json();
  },

  // Alerts & Lockdowns
  async getAlertHistory(userId?: string) {
    const uid = userId || (typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : "a0000000-0000-0000-0000-000000000001");
    const res = await fetch(`${ALERT_SERVICE}/api/v1/alerts/history/${uid}`);
    return res.json();
  },

  async unfreezeAccount(method: string = "video_kyc") {
    const uid = typeof window !== "undefined" ? localStorage.getItem("payshield_user_id") : "a0000000-0000-0000-0000-000000000001";
    const res = await fetch(`${ESCALATION_SERVICE}/api/v1/escalate/unfreeze`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: uid || "a0000000-0000-0000-0000-000000000001", resolutionMethod: method }),
    });
    return res.json();
  },

  async downloadBankReport(incidentReference: string) {
    const res = await fetch(`${ESCALATION_SERVICE}/api/v1/escalate/report-to-bank`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ incidentReference }),
    });
    return res.json();
  },
};
