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
  timeOfTransfer?: string;
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

  // 1. Amount Thresholds & Continuous Graduated Scaling
  let amountScore = 0.0;
  if (ctx.amount <= 50) {
    // Routine micropayment rebate ($1 - $50): score contribution ~0.02
    amountScore = 0.02;
    breakdown.amount = 0.02;
  } else if (ctx.amount <= 300) {
    // Small everyday transfer ($50 - $300): graduated 0.08 to 0.18
    // e.g. $120 -> 0.08 + (70 / 250) * 0.10 = 0.108 (~0.11)
    const factor = (ctx.amount - 50) / 250;
    amountScore = parseFloat((0.08 + factor * 0.10).toFixed(3));
    breakdown.amount = amountScore;
    anomalies.push(`Standard transfer value: $${ctx.amount.toFixed(2)}`);
  } else if (ctx.amount <= 1000) {
    // Moderate transfer ($300 - $1000): graduated 0.20 to 0.35
    // e.g. $650 -> 0.20 + (350 / 700) * 0.15 = 0.275 (~0.28)
    const factor = (ctx.amount - 300) / 700;
    amountScore = parseFloat((0.20 + factor * 0.15).toFixed(3));
    breakdown.amount = amountScore;
    anomalies.push(`Moderate transfer value: $${ctx.amount.toFixed(2)}`);
  } else if (ctx.amount <= 3000) {
    // High transfer value ($1000 - $3000): graduated 0.35 to 0.47
    // e.g. $1200 -> 0.35 + (200 / 2000) * 0.12 = 0.362 (~0.36)
    const factor = (ctx.amount - 1000) / 2000;
    amountScore = parseFloat((0.35 + factor * 0.12).toFixed(3));
    breakdown.amount = amountScore;
    anomalies.push(`High transfer value: $${ctx.amount.toFixed(2)} exceeds $1,000 threshold`);
  } else if (ctx.amount <= 8000) {
    // Elevated high-tier transfer value ($3000 - $8000): graduated 0.48 to 0.62
    // e.g. $5000 -> 0.48 + (2000 / 5000) * 0.14 = 0.536 (~0.54)
    const factor = (ctx.amount - 3000) / 5000;
    amountScore = parseFloat((0.48 + factor * 0.14).toFixed(3));
    breakdown.amount = amountScore;
    anomalies.push(`Elevated high-tier transfer value: $${ctx.amount.toFixed(2)} exceeds $3,000 threshold`);
  } else {
    // Critical transfer value ($8000+): graduated 0.64 to 0.85
    // e.g. $10000 -> 0.64 + Math.min(0.20, (2000 / 12000) * 0.16) = 0.667 (~0.67)
    const factor = Math.min(1.0, (ctx.amount - 8000) / 12000);
    amountScore = parseFloat((0.64 + factor * 0.18).toFixed(3));
    breakdown.amount = amountScore;
    anomalies.push(`Critical transfer value: $${ctx.amount.toFixed(2)} requires maximum cognitive gate`);
  }
  score += amountScore;

  // 2. Off-Hours / Circadian Anomaly (Late-Night vs Daytime)
  let transferHour = -1;
  let timeDisplay = "";

  if (ctx.timeOfTransfer) {
    timeDisplay = ctx.timeOfTransfer;
    const match = ctx.timeOfTransfer.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      if (ctx.timeOfTransfer.toLowerCase().includes("pm") && h < 12) h += 12;
      if (ctx.timeOfTransfer.toLowerCase().includes("am") && h === 12) h = 0;
      transferHour = h;
    }
  }

  if (transferHour === -1) {
    const dateObj = ctx.timeIso ? new Date(ctx.timeIso) : new Date();
    transferHour = isNaN(dateObj.getHours()) ? new Date().getHours() : dateObj.getHours();
    timeDisplay = `${String(transferHour).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
  }

  // Peak late-night dormant hours: 23:00 to 05:30 (11:00 PM to 5:30 AM)
  if (transferHour >= 23 || transferHour <= 5) {
    score += 0.25;
    breakdown.lateNight = 0.25;
    anomalies.push(`Circadian Anomaly: High-risk late-night transfer initiated at ${timeDisplay} (dormant hours)`);
  } else if ((transferHour >= 21 && transferHour < 23) || (transferHour > 5 && transferHour <= 6)) {
    score += 0.10;
    breakdown.lateNight = 0.10;
    anomalies.push(`Off-Hours Window: Transfer initiated outside standard daytime business hours (${timeDisplay})`);
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

  // Clamp 0.01 to 0.99
  const finalScore = Math.min(0.99, Math.max(0.01, parseFloat(score.toFixed(2))));

  let tier: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (finalScore >= 0.80) tier = "CRITICAL";
  else if (finalScore >= 0.50) tier = "HIGH";
  else if (finalScore >= 0.25) tier = "MEDIUM";

  // Under $50 on trusted device with risk score < 0.25 is auto-approved with zero friction
  const requiresVerification = finalScore >= 0.25;

  return {
    riskScore: finalScore,
    tier,
    requiresVerification,
    anomalies,
    breakdown,
  };
}
