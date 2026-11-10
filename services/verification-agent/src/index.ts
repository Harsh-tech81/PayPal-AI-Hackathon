import "dotenv/config";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { challengeRoutes } from "./routes/challenge.route.js";
import { answerRoutes } from "./routes/answer.route.js";

const PORT = parseInt(process.env.PORT || process.env.VERIFICATION_AGENT_PORT || "8003", 10);
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

await fastify.register(challengeRoutes);
await fastify.register(answerRoutes);

fastify.get("/health", async () => ({
  service: "verification-agent",
  status: "healthy",
  port: PORT,
  timestamp: new Date().toISOString(),
}));

export async function startServer() {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🤖 GenAI Verification Agent running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("verification-agent")) {
  startServer();
}

export default fastify;
