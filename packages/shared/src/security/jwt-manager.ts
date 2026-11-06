import jwt from "jsonwebtoken";

/**
 * Enterprise Asymmetric RS256 / HS256 JWT Manager.
 * Issues and validates secure session tokens across all microservices.
 */

function formatKey(keyStr?: string): string | null {
  if (!keyStr) return null;
  // Handle escaped newlines
  return keyStr.replace(/\\n/g, "\n").trim();
}

export interface UserTokenPayload {
  userId: string;
  email: string;
  fullName?: string;
  isFrozen?: boolean;
  intentCompleted?: boolean;
}

export function signToken(payload: UserTokenPayload, expiresIn: string = "1h"): string {
  const privateKey = formatKey(process.env.JWT_PRIVATE_KEY);
  if (privateKey && privateKey.includes("BEGIN PRIVATE KEY")) {
    try {
      return jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: (expiresIn as jwt.SignOptions["expiresIn"]) || "1h",
      });
    } catch (err) {
      console.warn("[JWT] RS256 sign failed, falling back to HS256:", err);
    }
  }

  const secret = process.env.JWT_SECRET || process.env.AES_MASTER_KEY || "payshield-jwt-super-secret-key-32bytes";
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: (expiresIn as jwt.SignOptions["expiresIn"]) || "1h",
  });
}

export function verifyToken<T = UserTokenPayload>(token: string): T {
  const publicKey = formatKey(process.env.JWT_PUBLIC_KEY);
  if (publicKey && publicKey.includes("BEGIN PUBLIC KEY")) {
    try {
      return jwt.verify(token, publicKey, { algorithms: ["RS256"] }) as T;
    } catch {
      // try fallback if signed with HS256
    }
  }

  const secret = process.env.JWT_SECRET || process.env.AES_MASTER_KEY || "payshield-jwt-super-secret-key-32bytes";
  return jwt.verify(token, secret, { algorithms: ["HS256"] }) as T;
}
