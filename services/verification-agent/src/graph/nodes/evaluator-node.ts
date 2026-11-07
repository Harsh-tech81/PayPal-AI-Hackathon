import { VerificationState } from "../state.js";
import { evaluateSemanticAnswer } from "../../config/gemini.config.js";

/**
 * Node 5: LLM-as-a-Judge Semantic Evaluator Node
 */

export async function evaluatorNode(state: VerificationState): Promise<Partial<VerificationState>> {
  // Only reject for timeout if user explicitly timed out AND provided no answer
  if (state.isTimeout && (!state.submittedAnswer || !state.submittedAnswer.trim())) {
    return {
      decision: {
        is_verified: false,
        confidence: 0.0,
        reasoning: "Challenge expired: countdown reached 0.0s without response",
      },
      finalStatus: "REJECTED_FRAUD",
    };
  }

  const expected = state.selectedAnchor?.plainAnswer || "";
  const riddle = state.challengeRiddle || "";
  const submitted = (state.submittedAnswer || "").trim();

  const evalResult = await evaluateSemanticAnswer(riddle, expected, submitted);

  let finalStatus: "APPROVED" | "REJECTED_FRAUD" | "FROZEN" = "REJECTED_FRAUD";
  if (evalResult.is_verified && evalResult.confidence >= 0.50) {
    finalStatus = "APPROVED";
  }

  return {
    decision: evalResult,
    finalStatus,
  };
}
