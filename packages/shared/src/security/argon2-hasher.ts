import crypto from "node:crypto";

/**
 * Enterprise Password Hasher with Argon2id compatibility and Node.js WebCrypto fallback.
 * Uses salt + memory-hard parameters to resist GPU/ASIC brute-force attacks.
 */

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  try {
    // Attempt native @node-rs/argon2 if available
    // @ts-ignore
    const argon2: any = await import("@node-rs/argon2").catch(() => null);
    if (argon2?.hash) {
      return await argon2.hash(password, {
        memoryCost: parseInt(process.env.ARGON2_MEMORY_COST || "65536", 10),
        timeCost: parseInt(process.env.ARGON2_TIME_COST || "3", 10),
        parallelism: parseInt(process.env.ARGON2_PARALLELISM || "4", 10),
      });
    }
  } catch {
    // Fall back to memory-hard scrypt
  }

  // Cryptographically secure scrypt fallback
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `$scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    if (storedHash.startsWith("$argon2")) {
      // @ts-ignore
      const argon2: any = await import("@node-rs/argon2").catch(() => null);
      if (argon2?.verify) {
        return await argon2.verify(storedHash, password);
      }
    }
  } catch {
    // fallback
  }

  if (storedHash.startsWith("$scrypt$")) {
    const parts = storedHash.split("$");
    const salt = parts[3];
    const key = parts[4];
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH, {
      N: 16384,
      r: 8,
      p: 1,
    });
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
  }

  // Legacy SHA-256 fallback for compatibility
  const [salt, hash] = storedHash.split(":");
  if (salt && hash) {
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
  }

  return false;
}
