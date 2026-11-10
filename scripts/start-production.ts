import http from "node:http";
import dotenv from "dotenv";

dotenv.config();

// Default internal ports and URLs for microservice mesh
process.env.USER_SERVICE_PORT = process.env.USER_SERVICE_PORT || "8001";
process.env.TRANSACTION_SERVICE_PORT = process.env.TRANSACTION_SERVICE_PORT || "8002";
process.env.VERIFICATION_AGENT_PORT = process.env.VERIFICATION_AGENT_PORT || "8003";
process.env.RISK_ENGINE_PORT = process.env.RISK_ENGINE_PORT || "8004";
process.env.ALERT_SERVICE_PORT = process.env.ALERT_SERVICE_PORT || "8005";
process.env.ESCALATION_SERVICE_PORT = process.env.ESCALATION_SERVICE_PORT || "8006";

process.env.RISK_ENGINE_URL = process.env.RISK_ENGINE_URL || "http://127.0.0.1:8004";
process.env.VERIFICATION_AGENT_URL = process.env.VERIFICATION_AGENT_URL || "http://127.0.0.1:8003";
process.env.USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://127.0.0.1:8001";
process.env.ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://127.0.0.1:8005";
process.env.ESCALATION_SERVICE_URL = process.env.ESCALATION_SERVICE_URL || "http://127.0.0.1:8006";
process.env.TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || "http://127.0.0.1:8002";

// Render assigns public port via process.env.PORT (typically 10000)
const GATEWAY_PORT = parseInt(process.env.PORT || "8000", 10);

const ROUTE_MAP: Array<{ prefix: string; port: number }> = [
  { prefix: "/api/v1/auth", port: 8001 },
  { prefix: "/api/v1/users", port: 8001 },
  { prefix: "/api/v1/intent-form", port: 8001 },
  { prefix: "/api/v1/devices", port: 8001 },
  { prefix: "/api/v1/transactions", port: 8002 },
  { prefix: "/api/v1/verification", port: 8003 },
  { prefix: "/api/v1/risk", port: 8004 },
  { prefix: "/api/v1/alerts", port: 8005 },
  { prefix: "/api/v1/escalation", port: 8006 },
];

console.log("=====================================================");
console.log("🛡️ PayShield AI - Production Unified Gateway Manager");
console.log("=====================================================");

async function bootServices() {
  // 1. Boot all microservices in-process (lightweight, zero-OOM, instant startup)
  try {
    const { startServer: startUser } = await import("../services/user-service/src/index.js");
    await startUser();
    console.log("[Manager] ✅ user-service active on port 8001");
  } catch (err: any) {
    console.error("[Manager] ❌ user-service failed to start:", err.message);
  }

  try {
    const { startServer: startTxn } = await import("../services/transaction-service/src/index.js");
    await startTxn();
    console.log("[Manager] ✅ transaction-service active on port 8002");
  } catch (err: any) {
    console.error("[Manager] ❌ transaction-service failed to start:", err.message);
  }

  try {
    const { startServer: startVerify } = await import("../services/verification-agent/src/index.js");
    await startVerify();
    console.log("[Manager] ✅ verification-agent active on port 8003");
  } catch (err: any) {
    console.error("[Manager] ❌ verification-agent failed to start:", err.message);
  }

  try {
    const { startServer: startRisk } = await import("../services/risk-engine/src/index.js");
    await startRisk();
    console.log("[Manager] ✅ risk-engine active on port 8004");
  } catch (err: any) {
    console.error("[Manager] ❌ risk-engine failed to start:", err.message);
  }

  try {
    const { startServer: startAlert } = await import("../services/alert-service/src/index.js");
    await startAlert();
    console.log("[Manager] ✅ alert-service active on port 8005");
  } catch (err: any) {
    console.error("[Manager] ❌ alert-service failed to start:", err.message);
  }

  try {
    const { startServer: startEscalate } = await import("../services/escalation-service/src/index.js");
    await startEscalate();
    console.log("[Manager] ✅ escalation-service active on port 8006");
  } catch (err: any) {
    console.error("[Manager] ❌ escalation-service failed to start:", err.message);
  }

  // 2. Gateway Reverse Proxy listening on Render's public PORT
  const proxy = http.createServer((req, res) => {
    // CORS configuration
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Healthcheck endpoint
    if (req.url === "/" || req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          system: "PayShield AI Unified API Gateway",
          gatewayPort: GATEWAY_PORT,
          services: [
            { name: "user-service", port: 8001 },
            { name: "transaction-service", port: 8002 },
            { name: "verification-agent", port: 8003 },
            { name: "risk-engine", port: 8004 },
            { name: "alert-service", port: 8005 },
            { name: "escalation-service", port: 8006 },
          ],
          timestamp: new Date().toISOString(),
        })
      );
      return;
    }

    // Match route prefix to destination microservice port
    const match = ROUTE_MAP.find((entry) => req.url?.startsWith(entry.prefix));
    const targetPort = match ? match.port : 8001;

    const options: http.RequestOptions = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${targetPort}`,
        "x-forwarded-for": req.socket.remoteAddress || "127.0.0.1",
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      console.error(`[Gateway Proxy Error] Target 127.0.0.1:${targetPort} - ${err.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Bad Gateway",
            message: `Microservice on port ${targetPort} unreachable: ${err.message}`,
          })
        );
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  proxy.listen(GATEWAY_PORT, "0.0.0.0", () => {
    console.log(`🚀 PayShield Unified Gateway listening publicly on port ${GATEWAY_PORT}`);
    console.log(`🌐 Public API Routing is live for all 6 microservices.`);
  });
}

bootServices().catch((err) => {
  console.error("[Manager Fatal Error]", err);
  process.exit(1);
});
