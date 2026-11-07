import { describe, it, expect } from "vitest";
import fastifyUserApp from "../../services/user-service/src/index.js";

describe("User Service Integration Tests", () => {
  it("GET /health should return healthy status", async () => {
    const res = await fastifyUserApp.inject({
      method: "GET",
      url: "/health",
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.service).toBe("user-service");
    expect(body.status).toBe("healthy");
  });

  it("POST /api/v1/auth/register should create new user and return JWT", async () => {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const res = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        fullName: "Test User",
        email: uniqueEmail,
        phone: "+15559876543",
        password: "SuperSecretPassword123!",
        agreeToSecurityProtocol: true,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(uniqueEmail);
  });
});
