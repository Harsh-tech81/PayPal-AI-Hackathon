import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { sendRoutes } from "./routes/send.route.js";
import { historyRoutes } from "./routes/history.route.js";
import { approveRoutes } from "./routes/approve.route.js";
import { rejectRoutes } from "./routes/reject.route.js";

const PORT = parseInt(process.env.PORT || process.env.TRANSACTION_SERVICE_PORT || "8002", 10);
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

await fastify.register(sendRoutes);
await fastify.register(historyRoutes);
await fastify.register(approveRoutes);
await fastify.register(rejectRoutes);

fastify.get("/health", async () => ({
  service: "transaction-service",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`💳 Transaction Service running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("transaction-service")) {
  startServer();
}

export default fastify;
