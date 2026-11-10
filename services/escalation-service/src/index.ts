import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { freezeRoutes } from "./routes/freeze.route.js";
import { unfreezeRoutes } from "./routes/unfreeze.route.js";
import { reportRoutes } from "./routes/report.route.js";

const PORT = parseInt(process.env.PORT || process.env.ESCALATION_SERVICE_PORT || "8006", 10);
const HOST = "0.0.0.0";

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
});

await fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
});

await fastify.register(freezeRoutes);
await fastify.register(unfreezeRoutes);
await fastify.register(reportRoutes);

fastify.get("/health", async () => ({
  service: "escalation-service",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`❄️ Escalation & Lockdown Service running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("escalation-service")) {
  startServer();
}

export default fastify;
