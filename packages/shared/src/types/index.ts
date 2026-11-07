export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  kycStatus: string;
  riskTier: string;
  isFrozen: boolean;
  frozenUntil?: string | Date | null;
  frozenReason?: string | null;
  intentFormCompleted: boolean;
  createdAt: string | Date;
}

export interface StoredIntentDocument {
  _id?: string;
  userId: string;
  anchors: Array<{
    id: string;
    category: string;
    prompt: string;
    encryptedAnswer: string;
    hint?: string;
    embedding?: number[];
    lastUsedAt?: Date | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankDisputeDossier {
  incidentReference: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  transactionId: string;
  attemptedAmount: number;
  currency: string;
  attackerIp: string;
  location: string;
  riskScore: number;
  failureReason: string;
  failedQuestionAsked: string;
  submittedAnswer: string;
  responseTimeMs: number;
  paypalOrderStatus: string;
  bankRoutingNumber: string;
  forensicEvidence: {
    deviceFingerprint?: string;
    userAgent?: string;
    headers?: Record<string, string>;
    anomalies: string[];
  };
}
