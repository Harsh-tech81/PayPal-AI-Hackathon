import { evaluateDeviceFingerprint } from "./device-fingerprint.js";
import { evaluateGeoVelocity } from "./geo-velocity.js";

export interface TransactionRiskContext {
  userId: string;
  amount: number;
  currency?: string;
  deviceFingerprint?: string;
  knownDevices?: string[];
  ipAddress?: string;
  location?: string;
  timeIso?: string;
  recipientEmail?: string;
}

export interface RiskAnalysis {
  riskScore: number;
  tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresVerification: boolean;
  anomalies: string[];
  breakdown: Record<string, number>;
}

export function calculateTransactionRisk(ctx: TransactionRiskContext): RiskAnalysis {
  let score = 0.05; // baseline safe floor
  const anomalies: string[] = [];
  const breakdown: Record<string, number> = { baseline: 0.05 };

  // 1. Amount Thresholds
  if (ctx.amount >= 1000) {
    score += 0.40;
    breakdown.amount = 0.40;
    anomalies.push(`High transfer value: $${ctx.amount.toFixed(2)} exceeds $1,000 threshold`);
  } else if (ctx.amount >= 300) {
    score += 0.20;
    breakdown.amount = 0.20;
    anomalies.push(`Moderate transfer value: $${ctx.amount.toFixed(2)}`);
  } else if (ctx.amount <= 50) {
    score = Math.max(0.02, score - 0.03); // Routine micropayment rebate
    breakdown.amount = -0.03;
  }

  // 2. Off-Hours / Late-Night Anomaly (e.g. 3:15 AM from story)
  const dateObj = ctx.timeIso ? new Date(ctx.timeIso) : new Date();
  const currentHour = dateObj.getHours(); // 0-23
  if (currentHour >= 2 && currentHour <= 5) {
    score += 0.20;
    breakdown.lateNight = 0.20;
    anomalies.push(`Circadian Anomaly: Transfer initiated during dormant hours (${currentHour}:${String(dateObj.getMinutes()).padStart(2, '0')})`);
  }

  // 3. Device Anomaly
  const devCheck = evaluateDeviceFingerprint(ctx.deviceFingerprint, ctx.knownDevices || []);
  if (devCheck.isAnomaly) {
    score += devCheck.scoreContribution;
    breakdown.device = devCheck.scoreContribution;
    if (devCheck.reason) anomalies.push(devCheck.reason);
  }

  // 4. Geo / Velocity Anomaly
  const geoCheck = evaluateGeoVelocity({
    currentIp: ctx.ipAddress,
    currentLocation: ctx.location,
  });
  if (geoCheck.isAnomaly) {
    score += geoCheck.scoreContribution;
    breakdown.geo = geoCheck.scoreContribution;
    if (geoCheck.reason) anomalies.push(geoCheck.reason);
  }

  // Clamp 0.00 to 1.00
  const finalScore = Math.min(1.0, Math.max(0.01, parseFloat(score.toFixed(2))));

  let tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (finalScore >= 0.85) tier = "CRITICAL";
  else if (finalScore >= 0.65) tier = "HIGH";
  else if (finalScore >= 0.30) tier = "MEDIUM";

  // Under $50 on trusted device with risk score < 0.30 is auto-approved with zero friction
  const requiresVerification = finalScore >= 0.30;

  return {
    riskScore: finalScore,
    tier,
    requiresVerification,
    anomalies,
    breakdown,
  };
}
