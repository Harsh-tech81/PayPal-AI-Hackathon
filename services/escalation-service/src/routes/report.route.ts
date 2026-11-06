import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { generateBankDisputeDossier } from "../actions/bank-reporter.js";

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.post("/api/v1/escalate/report-to-bank", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as {
        incidentReference: string;
        userId?: string;
      };

      if (!body.incidentReference) {
        return reply.status(400).send({ error: "incidentReference is required" });
      }

      const dossier = await generateBankDisputeDossier(body.incidentReference, body.userId);

      return reply.send({
        status: "DOSSIER_GENERATED",
        dossier,
        exportedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to generate bank report", message: err.message });
    }
  });
}
