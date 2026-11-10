import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { sendAlertRoutes } from "./routes/send-alert.route.js";
import { alertHistoryRoutes } from "./routes/alert-history.route.js";
import { receiptRoutes } from "./routes/receipt.route.js";

const PORT = parseInt(process.env.PORT || process.env.ALERT_SERVICE_PORT || "8005", 10);
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

await fastify.register(sendAlertRoutes);
await fastify.register(alertHistoryRoutes);
await fastify.register(receiptRoutes);

fastify.get("/health", async () => ({
  service: "alert-service",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚨 Multi-Channel Alert Gateway running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("alert-service")) {
  startServer();
}

export default fastify;
