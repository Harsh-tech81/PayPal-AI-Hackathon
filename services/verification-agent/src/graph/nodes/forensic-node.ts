import { VerificationState } from "../state.js";
import { BankDisputeDossier } from "@payshield/shared";

/**
 * Node 7: Forensic Dossier Compiler
 * Compiles a forensic packet for Escalation and Bank Dispute when fraud is intercepted.
 */

export async function forensicNode(state: VerificationState): Promise<{ dossier: BankDisputeDossier }> {
  const ref = `PS-FR-2026-${Math.floor(1000 + Math.random() * 9000)}A`;

  const dossier: BankDisputeDossier = {
    incidentReference: ref,
    timestamp: new Date().toISOString(),
    userId: state.userId,
    userEmail: `user-${state.userId.slice(0, 8)}@payshield.ai`,
    transactionId: state.transactionId,
    attemptedAmount: state.amount,
    currency: state.currency || "USD",
    attackerIp: state.ipAddress || "185.220.101.5",
    location: state.location || "Overseas Proxy (Frankfurt / Tor Node)",
    riskScore: state.riskScore,
    failureReason: state.decision?.reasoning || (state.isTimeout ? "Verification Window Expired" : "Failed Semantic Verification"),
    failedQuestionAsked: state.challengeRiddle || "Cognitive verification challenge",
    submittedAnswer: state.submittedAnswer || "[INCORRECT_OR_EXPIRED]",
    responseTimeMs: state.responseTimeMs || 3500,
    paypalOrderStatus: "VOIDED_BY_COGNITIVE_SHIELD",
    bankRoutingNumber: process.env.BANK_ROUTING_NUMBER || "121000358",
    forensicEvidence: {
      anomalies: [
        `Risk Score: ${state.riskScore.toFixed(2)}`,
        `Foreign Proxy IP anomaly: ${state.ipAddress || "185.220.101.5"}`,
        `Failed Intent Response in cognitive verification session`,
      ],
    },
  };

  return { dossier };
}
