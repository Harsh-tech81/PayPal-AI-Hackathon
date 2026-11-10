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

  it("POST /api/v1/auth/verify-otp should reject backdoor code 482913", async () => {
    const res = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/verify-otp",
      payload: {
        email: "unregistered_victim@domain.com",
        otp: "482913",
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("INVALID_OTP");
    expect(body.verified).toBe(false);
  });

  it("Passkey enrollment and login should strictly preserve user identity and prevent cross-account login", async () => {
    // 1. Create User A and User B
    const emailA = `alice_${Date.now()}@domain.com`;
    const regResA = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        fullName: "Alice A",
        email: emailA,
        phone: "+15551111111",
        password: "Password123!",
        agreeToSecurityProtocol: true,
      },
    });
    expect(regResA.statusCode).toBe(201);
    const userA = JSON.parse(regResA.body).user;

    const emailB = `bob_${Date.now()}@domain.com`;
    const regResB = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        fullName: "Bob B",
        email: emailB,
        phone: "+15552222222",
        password: "Password123!",
        agreeToSecurityProtocol: true,
      },
    });
    expect(regResB.statusCode).toBe(201);
    const userB = JSON.parse(regResB.body).user;

    // 2. Register passkeys for User A and User B
    const credIdA = `cred_alice_${Date.now()}`;
    const bindResA = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-register",
      payload: {
        userId: userA.id,
        email: emailA,
        credentialId: credIdA,
        deviceName: "Alice MacBook Touch ID",
      },
    });
    expect(bindResA.statusCode).toBe(200);

    const credIdB = `cred_bob_${Date.now()}`;
    const bindResB = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-register",
      payload: {
        userId: userB.id,
        email: emailB,
        credentialId: credIdB,
        deviceName: "Bob Windows Hello",
      },
    });
    expect(bindResB.statusCode).toBe(200);

    // 3. User A logs in with User A passkey -> MUST return User A
    const loginA = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-login",
      payload: { credentialId: credIdA },
    });
    expect(loginA.statusCode).toBe(200);
    const loggedUserA = JSON.parse(loginA.body).user;
    expect(loggedUserA.email).toBe(emailA);
    expect(loggedUserA.id).toBe(userA.id);

    // 4. User B logs in with User B passkey -> MUST return User B (NEVER User A)
    const loginB = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-login",
      payload: { credentialId: credIdB },
    });
    expect(loginB.statusCode).toBe(200);
    const loggedUserB = JSON.parse(loginB.body).user;
    expect(loggedUserB.email).toBe(emailB);
    expect(loggedUserB.id).toBe(userB.id);

    // 5. Unknown passkey must return 404 (NEVER fallback to first user in database)
    const loginUnknown = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-login",
      payload: { credentialId: "cred_unknown_attacker_999" },
    });
    expect(loginUnknown.statusCode).toBe(404);

    // 6. User B trying to use User A's passkey with User B's email -> MUST reject with 403
    const loginMismatch = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-login",
      payload: { credentialId: credIdA, email: emailB },
    });
    expect(loginMismatch.statusCode).toBe(403);
  });

  it("POST /api/v1/auth/passkey-signup should create account and immediately bind passkey to that specific user", async () => {
    const signupEmail = `charlie_${Date.now()}@domain.com`;
    const signupCredId = `cred_charlie_${Date.now()}`;

    const signupRes = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-signup",
      payload: {
        fullName: "Charlie Brown",
        email: signupEmail,
        credentialId: signupCredId,
        deviceName: "Charlie Pixel 8 Fingerprint",
      },
    });

    expect(signupRes.statusCode).toBe(201);
    const body = JSON.parse(signupRes.body);
    expect(body.status).toBe("success");
    expect(body.token).toBeDefined();
    expect(body.user.email).toBe(signupEmail);
    expect(body.user.fullName).toBe("Charlie Brown");

    // Immediately test logging in with that passkey -> Must return Charlie
    const loginRes = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-login",
      payload: { credentialId: signupCredId },
    });

    expect(loginRes.statusCode).toBe(200);
    const loginBody = JSON.parse(loginRes.body);
    expect(loginBody.user.email).toBe(signupEmail);
    expect(loginBody.user.fullName).toBe("Charlie Brown");

    // Duplicate signup attempt must return 409
    const dupRes = await fastifyUserApp.inject({
      method: "POST",
      url: "/api/v1/auth/passkey-signup",
      payload: {
        fullName: "Charlie Brown",
        email: signupEmail,
        credentialId: `cred_charlie_dup_${Date.now()}`,
      },
    });
    expect(dupRes.statusCode).toBe(409);
  });
});
