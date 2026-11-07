import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { userRepository } from "../repositories/user.repository.js";
import { verifyToken, UserTokenPayload } from "@payshield/shared";

export async function profileRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/users/me", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Missing Bearer token" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken<UserTokenPayload>(token);

      const user = await userRepository.findById(decoded.userId);
      if (!user) {
        return reply.send({
          user: {
            id: decoded.userId,
            email: decoded.email,
            fullName: decoded.fullName || "Account Member",
            isFrozen: false,
            intentFormCompleted: true,
          },
        });
      }

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          isFrozen: user.isFrozen,
          frozenUntil: user.frozenUntil,
          frozenReason: user.frozenReason,
          intentFormCompleted: user.intentFormCompleted,
          kycStatus: user.kycStatus,
          riskTier: user.riskTier,
        },
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(401).send({ error: "Invalid or expired authorization token" });
    }
  });

  // Direct unfreeze hook
  fastify.post("/api/v1/users/unfreeze/:userId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      await userRepository.unfreezeUser(userId);
      return reply.send({ status: "UNFROZEN", userId });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to unfreeze user in user-service" });
    }
  });
}
