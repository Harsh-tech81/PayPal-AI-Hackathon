import crypto from "node:crypto";
import { VerificationState } from "../state.js";
import { setCountdownKey } from "../../config/redis.config.js";

/**
 * Node 3: Challenge Formulator Node
 *
 * CRITICAL RULE:
 * Strictly asks the ONLY and ONLY question the user set in their memory vault!
 * No rewritten riddles that confuse the user or distort the question.
 */

export async function challengeNode(state: VerificationState): Promise<Partial<VerificationState>> {
  if (!state.selectedAnchor) {
    throw new Error("Cannot formulate challenge without selected anchor");
  }

  // Ask the EXACT question from the user's memory vault
  const rawPrompt = (state.selectedAnchor.prompt || "").trim();
  const riddle = rawPrompt.endsWith("?") ? rawPrompt : `${rawPrompt}?`;

  const challengeToken = `ctk_${crypto.randomUUID()}`;
  const now = Date.now();
  const challengeWindowSeconds = parseInt(process.env.LANGGRAPH_TIMEOUT_SECONDS || "86400", 10);
  const ttlSeconds = Math.max(3600, challengeWindowSeconds); // Give ample time for self-paced recall
  const expiresAt = now + ttlSeconds * 1000;

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
    attempts: 0,
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
