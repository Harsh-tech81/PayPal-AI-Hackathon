import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { executeAccountFreeze } from "../actions/freeze-manager.js";
import { executeAccountUnfreeze } from "../actions/unfreeze-manager.js";
import { blockAttackerIp } from "../actions/ip-blocker.js";
import prisma from "../../../../database/prisma-client.js";

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

  fastify.get("/api/v1/escalate/status/:userId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      let user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      if (!user) {
        user = await prisma.user.findFirst({ orderBy: { createdAt: "desc" } });
      }

      if (!user) {
        return reply.status(404).send({ error: "User not found" });
      }

      const now = new Date();
      let isFrozen = user.isFrozen;
      let frozenUntil = user.frozenUntil;
      let remainingSeconds = 0;

      // Reliable server-side expiration handling: auto-restore if elapsed
      if (isFrozen && frozenUntil && now >= frozenUntil) {
        console.log(`[ESCALATION AUTO-TIMER] Freeze duration expired for user ${user.id}. Restoring access.`);
        await executeAccountUnfreeze(user.id, "timer_expired");
        isFrozen = false;
        frozenUntil = null;
        remainingSeconds = 0;
      } else if (isFrozen && frozenUntil) {
        remainingSeconds = Math.max(0, Math.floor((frozenUntil.getTime() - now.getTime()) / 1000));
      }

      return reply.send({
        userId: user.id,
        isFrozen,
        frozenUntil,
        frozenReason: user.frozenReason,
        remainingSeconds,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch freeze status", message: err.message });
    }
  });
}
