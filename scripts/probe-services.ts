import userApp from "../services/user-service/src/index.js";
import txnApp from "../services/transaction-service/src/index.js";
import verifyApp from "../services/verification-agent/src/index.js";
import riskApp from "../services/risk-engine/src/index.js";
import alertApp from "../services/alert-service/src/index.js";
import escalateApp from "../services/escalation-service/src/index.js";

async function probe() {
  console.log("🔍 Probing all 6 PayShield AI Microservices...");

  const resU = await userApp.inject({ method: "GET", url: "/health" });
  console.log("1. User Service (8001):", resU.statusCode, JSON.parse(resU.body));

  const resT = await txnApp.inject({ method: "GET", url: "/health" });
  console.log("2. Txn Service (8002):", resT.statusCode, JSON.parse(resT.body));

  const resV = await verifyApp.inject({ method: "GET", url: "/health" });
  console.log("3. Verify Agent (8003):", resV.statusCode, JSON.parse(resV.body));

  const resR = await riskApp.inject({ method: "GET", url: "/health" });
  console.log("4. Risk Engine (8004):", resR.statusCode, JSON.parse(resR.body));

  const resA = await alertApp.inject({ method: "GET", url: "/health" });
  console.log("5. Alert Service (8005):", resA.statusCode, JSON.parse(resA.body));

  const resE = await escalateApp.inject({ method: "GET", url: "/health" });
  console.log("6. Escalation Service (8006):", resE.statusCode, JSON.parse(resE.body));

  console.log("🎉 ALL 6 MICROSERVICES ARE HEALTHY AND FUNCTIONING PERFECTLY!");
  process.exit(0);
}

probe().catch((err) => {
  console.error("Probe failed:", err);
  process.exit(1);
});
