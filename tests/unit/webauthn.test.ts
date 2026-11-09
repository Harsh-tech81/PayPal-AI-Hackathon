import { describe, it, expect } from "vitest";
import {
  base64ToArrayBuffer,
  arrayBufferToBase64,
  registerBiometricPasskey,
  verifyBiometricPasskey,
  getStoredBiometricCredential,
  saveStoredBiometricCredential,
  WebAuthnCredentialData,
} from "../../web-app/src/lib/webauthn.js";

describe("WebAuthn FIDO2 Biometrics Suite", () => {
  it("should accurately serialize and deserialize ArrayBuffer to/from Base64", () => {
    const originalBytes = new Uint8Array([1, 2, 3, 255, 128, 64, 32, 16, 0]);
    const base64 = arrayBufferToBase64(originalBytes.buffer);
    expect(typeof base64).toBe("string");
    expect(base64.length).toBeGreaterThan(0);

    const restoredBuffer = base64ToArrayBuffer(base64);
    const restoredBytes = new Uint8Array(restoredBuffer);
    expect(restoredBytes).toEqual(originalBytes);
  });

  it("should save and retrieve stored biometric passkey credential", () => {
    // Mock window localStorage for test environment
    const storageMap = new Map<string, string>();
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => storageMap.get(k) || null,
        setItem: (k: string, v: string) => storageMap.set(k, v),
        removeItem: (k: string) => storageMap.delete(k),
      },
    };
    (globalThis as any).localStorage = (globalThis as any).window.localStorage;

    const testCred: WebAuthnCredentialData = {
      id: "cred_test_12345",
      rawId: "raw_test_base64",
      type: "public-key",
      registeredAt: new Date().toISOString(),
      algorithm: -7,
    };

    saveStoredBiometricCredential(testCred);
    const retrieved = getStoredBiometricCredential();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe("cred_test_12345");
    expect(retrieved?.algorithm).toBe(-7);
  });

  it("should execute biometric passkey registration with platform authenticator fallback", async () => {
    const result = await registerBiometricPasskey({
      id: "user_test_99",
      name: "tester@payshield.ai",
      displayName: "Security Tester",
    });

    expect(result.success).toBe(true);
    expect(result.credential).toBeDefined();
    expect(result.credential?.type).toBe("public-key");
  });

  it("should verify registered biometric passkey assertion", async () => {
    const verifyResult = await verifyBiometricPasskey();
    expect(verifyResult.success).toBe(true);
    expect(verifyResult.verifiedAt).toBeDefined();
  });
});
