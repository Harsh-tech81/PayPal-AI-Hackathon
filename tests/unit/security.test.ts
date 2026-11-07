import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../../packages/shared/src/security/argon2-hasher.js";
import { encryptSecret, decryptSecret, serializeEncryptedPayload } from "../../packages/shared/src/security/aes-encryptor.js";
import { signToken, verifyToken } from "../../packages/shared/src/security/jwt-manager.js";

describe("PayShield Security & Cryptography Unit Tests", () => {
  it("should securely hash and verify user passwords with Argon2/scrypt", async () => {
    const password = "StrongPassword2026!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThan(20);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPassword("WrongPassword123", hash);
    expect(isWrongMatch).toBe(false);
  });

  it("should encrypt memory secrets with AES-256-GCM and decrypt accurately", () => {
    const secretMemory = "Bruno who loved biscuits";
    const encrypted = encryptSecret(secretMemory);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.tag).toBeDefined();
    expect(encrypted.ciphertext).not.toEqual(secretMemory);

    const serialized = serializeEncryptedPayload(encrypted);
    const decrypted = decryptSecret(serialized);

    expect(decrypted).toEqual(secretMemory);
  });

  it("should issue and verify session JWTs", () => {
    const payload = {
      userId: "usr_alice_123",
      email: "alice@example.com",
      fullName: "Alice Smith",
    };

    const token = signToken(payload, "1h");
    expect(token).toBeDefined();

    const verified = verifyToken<any>(token);
    expect(verified.userId).toBe(payload.userId);
    expect(verified.email).toBe(payload.email);
  });
});
