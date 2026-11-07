import { VerificationState } from "./state.js";
import { ragRetrieverNode } from "./nodes/rag-retriever.js";
import { challengeNode } from "./nodes/challenge-node.js";
import { interruptTimerNode } from "./nodes/interrupt-timer.js";
import { evaluatorNode } from "./nodes/evaluator-node.js";
import { adaptiveFollowupNode } from "./nodes/adaptive-followup.js";
import { forensicNode } from "./nodes/forensic-node.js";

/**
 * PayShield Master LangGraph Verification Engine
 * Coordinates: RAG Memory Retrieval -> Challenge Formulator -> Human Wait Window -> Semantic Judge -> Escalation
 */

export class VerificationGraphRunner {
  /**
   * Phase 1: Formulates the challenge riddle & arms the 10s countdown.
   */
  async initiateChallenge(initialState: VerificationState): Promise<VerificationState> {
    // 1. Contextual RAG lookup
    const ragUpdate = await ragRetrieverNode(initialState);
    let state: VerificationState = { ...initialState, ...ragUpdate };

    // 2. Challenge Formulation with Gemini 1.5 Flash
    const challengeUpdate = await challengeNode(state);
    state = { ...state, ...challengeUpdate };

    return state;
  }

  /**
   * Phase 2: Evaluates the human response within the 10s window.
   */
  async processAnswer(
    state: VerificationState,
    submittedAnswer: string,
    responseTimeMs: number,
    isTimeout: boolean = false
  ): Promise<{ state: VerificationState; dossier?: any }> {
    let current: VerificationState = {
      ...state,
      submittedAnswer,
      responseTimeMs,
      isTimeout,
    };

    // 3. Interrupt Timer Check
    const timerUpdate = await interruptTimerNode(current);
    current = { ...current, ...timerUpdate };

    // 4. LLM-as-a-Judge Evaluation
    const evalUpdate = await evaluatorNode(current);
    current = { ...current, ...evalUpdate };

    // 5. Borderline handling
    if (current.decision?.is_borderline) {
      const adaptiveUpdate = await adaptiveFollowupNode(current);
      current = { ...current, ...adaptiveUpdate };
    }

    // 6. Forensic packaging if fraud / failed
    let dossier: any = undefined;
    if (current.finalStatus === "REJECTED_FRAUD" || current.isTimeout) {
      const forensicRes = await forensicNode(current);
      dossier = forensicRes.dossier;
      current.dossierReference = dossier.incidentReference;
    }

    return { state: current, dossier };
  }
}

export const verificationGraph = new VerificationGraphRunner();
