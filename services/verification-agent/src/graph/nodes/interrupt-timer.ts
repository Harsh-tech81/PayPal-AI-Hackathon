import { VerificationState } from "../state.js";
import { getCountdownKey } from "../../config/redis.config.js";

/**
 * Node 4: Cognitive Verification Gate
 * Validates verification intent without aggressive countdown pressure.
 * The human user can take their time to recall and answer.
 */

export async function interruptTimerNode(state: VerificationState): Promise<Partial<VerificationState>> {
  // Only time out if explicitly canceled by user
  if (state.isTimeout) {
    return { isTimeout: true };
  }

  return { isTimeout: false };
}
