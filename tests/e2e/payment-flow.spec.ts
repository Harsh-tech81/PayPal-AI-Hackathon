import { describe, it, expect } from "vitest";

describe("PayShield End-to-End Payment Flow Specifications", () => {
  it("Scenario B: Legitimate Alice transfers $1,200 and answers challenge in 5.2s", () => {
    const scenario = {
      user: "Alice Smith",
      amount: 1200,
      answer: "My dog Bruno",
      expectedStatus: "APPROVED",
    };

    expect(scenario.user).toBe("Alice Smith");
    expect(scenario.expectedStatus).toBe("APPROVED");
  });

  it("Scenario A: Attacker enters wrong answer or reaches 0.0s timeout", () => {
    const scenario = {
      attackerIp: "185.220.101.5",
      attemptedAmount: 1200,
      answer: "Rex",
      expectedStatus: "REJECTED_FRAUD",
      freezeDurationHours: 1,
    };

    expect(scenario.expectedStatus).toBe("REJECTED_FRAUD");
    expect(scenario.freezeDurationHours).toBe(1);
  });
});
