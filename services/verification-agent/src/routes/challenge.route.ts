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

      return reply.send({
        status: "CHALLENGE_ACTIVE",
        challengeToken: state.challengeToken,
        transactionId: state.transactionId,
        question: state.challengeRiddle,
        timeoutSeconds: 20,
        countdownExpiresAt: state.countdownExpiresAt,
        message: "Dynamic cognitive challenge formulated. 20-second user-friendly timer active.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to initiate challenge", message: err.message });
    }
  });
}
