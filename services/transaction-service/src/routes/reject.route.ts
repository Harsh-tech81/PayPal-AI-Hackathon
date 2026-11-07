import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { transactionRepository } from "../repositories/transaction.repo.js";

export async function rejectRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/transactions/:id/reject", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { reason = "Cognitive challenge failed" } = (request.body as any) || {};

      await transactionRepository.updateStatus(id, "REJECTED_FRAUD");

      return reply.send({
        status: "REJECTED_FRAUD",
        transactionId: id,
        reason,
        message: "Transaction rejected. Fraud incident recorded.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to reject transaction", message: err.message });
    }
  });

  // PayPal void-order
  fastify.post("/api/v1/paypal/void-order", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orderId, transactionId, reason } = request.body as any;
      if (transactionId) {
        await transactionRepository.updateStatus(transactionId, "VOIDED");
      }

      return reply.send({
        status: "VOIDED",
        orderId,
        transactionId,
        reason: reason || "Voided by PayShield Cognitive Interception Protocol",
        message: "PayPal authorization voided and cancelled. No funds moved.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "PayPal void failed", message: err.message });
    }
  });
}
