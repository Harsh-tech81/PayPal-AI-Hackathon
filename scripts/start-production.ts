import { fork, ChildProcess } from "node:child_process";
import http from "node:http";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const GATEWAY_PORT = parseInt(process.env.PORT || "8000", 10);

const SERVICES = [
  { name: "user-service", script: "services/user-service/src/index.ts", port: 8001 },
  { name: "transaction-service", script: "services/transaction-service/src/index.ts", port: 8002 },
  { name: "verification-agent", script: "services/verification-agent/src/index.ts", port: 8003 },
  { name: "risk-engine", script: "services/risk-engine/src/index.ts", port: 8004 },
  { name: "alert-service", script: "services/alert-service/src/index.ts", port: 8005 },
  { name: "escalation-service", script: "services/escalation-service/src/index.ts", port: 8006 },
];

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

const children: ChildProcess[] = [];

console.log("=====================================================");
console.log("🛡️ PayShield AI - Production Unified Gateway Manager");
console.log("=====================================================");

// 1. Launch all microservices as worker processes
for (const svc of SERVICES) {
  const childEnv = {
    ...process.env,
    PORT: String(svc.port),
    USER_SERVICE_PORT: "8001",
    TRANSACTION_SERVICE_PORT: "8002",
    VERIFICATION_AGENT_PORT: "8003",
    RISK_ENGINE_PORT: "8004",
    ALERT_SERVICE_PORT: "8005",
    ESCALATION_SERVICE_PORT: "8006",
    RISK_ENGINE_URL: "http://127.0.0.1:8004",
    VERIFICATION_AGENT_URL: "http://127.0.0.1:8003",
    USER_SERVICE_URL: "http://127.0.0.1:8001",
    ALERT_SERVICE_URL: "http://127.0.0.1:8005",
    ESCALATION_SERVICE_URL: "http://127.0.0.1:8006",
    TRANSACTION_SERVICE_URL: "http://127.0.0.1:8002",
  };

  const child = fork(
    path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
    [svc.script],
    {
      env: childEnv,
      stdio: "inherit",
    }
  );

  children.push(child);
  console.log(`[Manager] Spawned ${svc.name} on internal port ${svc.port}`);
}

// 2. Gateway Reverse Proxy
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

  // Gateway root / healthcheck
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        system: "PayShield AI Unified API Gateway",
        gatewayPort: GATEWAY_PORT,
        microservices: SERVICES.map((s) => ({ name: s.name, port: s.port })),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // Find target port based on URL prefix
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
          message: `Microservice on port ${targetPort} unreachable`,
        })
      );
    }
  });

  req.pipe(proxyReq, { end: true });
});

proxy.listen(GATEWAY_PORT, "0.0.0.0", () => {
  console.log(`🚀 PayShield Unified Gateway listening on port ${GATEWAY_PORT}`);
  console.log(`🌐 Public API Routing is live for all 6 microservices.`);
});

// Clean shutdown
function shutdown() {
  console.log("\n[Manager] Shutting down all microservices...");
  proxy.close();
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
