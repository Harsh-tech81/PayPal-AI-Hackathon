import { describe, it, expect } from "vitest";
import { verificationGraph } from "../../services/verification-agent/src/graph/verification-graph.js";

describe("PayShield LangGraph Agent & Evaluator Unit Tests", () => {
  it("should initiate challenge and arm 10-second timer window", async () => {
    const state = await verificationGraph.initiateChallenge({
      transactionId: "tx_unit_test_01",
      userId: "a0000000-0000-0000-0000-000000000001",
      amount: 1200,
      currency: "USD",
      location: "Berlin, Germany",
      riskScore: 0.88,
    });

    expect(state.challengeToken).toBeDefined();
    expect(state.challengeRiddle).toBeDefined();
    expect(typeof state.challengeRiddle).toBe("string");
    expect(state.countdownExpiresAt).toBeDefined();
  }, 25000);

  it("should approve valid human response recalling childhood dog", async () => {
    const initialState = {
      transactionId: "tx_unit_test_02",
      userId: "a0000000-0000-0000-0000-000000000001",
      amount: 1200,
      currency: "USD",
      challengeToken: "ctk_test_valid",
      challengeRiddle: "Who used to wag their tail and beg for your morning biscuits?",
      selectedAnchor: {
        id: "anc_01",
        prompt: "Name of your first childhood dog and their favorite snack",
        plainAnswer: "Bruno who loved biscuits",
      },
      riskScore: 0.88,
    };

    const { state } = await verificationGraph.processAnswer(
      initialState,
      "My dog Bruno",
      5200, // 5.2 seconds elapsed
      false
    );

    expect(state.decision?.is_verified).toBe(true);
    expect(state.finalStatus).toBe("APPROVED");
  });

  it("should reject wrong guess and generate forensic packet", async () => {
    const initialState = {
      transactionId: "tx_unit_test_03",
      userId: "a0000000-0000-0000-0000-000000000001",
      amount: 1200,
      currency: "USD",
      challengeToken: "ctk_test_hacker",
      challengeRiddle: "Who used to wag their tail and beg for your morning biscuits?",
      selectedAnchor: {
        id: "anc_01",
        prompt: "Name of your first childhood dog and their favorite snack",
        plainAnswer: "Bruno who loved biscuits",
      },
      riskScore: 0.88,
    };

    const { state, dossier } = await verificationGraph.processAnswer(
      initialState,
      "Rex", // Wrong guess!
      3100,
      false
    );

    expect(state.decision?.is_verified).toBe(false);
    expect(state.finalStatus).toBe("REJECTED_FRAUD");
    expect(dossier).toBeDefined();
    expect(dossier.incidentReference).toContain("PS-FR-2026-");
  });
});
