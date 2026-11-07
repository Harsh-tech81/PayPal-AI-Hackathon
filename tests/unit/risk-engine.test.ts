import { describe, it, expect } from "vitest";
import { calculateTransactionRisk } from "../../services/risk-engine/src/scoring/heuristic-calculator.js";

describe("PayShield Risk Engine Heuristic Tests", () => {
  it("should auto-approve routine micropayment under $50 on trusted device", () => {
    const analysis = calculateTransactionRisk({
      userId: "usr_alice",
      amount: 4.50,
      currency: "USD",
      deviceFingerprint: "fp_alice_trusted_macbook_pro",
      knownDevices: ["fp_alice_trusted_macbook_pro"],
      location: "New York, USA",
      timeIso: "2026-11-05T14:30:00Z", // Afternoon
    });

    expect(analysis.riskScore).toBeLessThan(0.30);
    expect(analysis.requiresVerification).toBe(false);
    expect(analysis.tier).toBe("LOW");
  });

  it("should score critical anomaly on $1,200 transfer at 3:15 AM from Berlin proxy", () => {
    const analysis = calculateTransactionRisk({
      userId: "usr_alice",
      amount: 1200.0,
      currency: "USD",
      deviceFingerprint: "fp_unknown_linux_attacker",
      knownDevices: ["fp_alice_trusted_macbook_pro"],
      ipAddress: "185.220.101.5",
      location: "Berlin, Germany",
      timeIso: "2026-11-05T03:15:00Z", // 3:15 AM
    });

    expect(analysis.riskScore).toBeGreaterThanOrEqual(0.85);
    expect(analysis.requiresVerification).toBe(true);
    expect(analysis.tier).toBe("CRITICAL");
    expect(analysis.anomalies.length).toBeGreaterThanOrEqual(3);
  });
});
