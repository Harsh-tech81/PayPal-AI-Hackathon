import Redis from "ioredis";

/**
 * Redis Client with In-Memory TTL Fallback for 10s Verification Countdown.
 */

class FallbackMemoryStore {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, mode?: string, duration?: number): Promise<"OK"> {
    let ttlMs = 10000;
    if (mode === "EX" && duration) {
      ttlMs = duration * 1000;
    } else if (mode === "PX" && duration) {
      ttlMs = duration;
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return "OK";
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item) return -2;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

let redisClient: any;
const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`;

try {
  const RedisConstructor = (Redis as any).default || Redis;
  const r = new (RedisConstructor as any)(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't hang if redis server is offline
    lazyConnect: true,
  });

  r.on("error", (err: any) => {
    // Silently fall back to in-memory store
  });

  // Attempt non-blocking connect
  r.connect().catch(() => {
    // console.warn("[Redis] Offline. Using in-memory TTL store.");
  });

  redisClient = r;
} catch {
  redisClient = new FallbackMemoryStore();
}

const memoryFallback = new FallbackMemoryStore();

export async function setCountdownKey(key: string, data: any, ttlSeconds: number = 10): Promise<void> {
  const serialized = JSON.stringify(data);
  try {
    if (redisClient?.status === "ready") {
      await redisClient.set(key, serialized, "EX", ttlSeconds);
      return;
    }
  } catch {}
  await memoryFallback.set(key, serialized, "EX", ttlSeconds);
}

export async function getCountdownKey(key: string): Promise<any | null> {
  try {
    if (redisClient?.status === "ready") {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    }
  } catch {}
  const fallbackVal = await memoryFallback.get(key);
  return fallbackVal ? JSON.parse(fallbackVal) : null;
}

export async function deleteCountdownKey(key: string): Promise<void> {
  try {
    if (redisClient?.status === "ready") {
      await redisClient.del(key);
    }
  } catch {}
  await memoryFallback.del(key);
}
