import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { executeAccountUnfreeze } from "../actions/unfreeze-manager.js";

export async function unfreezeRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/escalate/unfreeze", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        userId: string;
        resolutionMethod?: "admin_override" | "video_kyc" | "timer_expired";
      };

      if (!body.userId) {
        return reply.status(400).send({ error: "userId is required for account unfreeze" });
      }

      const res = await executeAccountUnfreeze(body.userId, body.resolutionMethod || "video_kyc");

      return reply.send({
        status: "UNFROZEN",
        isFrozen: false,
        message: res.message,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to unfreeze account", message: err.message });
    }
  });
}
