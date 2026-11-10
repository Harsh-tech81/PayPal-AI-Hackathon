"use client";

import { useState, useCallback } from "react";
import { api } from "../lib/api-client";

export interface VerificationChallengeData {
  transactionId: string;
  challengeToken: string;
  question: string;
  timeoutSeconds: number;
  countdownExpiresAt?: number;
  riskScore?: number;
  anomalies?: string[];
  amount?: number;
  recipientEmail?: string;
}

export function useVerification() {
  const [isOpen, setIsOpen] = useState(false);
  const [challengeData, setChallengeData] = useState<VerificationChallengeData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const startChallenge = useCallback((data: VerificationChallengeData) => {
    setChallengeData(data);
    setResult(null);
    setIsOpen(true);
  }, []);

  const closeChallenge = useCallback(() => {
    if (challengeData?.transactionId) {
      api.cancelTransaction(challengeData.transactionId).catch(() => {});
    }
    setIsOpen(false);
  }, [challengeData]);

  const submitAnswer = useCallback(
    async (answer: string, elapsedMs: number, isTimeout: boolean = false) => {
      if (!challengeData) return;
      setIsSubmitting(true);
      try {
        const userId = localStorage.getItem("payshield_user_id") || "a0000000-0000-0000-0000-000000000001";
        const res = await api.submitChallengeAnswer({
          challengeToken: challengeData.challengeToken,
          transactionId: challengeData.transactionId,
          userId,
          answer,
          responseTimeMs: elapsedMs,
          isTimeout,
          attackerIp: (challengeData as any).attackerIp || "185.220.101.5",
        });

        setResult(res);

        // ── Handle safe error: session expired, vault not found ──────────────
        // Don't freeze the account — just surface the error and let user retry.
        if (res?.status === "VERIFICATION_ERROR") {
          return {
            status: "VERIFICATION_ERROR",
            is_verified: false,
            sessionExpired: true,
            reasoning: res.reasoning || "Security session expired. Please retry the payment.",
          };
        }
        // ─────────────────────────────────────────────────────────────────────

        return res;
      } catch (err: any) {
        const failRes = {
          status: "REJECTED_FRAUD",
          is_verified: false,
          confidence: 0.0,
          reasoning: "Communication timeout with verification engine",
          accountFrozen: true,
        };
        setResult(failRes);
        return failRes;
      } finally {
        setIsSubmitting(false);
      }
    },
    [challengeData]
  );

  return {
    isOpen,
    challengeData,
    isSubmitting,
    result,
    startChallenge,
    closeChallenge,
    submitAnswer,
  };
}
