import { VerificationState } from "../state.js";

/**
 * Node 6: Adaptive Followup Micro-Challenge
 * If user answers borderline (e.g. 60-84%), provides a swift 1-tap hint verification.
 */

export async function adaptiveFollowupNode(state: VerificationState): Promise<Partial<VerificationState>> {
  if (state.decision?.is_borderline) {
    return {
      challengeRiddle: `${state.challengeRiddle} (Hint: ${state.selectedAnchor?.hint || "Recall your childhood pet"})`,
    };
  }
  return {};
}
