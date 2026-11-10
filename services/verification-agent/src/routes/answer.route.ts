import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verificationGraph } from "../graph/verification-graph.js";
import { getCountdownKey, setCountdownKey, deleteCountdownKey } from "../config/redis.config.js";
import { SubmitAnswerSchema } from "@payshield/shared";

const ESCALATION_SERVICE_URL = process.env.ESCALATION_SERVICE_URL || "http://localhost:8006";

export async function answerRoutes(fastify: FastifyInstance) {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
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

      // Explicitly check timeout
      const isExpired = body.isTimeout === true;
      let riddle = cached?.riddle;
      let expectedAnswer = cached?.expectedAnswer;

      // Recover riddle + expected answer from the user's OWN vault if missing
      if (!riddle || !expectedAnswer) {
        try {
          const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:8001";
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2000);
          const uRes = await fetch(
            `${USER_SERVICE_URL}/api/v1/intent-form/internal-vault/${encodeURIComponent(body.userId)}`,
            { signal: controller.signal }
          );
          clearTimeout(timer);

          if (uRes.ok) {
            const uData = (await uRes.json()) as any;
            if (uData && Array.isArray(uData.anchors) && uData.anchors.length > 0) {
              const anchorId = cached?.selectedAnchor?.id;
              const matchedAnchor = anchorId
                ? uData.anchors.find((a: any) => a.id === anchorId) || uData.anchors[0]
                : uData.anchors[0];

              if (matchedAnchor?.plainAnswer) {
                riddle = riddle || matchedAnchor.prompt;
                expectedAnswer = matchedAnchor.plainAnswer;
              }
            }
          }
        } catch (uErr: any) {
          fastify.log.warn(`[Vault Recovery Notice] ${uErr.message}`);
        }
      }

      if (!riddle || !expectedAnswer) {
        fastify.log.warn(`[Answer Route] Could not recover riddle/expected for txn=${body.transactionId}.`);
        return reply.status(422).send({
          status: "VERIFICATION_ERROR",
          is_verified: false,
          reasoning: "Security session expired or vault not found. Please retry the payment.",
          error: "Challenge session could not be recovered. No vault secret available to verify against.",
        });
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
            hint: cached?.selectedAnchor?.hint || "",
          },
        },
        body.answer,
        body.responseTimeMs,
        isExpired
      );

      if (state.finalStatus === "APPROVED") {
        // Clean up keys on success
        await deleteCountdownKey(`challenge:${body.challengeToken}`);
        if (body.transactionId) {
          await deleteCountdownKey(`txn:${body.transactionId}`);
        }

        // Trigger Payment Success Receipt via Alert Service
        try {
          const ALERT_SERVICE_URL = process.env.ALERT_SERVICE_URL || "http://localhost:8005";
          await fetch(`${ALERT_SERVICE_URL}/api/v1/alerts/receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: body.userId,
              recipientEmail: cached?.recipientEmail || "merchant@company.com",
              amount: cached?.amount || 1200,
              currency: cached?.currency || "USD",
              transactionId: body.transactionId,
              verificationMethod: "PayShield Cognitive Memory Verification",
            }),
          });
        } catch (rcptErr: any) {
          fastify.log.warn(`[Receipt Dispatch Notice] ${rcptErr.message}`);
        }

        // Mark transaction as APPROVED in Transaction Service
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
      }

      // ── FRIENDLY RETRY LOGIC (Requirement 3) ─────────────────────────────────
      // If answer was wrong, give 1 friendly retry opportunity with hint before freezing!
      const attemptsSoFar = (cached?.attempts || 0) + 1;
      const MAX_ATTEMPTS = 2;

      if (attemptsSoFar < MAX_ATTEMPTS && !isExpired) {
        if (cached) {
          cached.attempts = attemptsSoFar;
          await setCountdownKey(`challenge:${body.challengeToken}`, cached, 3600);
          if (body.transactionId) {
            await setCountdownKey(`txn:${body.transactionId}`, cached, 3600);
          }
        }

        return reply.send({
          status: "RETRY_ALLOWED",
          is_verified: false,
          attemptsRemaining: MAX_ATTEMPTS - attemptsSoFar,
          hint: cached?.selectedAnchor?.hint || "",
          reasoning: "Answer did not match your memory vault. 1 attempt remaining.",
        });
      }

      // ── FINAL ATTEMPT FAILED: Trigger Escalation & Account Freeze ────────────
      await deleteCountdownKey(`challenge:${body.challengeToken}`);
      if (body.transactionId) {
        await deleteCountdownKey(`txn:${body.transactionId}`);
      }

      try {
        await fetch(`${ESCALATION_SERVICE_URL}/api/v1/escalate/freeze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: body.userId,
            transactionId: body.transactionId,
            reason: state.decision?.reasoning || "Failed cognitive memory verification after multiple attempts",
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
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Verification evaluation failed", message: err.message });
    }
  };

  fastify.post("/api/v1/verify/answer", handler);
  fastify.post("/api/v1/verification/answer", handler);
}
