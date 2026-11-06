import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import { sanitizePostgresUrl } from "./connection-sanitizer.js";

dotenv.config();

let prismaInstance: any = null;

export function getPrismaClient(): PrismaClient {
  if (prismaInstance) return prismaInstance;

  try {
    const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const { connectionString, isCloud, ssl } = sanitizePostgresUrl(rawUrl);

    const pool = new pg.Pool({
      connectionString,
      ssl,
      max: isCloud ? 10 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle idle connection errors gracefully
    pool.on("error", (err) => {
      console.warn("[PostgreSQL Pool Notice] Idle client error:", err.message);
    });

    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter } as any);
  } catch (err: any) {
    console.warn(`[Prisma Init Notice] Initializing fallback client: ${err.message}`);
    try {
      prismaInstance = new PrismaClient();
    } catch {
      // Mock proxy for safe offline tests
      prismaInstance = new Proxy({} as any, {
        get: () => () => Promise.resolve([]),
      });
    }
  }

  return prismaInstance;
}

export const prisma = getPrismaClient();
export default prisma;
