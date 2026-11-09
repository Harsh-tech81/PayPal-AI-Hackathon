import { describe, it, expect } from "vitest";
import fastifyTxnApp from "../../services/transaction-service/src/index.js";

describe("Transaction Service & Orchestration Integration Tests", () => {
  it("GET /health should return healthy status", async () => {
    const res = await fastifyTxnApp.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toBe("transaction-service");
  });

  it("POST /api/v1/transactions/send with high amount should intercept with VERIFICATION_REQUIRED", async () => {
    const res = await fastifyTxnApp.inject({
      method: "POST",
      url: "/api/v1/transactions/send",
      headers: {
        "x-user-id": "a0000000-0000-0000-0000-000000000001",
      },
      payload: {
        recipientEmail: "offshore-vendor@node.io",
        amount: 1200.0,
        currency: "USD",
        description: "Late night electronics order",
        deviceFingerprint: "fp_unknown_linux_attacker",
        ipAddress: "185.220.101.5",
        location: "Overseas Proxy Node",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("VERIFICATION_REQUIRED");
    expect(body.challengeToken).toBeDefined();
    expect(body.question).toBeDefined();
    expect(body.timeoutSeconds).toBeGreaterThanOrEqual(10);
  });
});
