import crypto from "node:crypto";

/**
 * Enterprise AES-256-GCM Authenticated Encryption for User Intent Memory Vault.
 * Ensures zero-knowledge privacy: secrets are encrypted at rest before storing in MongoDB.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getKey(overrideHex?: string): Buffer {
  const hex = overrideHex || process.env.AES_MASTER_KEY || "f4e9e2ee92250900fde16c87eff786922b82ceff00f86492cb35cc7663254421";
  const buf = Buffer.from(hex, "hex");
  if (buf.length !== 32) {
    // derive 32-byte key using sha256 if length mismatch
    return crypto.createHash("sha256").update(hex).digest();
  }
  return buf;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

export function encryptSecret(plainText: string, masterKeyHex?: string): EncryptedPayload {
  const key = getKey(masterKeyHex);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: tag,
  };
}

export function decryptSecret(payload: EncryptedPayload | string, masterKeyHex?: string): string {
  const key = getKey(masterKeyHex);

  let iv: Buffer;
  let tag: Buffer;
  let ciphertext: string;

  if (typeof payload === "string") {
    // If stored as "iv:tag:ciphertext" string format
    const parts = payload.split(":");
    if (parts.length === 3) {
      iv = Buffer.from(parts[0], "hex");
      tag = Buffer.from(parts[1], "hex");
      ciphertext = parts[2];
    } else {
      // Or serialized JSON
      try {
        const parsed = JSON.parse(payload) as EncryptedPayload;
        iv = Buffer.from(parsed.iv, "hex");
        tag = Buffer.from(parsed.tag, "hex");
        ciphertext = parsed.ciphertext;
      } catch {
        throw new Error("Invalid encrypted payload format");
      }
    }
  } else {
    iv = Buffer.from(payload.iv, "hex");
    tag = Buffer.from(payload.tag, "hex");
    ciphertext = payload.ciphertext;
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return `${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}
