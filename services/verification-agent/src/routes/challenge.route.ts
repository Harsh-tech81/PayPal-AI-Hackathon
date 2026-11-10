import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { verificationGraph } from "../graph/verification-graph.js";
import { GenerateChallengeSchema } from "@payshield/shared";

export async function challengeRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/verify/challenge", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = GenerateChallengeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid challenge initiation payload",
          details: parsed.error.format(),
        });
      }

      const body = parsed.data;
      const state = await verificationGraph.initiateChallenge({
        transactionId: body.transactionId,
        userId: body.userId,
        amount: body.amount,
        currency: body.currency,
        location: body.location,
        ipAddress: body.ipAddress,
        riskScore: body.riskScore,
        category: body.category,
        recipientEmail: body.recipientEmail,
      });

      // ── IMPROVEMENT #2: If user has no vault → skip challenge, auto-approve ──
      if ((state as any).noVaultConfigured === true) {
        return reply.send({
          status: "NO_VAULT_AUTO_APPROVED",
          noVault: true,
          transactionId: body.transactionId,
          message:
            "No cognitive vault configured for this user. Payment auto-approved. Set up your Memory Vault to enable enhanced security for future transactions.",
        });
      }
      // ─────────────────────────────────────────────────────────────────────────

      const timeoutSeconds = parseInt(process.env.LANGGRAPH_TIMEOUT_SECONDS || "10", 10);
      return reply.send({
        status: "CHALLENGE_ACTIVE",
        challengeToken: state.challengeToken,
        transactionId: state.transactionId,
        question: state.challengeRiddle,
        timeoutSeconds,
        countdownExpiresAt: state.countdownExpiresAt,
        message: `Your personal memory question is ready. Answer at your own pace — no time pressure.`,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to initiate challenge", message: err.message });
    }
  });
}
