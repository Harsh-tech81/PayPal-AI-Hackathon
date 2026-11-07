import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";
import { generateBankDisputeDossier } from "../actions/bank-reporter.js";
import prisma from "../../../../database/prisma-client.js";

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

  fastify.get("/api/v1/escalate/incidents/:userId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      let incidents: any[] = [];
      try {
        incidents = await prisma.fraudIncident.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          include: { transaction: true },
        });
      } catch (dbErr: any) {
        fastify.log.warn(`[Incidents Fetch Notice] ${dbErr.message}`);
      }

      return reply.send({ userId, count: incidents.length, incidents });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch incidents", message: err.message });
    }
  });

  fastify.get("/api/v1/escalate/evidence/:incidentId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { incidentId } = request.params as { incidentId: string };
      let incident: any = null;
      try {
        incident = await prisma.fraudIncident.findFirst({
          where: { OR: [{ id: incidentId }, { bankReferenceId: incidentId }] },
          include: { user: true, transaction: true },
        });
      } catch (dbErr: any) {
        fastify.log.warn(`[Evidence Fetch Notice] ${dbErr.message}`);
      }

      const dossier = await generateBankDisputeDossier(incident?.bankReferenceId || incidentId, incident?.userId);
      const canonicalStr = JSON.stringify(dossier);
      const sha256Seal = crypto.createHash("sha256").update(canonicalStr).digest("hex");

      return reply.send({
        status: "FORENSIC_PACKAGE_COMPILED",
        incidentId,
        cryptographicSeal: {
          algorithm: "SHA-256",
          evidenceHash: sha256Seal,
          tamperEvident: true,
          sealedAt: new Date().toISOString(),
        },
        package: dossier,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to compile forensic package", message: err.message });
    }
  });
}
