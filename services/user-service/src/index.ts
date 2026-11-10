import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

// Ensure .env is loaded regardless of process launch directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth.route.js";
import { profileRoutes } from "./routes/profile.route.js";
import { intentFormRoutes } from "./routes/intent-form.route.js";
import { deviceRoutes } from "./routes/devices.route.js";

const PORT = parseInt(process.env.USER_SERVICE_PORT || "8001", 10);
const HOST = "0.0.0.0";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "OPTIONS"],
});

await fastify.register(authRoutes);
await fastify.register(profileRoutes);
await fastify.register(intentFormRoutes);
await fastify.register(deviceRoutes);

fastify.get("/health", async () => ({
  service: "user-service",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`👤 User Service running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("user-service")) {
  startServer();
}

export default fastify;
