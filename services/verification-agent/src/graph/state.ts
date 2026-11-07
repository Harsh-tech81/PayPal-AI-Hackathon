export interface VerificationState {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  location?: string;
  ipAddress?: string;
  category?: string;
  recipientEmail?: string;
  riskScore: number;
  
  // Selected Anchor
  selectedAnchor?: {
    id: string;
    prompt: string;
    plainAnswer: string;
    hint?: string;
  };

  // Riddle & Token
  challengeRiddle?: string;
  challengeToken?: string;
  countdownExpiresAt?: number;

  // Answer Submitted
  submittedAnswer?: string;
  responseTimeMs?: number;
  isTimeout?: boolean;

  // Evaluation Decision
  decision?: {
    is_verified: boolean;
    confidence: number;
    reasoning: string;
    is_borderline?: boolean;
  };

  // Final status: APPROVED | AUTO_APPROVED | REJECTED_FRAUD | FROZEN
  finalStatus?: "APPROVED" | "AUTO_APPROVED" | "REJECTED_FRAUD" | "FROZEN";
  dossierReference?: string;
}
