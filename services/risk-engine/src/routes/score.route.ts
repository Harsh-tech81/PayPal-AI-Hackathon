import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { calculateTransactionRisk } from "../scoring/heuristic-calculator.js";
import { RiskScoreRequestSchema } from "@payshield/shared";

export async function scoreRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/risk/score", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = RiskScoreRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid risk scoring payload",
          details: parsed.error.format(),
        });
      }

      const body = parsed.data;
      const evaluation = calculateTransactionRisk({
        userId: body.userId,
        amount: body.amount,
        currency: body.currency,
        deviceFingerprint: body.deviceFingerprint,
        ipAddress: body.ipAddress,
        location: body.location,
        timeIso: body.timeIso,
        timeOfTransfer: body.timeOfTransfer,
        recipientEmail: body.recipientEmail,
      });

      return reply.send({
        status: "success",
        ...evaluation,
        evaluatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Risk evaluation failed", message: err.message });
    }
  });
}
