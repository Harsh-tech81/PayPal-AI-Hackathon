import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { scoreRoutes } from "./routes/score.route.js";

const PORT = parseInt(process.env.RISK_ENGINE_PORT || "8004", 10);
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

await fastify.register(scoreRoutes);

fastify.get("/health", async () => ({
  service: "risk-engine",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🧠 Risk Scoring Engine running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("risk-engine")) {
  startServer();
}

export default fastify;
