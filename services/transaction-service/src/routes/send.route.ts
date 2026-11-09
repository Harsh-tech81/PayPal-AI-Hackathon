import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { paymentOrchestrator } from "../orchestrator/payment-orchestrator.js";
import { CreateTransactionSchema } from "@payshield/shared";

export async function sendRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/transactions/send", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = CreateTransactionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid transaction payload",
          details: parsed.error.format(),
        });
      }

      const body = parsed.data;
      const userId = (request.headers["x-user-id"] as string) || "a0000000-0000-0000-0000-000000000001";

      const clientIp = (request.headers["x-forwarded-for"] as string) || request.ip || "127.0.0.1";
      const resolvedIp = body.ipAddress || clientIp;

      const result = await paymentOrchestrator.processPaymentInitiation({
        userId,
        recipientEmail: body.recipientEmail,
        amount: body.amount,
        currency: body.currency,
        description: body.description,
        deviceFingerprint: body.deviceFingerprint,
        ipAddress: resolvedIp,
        location: body.location || (resolvedIp.startsWith("185.220") ? "Overseas Proxy (Frankfurt / Tor Node)" : "Local Authorized Client"),
      });

      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Transaction initiation failed", message: err.message });
    }
  });

  // PayPal Sandbox Order Creation
  fastify.post("/api/v1/paypal/create-order", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { amount = 1200, currency = "USD" } = request.body as any;
      const orderId = `PAYPAL_ORDER_${Date.now()}`;

      return reply.send({
        orderId,
        status: "CREATED",
        amount,
        currency,
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`,
            rel: "approve",
            method: "GET",
          },
        ],
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "PayPal order creation failed", message: err.message });
    }
  });
}
