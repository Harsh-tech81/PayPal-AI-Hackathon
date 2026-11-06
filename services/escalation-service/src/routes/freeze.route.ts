import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { executeAccountFreeze } from "../actions/freeze-manager.js";
import { blockAttackerIp } from "../actions/ip-blocker.js";

export async function freezeRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/escalate/freeze", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        userId: string;
        transactionId?: string;
        reason?: string;
        attackerIp?: string;
        dossier?: any;
      };

      if (!body.userId) {
        return reply.status(400).send({ error: "userId is required for account freeze" });
      }

      const freezeResult = await executeAccountFreeze({
        userId: body.userId,
        transactionId: body.transactionId,
        reason: body.reason || "Failed 10-second cognitive verification",
        attackerIp: body.attackerIp,
        dossier: body.dossier,
      });

      if (body.attackerIp) {
        await blockAttackerIp(body.attackerIp, "Unauthorized transaction attempt failed cognitive verification");
      }

      return reply.send({
        status: "FROZEN",
        isFrozen: true,
        frozenUntil: freezeResult.frozenUntil,
        incidentId: freezeResult.incidentId,
        message: "Account locked for 1 hour. Multi-channel emergency alerts dispatched.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to execute account freeze", message: err.message });
    }
  });
}
