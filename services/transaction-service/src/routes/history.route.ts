import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { transactionRepository } from "../repositories/transaction.repo.js";

export async function historyRoutes(fastify: FastifyInstance) {
  fastify.get("/api/v1/transactions/history", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const senderId = (request.query as any)?.userId || (request.headers["x-user-id"] as string) || "a0000000-0000-0000-0000-000000000001";
      const limit = parseInt((request.query as any)?.limit || "20", 10);

      const transactions = await transactionRepository.getHistory(senderId, limit);

      return reply.send({
        userId: senderId,
        count: transactions.length,
        transactions,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch transaction history", message: err.message });
    }
  });
}
