import { z } from "zod";

export const VerificationDecisionSchema = z.object({
  is_verified: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  is_borderline: z.boolean().optional().default(false),
});

export type VerificationDecision = z.infer<typeof VerificationDecisionSchema>;

export const GenerateChallengeSchema = z.object({
  userId: z.string(),
  transactionId: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  location: z.string().optional().default("Unknown"),
  ipAddress: z.string().optional().default("127.0.0.1"),
  riskScore: z.number().default(0.8),
  category: z.string().optional(),
  recipientEmail: z.string().optional(),
});

export type GenerateChallengeInput = z.infer<typeof GenerateChallengeSchema>;

export const SubmitAnswerSchema = z.object({
  challengeToken: z.string().min(1, "Challenge token required"),
  transactionId: z.string(),
  userId: z.string(),
  answer: z.string(),
  responseTimeMs: z.number().nonnegative(),
  isTimeout: z.boolean().default(false),
  attackerIp: z.string().optional(),
  userAgent: z.string().optional(),
});

export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;

export const RiskScoreRequestSchema = z.object({
  userId: z.string(),
  amount: z.number(),
  currency: z.string().default("USD"),
  deviceFingerprint: z.string().optional(),
  ipAddress: z.string().optional(),
  location: z.string().optional(),
  timeIso: z.string().optional(),
  recipientEmail: z.string().optional(),
});

export type RiskScoreRequestInput = z.infer<typeof RiskScoreRequestSchema>;

export const RiskScoreResponseSchema = z.object({
  riskScore: z.number().min(0).max(1),
  tier: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  requiresVerification: z.boolean(),
  anomalies: z.array(z.string()),
  evaluatedAt: z.string(),
});

export type RiskScoreResponse = z.infer<typeof RiskScoreResponseSchema>;
