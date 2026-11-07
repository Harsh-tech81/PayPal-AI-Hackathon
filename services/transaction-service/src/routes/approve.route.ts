import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { transactionRepository } from "../repositories/transaction.repo.js";

export async function approveRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/transactions/:id/approve", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      await transactionRepository.updateStatus(id, "APPROVED");

      return reply.send({
        status: "APPROVED",
        transactionId: id,
        message: "Payment successfully approved and executed. Funds moved.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to approve transaction", message: err.message });
    }
  });

  // PayPal capture-order
  fastify.post("/api/v1/paypal/capture-order", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orderId, transactionId } = request.body as any;
      if (transactionId) {
        await transactionRepository.updateStatus(transactionId, "APPROVED");
      }

      return reply.send({
        status: "COMPLETED",
        orderId,
        transactionId,
        message: "PayPal authorization captured successfully.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "PayPal capture failed", message: err.message });
    }
  });
}
