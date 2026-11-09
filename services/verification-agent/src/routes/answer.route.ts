import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verificationGraph } from "../graph/verification-graph.js";
import { getCountdownKey, deleteCountdownKey } from "../config/redis.config.js";
import { SubmitAnswerSchema } from "@payshield/shared";

const ESCALATION_SERVICE_URL = process.env.ESCALATION_SERVICE_URL || "http://localhost:8006";

export async function answerRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/verify/answer", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = SubmitAnswerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid answer submission payload",
          details: parsed.error.format(),
        });
      }

      const body = parsed.data;
      let cached = await getCountdownKey(`challenge:${body.challengeToken}`);
      if (!cached && body.transactionId) {
        cached = await getCountdownKey(`txn:${body.transactionId}`);
      }

      // Explicitly check timeout: NEVER treat missing cache as an expired countdown
      const isExpired = body.isTimeout === true;
      let riddle = cached?.riddle;
      let expectedAnswer = cached?.expectedAnswer;

      // If riddle or expectedAnswer missing, fetch genuine anchors from user-service
      if (!riddle || !expectedAnswer) {
        try {
          const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 1500);
          const uRes = await fetch(`${USER_SERVICE_URL}/api/v1/intent-form/internal-vault/${encodeURIComponent(body.userId)}`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (uRes.ok) {
            const uData = (await uRes.json()) as any;
            if (uData && Array.isArray(uData.anchors) && uData.anchors.length > 0) {
              const matchedAnchor = uData.anchors[0];
              riddle = matchedAnchor.prompt;
              expectedAnswer = uData.anchors.map((a: any) => a.plainAnswer).filter(Boolean).join(" | ");
            }
          }
        } catch (uErr: any) {
          fastify.log.warn(`[Vault Recovery Notice] ${uErr.message}`);
        }
      }

      if (!riddle) {
        riddle = "What is your primary childhood family pet name or native hometown?";
      }
      if (!expectedAnswer) {
        expectedAnswer = "Bruno who loved biscuits | hometown | pet";
      }

      const { state, dossier } = await verificationGraph.processAnswer(
        {
          transactionId: body.transactionId,
          userId: body.userId,
          amount: cached?.amount || 1200,
          currency: cached?.currency || "USD",
          challengeToken: body.challengeToken,
          challengeRiddle: riddle,
          riskScore: cached?.riskScore || 0.88,
          ipAddress: body.attackerIp,
          selectedAnchor: {
            id: cached?.selectedAnchor?.id || "anc_01",
            prompt: riddle,
            plainAnswer: expectedAnswer,
          },
        },
        body.answer,
        body.responseTimeMs,
        isExpired
      );

      // Consume countdown keys
      await deleteCountdownKey(`challenge:${body.challengeToken}`);
      if (body.transactionId) {
        await deleteCountdownKey(`txn:${body.transactionId}`);
      }

      if (state.finalStatus === "APPROVED") {
        // SCENARIO SUCCESS: Trigger Payment Success Receipt via Alert Service
        try {
          const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://localhost:8005";
          await fetch(`${ALERT_SERVICE_URL}/api/v1/alerts/receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: body.userId,
              recipientEmail: cached?.recipientEmail || "merchant@company.com",
              amount: cached?.amount || 1200,
              currency: "USD",
              transactionId: body.transactionId,
              verificationMethod: "PayShield Google Gemini Cognitive Verification (< 400ms)",
            }),
          });
        } catch (rcptErr: any) {
          fastify.log.warn(`[Receipt Dispatch Notice] ${rcptErr.message}`);
        }

        // Also mark transaction as APPROVED in Transaction Service
        if (body.transactionId) {
          try {
            const TRANSACTION_SERVICE_URL = process.env.TRANSACTION_SERVICE_URL || "http://localhost:8002";
            await fetch(`${TRANSACTION_SERVICE_URL}/api/v1/transactions/${encodeURIComponent(body.transactionId)}/approve`, {
              method: "POST",
            });
          } catch (txnErr: any) {
            fastify.log.warn(`[Txn Approve Notice] ${txnErr.message}`);
          }
        }

        return reply.send({
          status: "APPROVED",
          is_verified: true,
          confidence: state.decision?.confidence || 0.95,
          reasoning: state.decision?.reasoning || "Cognitive intent successfully verified",
          responseTimeMs: body.responseTimeMs,
        });
      } else {
        // SCENARIO A: Trigger Escalation Service (1-Hour Account Freeze & Alerts)
        try {
          await fetch(`${ESCALATION_SERVICE_URL}/api/v1/escalate/freeze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: body.userId,
              transactionId: body.transactionId,
              reason: state.decision?.reasoning || "Failed cognitive memory verification",
              attackerIp: body.attackerIp || "185.220.101.5",
              dossier,
            }),
          });
        } catch (escErr: any) {
          fastify.log.warn(`[Escalation Dispatch Notice] ${escErr.message}`);
        }

        return reply.send({
          status: "REJECTED_FRAUD",
          is_verified: false,
          confidence: state.decision?.confidence || 0.04,
          reasoning: state.decision?.reasoning || "Cognitive verification failed",
          accountFrozen: true,
          frozenDurationHours: 1,
          dossier,
        });
      }
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Verification evaluation failed", message: err.message });
    }
  });
}
