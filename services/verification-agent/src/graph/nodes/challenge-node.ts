import crypto from "node:crypto";
import { VerificationState } from "../state.js";
import { generateDynamicRiddle } from "../../config/gemini.config.js";
import { setCountdownKey } from "../../config/redis.config.js";

/**
 * Node 3: Challenge Formulator Node
 * Invokes Gemini 1.5 Flash to generate dynamic riddle and arms 10-second Redis countdown window.
 */

export async function challengeNode(state: VerificationState): Promise<Partial<VerificationState>> {
  if (!state.selectedAnchor) {
    throw new Error("Cannot formulate challenge without selected anchor");
  }

  const riddle = await generateDynamicRiddle(state.selectedAnchor, {
    amount: state.amount,
    location: state.location,
  });

  const challengeToken = `ctk_${crypto.randomUUID()}`;
  const now = Date.now();
  const challengeWindowSeconds = parseInt(process.env.LANGGRAPH_TIMEOUT_SECONDS || "10", 10);
  const ttlSeconds = Math.max(300, challengeWindowSeconds * 10); // Cache TTL allows roundtrip evaluation
  const expiresAt = now + challengeWindowSeconds * 1000;

  // Arm challenge token in Redis / Memory store
  const challengePayload = {
    challengeToken,
    transactionId: state.transactionId,
    userId: state.userId,
    amount: state.amount,
    recipientEmail: state.recipientEmail,
    riddle,
    expectedAnswer: state.selectedAnchor.plainAnswer,
    selectedAnchor: state.selectedAnchor,
    expiresAt,
  };

  await setCountdownKey(`challenge:${challengeToken}`, challengePayload, ttlSeconds);
  if (state.transactionId) {
    await setCountdownKey(`txn:${state.transactionId}`, challengePayload, ttlSeconds);
  }

  return {
    challengeRiddle: riddle,
    challengeToken,
    countdownExpiresAt: expiresAt,
  };
}
