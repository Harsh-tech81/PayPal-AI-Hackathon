import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import crypto from "node:crypto";
import { intentRepository } from "../repositories/intent.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { encryptSecret, decryptSecret, serializeEncryptedPayload, IntentFormSetupSchema } from "@payshield/shared";

export async function intentFormRoutes(fastify: FastifyInstance) {
  // Save 10 personal memory secrets (AES-256 encrypted into isolated MongoDB vault)
  fastify.post("/api/v1/intent-form/setup", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = IntentFormSetupSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid intent form payload",
          details: parsed.error.format(),
        });
      }

      const { userId = "a0000000-0000-0000-0000-000000000001", secrets } = parsed.data;

      // Encrypt each secret with AES-256-GCM before writing to MongoDB
      const encryptedAnchors = secrets.map((sec, index) => {
        const enc = encryptSecret(sec.answer.trim());
        return {
          id: sec.id || `anc_${index + 1}_${crypto.randomBytes(4).toString("hex")}`,
          category: sec.category,
          prompt: sec.prompt,
          encryptedAnswer: serializeEncryptedPayload(enc),
          hint: sec.hint,
          lastUsedAt: null,
        };
      });

      await intentRepository.saveIntentSecrets({
        userId,
        anchors: encryptedAnchors,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update flag in User table
      await userRepository.updateIntentCompleted(userId);

      return reply.send({
        status: "VAULT_ENCRYPTED_AND_LOCKED",
        anchorsConfigured: encryptedAnchors.length,
        message: "10 private human memories encrypted with AES-256-GCM and stored in MongoDB vault.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to setup intent vault", message: err.message });
    }
  });

  // Get status of user's vault
  fastify.get("/api/v1/intent-form/status/:userId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      const doc = await intentRepository.getIntentSecrets(userId);

      return reply.send({
        userId,
        isConfigured: !!(doc && doc.anchors?.length),
        anchorsCount: doc?.anchors?.length || 0,
        anchors: (doc?.anchors || []).map((a) => ({
          id: a.id,
          category: a.category,
          prompt: a.prompt,
          hint: a.hint,
          isEncrypted: true,
        })),
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch vault status", message: err.message });
    }
  });

  // Internal decrypted endpoint for Verification Agent to retrieve genuine memory anchors
  fastify.get("/api/v1/intent-form/internal-vault/:userId", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as { userId: string };
      if (!userId) {
        return reply.status(400).send({ error: "userId parameter is required" });
      }

      const doc = await intentRepository.getIntentSecrets(userId);

      if (!doc || !Array.isArray(doc.anchors) || doc.anchors.length === 0) {
        return reply.send({ userId, anchors: [] });
      }

      const decryptedAnchors = doc.anchors.map((a: any) => {
        let plainAnswer = "";
        try {
          if (a.encryptedAnswer) {
            plainAnswer = decryptSecret(a.encryptedAnswer);
          } else if (a.plainAnswer) {
            plainAnswer = a.plainAnswer;
          }
        } catch {
          plainAnswer = a.plainAnswer || "";
        }

        return {
          id: a.id,
          category: a.category,
          prompt: a.prompt,
          plainAnswer: plainAnswer || a.plainAnswer || "",
          hint: a.hint,
        };
      });

      return reply.send({
        userId,
        anchors: decryptedAnchors,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to fetch internal vault anchors", message: err.message });
    }
  });
}
