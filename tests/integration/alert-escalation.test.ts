import { describe, it, expect } from "vitest";
import fastifyEscalationApp from "../../services/escalation-service/src/index.js";
import fastifyAlertApp from "../../services/alert-service/src/index.js";

describe("Alert & Escalation Services Integration Tests", () => {
  it("POST /api/v1/escalate/freeze should execute 1-hour account freeze", async () => {
    const res = await fastifyEscalationApp.inject({
      method: "POST",
      url: "/api/v1/escalate/freeze",
      payload: {
        userId: "a0000000-0000-0000-0000-000000000001",
        reason: "Failed 10-second cognitive verification",
        attackerIp: "185.220.101.5",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("FROZEN");
    expect(body.isFrozen).toBe(true);
    expect(body.frozenUntil).toBeDefined();
  }, 30000);

  it("POST /api/v1/alerts/send should dispatch multi-channel alert notifications", async () => {
    const res = await fastifyAlertApp.inject({
      method: "POST",
      url: "/api/v1/alerts/send",
      payload: {
        userId: "a0000000-0000-0000-0000-000000000001",
        phone: "+15550192834",
        userEmail: "alice@example.com",
        amount: 1200,
        incidentReference: "PS-FR-2026-9812A",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("DISPATCHED");
    expect(body.channels).toBeDefined();
  }, 30000);
});
