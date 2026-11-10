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

      const { secrets } = parsed.data;
      const rawUserId = (parsed.data.userId || "").trim();
      if (!rawUserId) {
        return reply.status(400).send({ error: "userId is required to configure intent vault" });
      }
      const userId = rawUserId;

      // If user submits 0 anchors (chooses direct payment mode)
      if (secrets.length === 0) {
        await intentRepository.clearIntentSecrets(userId);
        await userRepository.updateIntentCleared(userId);
        return reply.send({
          status: "VAULT_CLEARED_DIRECT_PAYMENTS",
          anchorsConfigured: 0,
          message: "Memory vault cleared. Direct payment mode enabled with automatic approval.",
        });
      }

      // Prepare anchors (accepting pre-encrypted client Web Crypto ciphertexts or encrypting at rest)
      const encryptedAnchors = secrets.map((sec, index) => {
        let serializedEncrypted = "";
        if (sec.encryptedAnswer && sec.encryptedAnswer.includes(":")) {
          serializedEncrypted = sec.encryptedAnswer.trim();
        } else if (sec.answer) {
          const enc = encryptSecret(sec.answer.trim());
          serializedEncrypted = serializeEncryptedPayload(enc);
        } else {
          const enc = encryptSecret("Secret Memory");
          serializedEncrypted = serializeEncryptedPayload(enc);
        }

        return {
          id: sec.id || `anc_${index + 1}_${crypto.randomBytes(4).toString("hex")}`,
          category: sec.category,
          prompt: sec.prompt,
          encryptedAnswer: serializedEncrypted,
          hint: sec.hint || "",
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
        message: `${encryptedAnchors.length} private human memories encrypted with AES-256-GCM and stored in MongoDB vault.`,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to setup intent vault", message: err.message });
    }
  });

  // Clear user's vault and switch to direct payment mode
  fastify.post("/api/v1/intent-form/clear", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = (request.body || {}) as { userId?: string };
      const rawUserId = (body.userId || "").trim();
      if (!rawUserId) {
        return reply.status(400).send({ error: "userId is required to clear intent vault" });
      }
      const userId = rawUserId;

      await intentRepository.clearIntentSecrets(userId);
      await userRepository.updateIntentCleared(userId);

      return reply.send({
        status: "VAULT_CLEARED_DIRECT_PAYMENTS",
        anchorsConfigured: 0,
        message: "Memory vault cleared. Direct payment mode enabled with automatic approval.",
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Failed to clear intent vault", message: err.message });
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
