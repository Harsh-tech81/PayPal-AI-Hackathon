import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { executeAccountUnfreeze } from "../actions/unfreeze-manager.js";

export async function unfreezeRoutes(fastify: FastifyInstance) {
  const handler = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        userId: string;
        resolutionMethod?: "admin_override" | "video_kyc" | "webauthn_biometric" | "timer_expired";
      };

      if (!body.userId) {
        return reply.status(400).send({ error: "userId is required for account unfreeze" });
      }

      const validMethods = ["admin_override", "video_kyc", "webauthn_biometric", "timer_expired"];
      const method = body.resolutionMethod || "webauthn_biometric";
      if (!validMethods.includes(method)) {
        return reply.status(400).send({ error: `Invalid resolutionMethod. Allowed: ${validMethods.join(", ")}` });
      }

      const res = await executeAccountUnfreeze(body.userId, method);

      return reply.send({
        status: "UNFROZEN",
        isFrozen: false,
        message: res.message,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to unfreeze account", message: err.message });
    }
  };

  fastify.post("/api/v1/escalate/unfreeze", handler);
  fastify.post("/api/v1/escalation/unfreeze", handler);
}
