"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Lock, CheckCircle2, X, AlertCircle } from "lucide-react";
import { VerificationChallengeData } from "../../hooks/useVerification";

interface ChallengeModalProps {
  isOpen: boolean;
  challengeData: VerificationChallengeData | null;
  onClose: () => void;
  onSubmit: (answer: string, elapsedMs: number, isTimeout: boolean) => Promise<any>;
  onSuccess?: () => void;
  onFraudLockdown?: (dossier?: any) => void;
}

export function ChallengeModal({
  isOpen,
  challengeData,
  onClose,
  onSubmit,
  onSuccess,
  onFraudLockdown,
}: ChallengeModalProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !challengeData) return;

    setAnswer("");
    setIsSubmitting(false);
    setStatusMessage(null);
    startTimeRef.current = Date.now();

    // Autofocus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  }, [isOpen, challengeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !answer.trim()) return;

    setIsSubmitting(true);
    setStatusMessage("🧠 Google Gemini verifying cognitive intent (< 400ms)...");

    const elapsed = Date.now() - startTimeRef.current;
    const res = await onSubmit(answer, elapsed, false);

    if (res?.status === "APPROVED" || res?.is_verified) {
      setStatusMessage("✅ Verified! Payment approved and funds moving.");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } else {
      setStatusMessage("🚨 Cognitive Match Failed! Locking account for 1 hour...");
      setTimeout(() => {
        if (onFraudLockdown) onFraudLockdown(res?.dossier);
      }, 1200);
    }
  };

  if (!isOpen || !challengeData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 text-slate-900 overflow-hidden">
        {/* Close / Cancel Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0070ba] text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> PayPal Cognitive Verification
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Question</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Anomalous transfer of ${Number(challengeData.amount || 1200).toFixed(2)} intercepted. Answer your private human memory prompt below to authorize this transaction.
          </p>
        </div>

        {/* Dynamic Riddle Box */}
        <div className="mb-6 p-5 rounded-2xl bg-[#f5f7fa] border border-slate-200">
          <div className="text-[11px] font-bold text-[#0070ba] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <span>❓ Personal Recall Prompt</span>
          </div>
          <p className="text-base font-bold text-slate-900 leading-relaxed">
            "{challengeData.question || "What is your primary childhood family pet name or native hometown?"}"
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Secret Answer (1–3 words):
            </label>
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. My dog Bruno"
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-900 placeholder-slate-400 font-medium text-sm outline-none transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              💡 Natural spelling tolerated. Take your time to recall. Evaluated semantically by Google Gemini.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Centered Actions */}
          <div className="pt-2 flex flex-col items-center gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting || !answer.trim()}
              className="w-full py-4 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 active:scale-[0.99] text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verify & Complete Payment
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Cancel Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
