"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, Lock, CheckCircle2, X, AlertCircle, Sparkles, Brain, Cpu, ArrowRight, Loader2 } from "lucide-react";
import { VerificationChallengeData } from "../../hooks/useVerification";

interface ChallengeModalProps {
  isOpen: boolean;
  challengeData: VerificationChallengeData | null;
  onClose: () => void;
  onSubmit: (answer: string, elapsedMs: number, isTimeout: boolean) => Promise<any>;
  onSuccess?: (res?: any) => void;
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
  const [mounted, setMounted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
    setStatusMessage("Verifying answer with AI security model...");

    const elapsed = Date.now() - startTimeRef.current;
    const res = await onSubmit(answer, elapsed, false);

    if (res?.status === "APPROVED" || res?.is_verified) {
      setStatusMessage("Identity verified! Payment authorized and processing.");
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 700);
    } else {
      if (typeof window !== "undefined") {
        localStorage.setItem("payshield_user_frozen", "true");
      }
      if (onFraudLockdown) {
        onFraudLockdown(res?.dossier);
      }
    }
  };

  if (!isOpen || !challengeData || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 transition-all duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-7 sm:p-9 text-slate-900 overflow-hidden animate-fade-in">
        {/* Ambient top light */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#003087] via-[#0070ba] to-sky-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all hover:scale-105 active:scale-95"
          title="Close Challenge"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0070ba] shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#0070ba]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Security Check</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            We noticed an unusual transfer of <span className="font-bold text-slate-900">${Number(challengeData.amount || 1200).toFixed(2)}</span>. Answer your private security question below to authorize this payment.
          </p>
        </div>

        {/* Security Question Box */}
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100/80 shadow-sm relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Security Question</span>
          </div>
          <p className="text-base sm:text-lg font-black text-slate-950 leading-snug">
            "{challengeData.question || "What is your primary childhood family pet name or native hometown?"}"
          </p>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Untimed • Self-paced</span>
            <span className="text-[#0070ba] font-medium flex items-center gap-1">
              Encrypted Vault Protected
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Your Answer
            </label>
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. My dog Bruno"
              disabled={isSubmitting}
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-950 placeholder-slate-400 font-bold text-base outline-none transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
              <span>Natural spelling and variations accepted.</span>
            </p>
          </div>

          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2.5 shadow-sm animate-fade-in">
              <Loader2 className="w-4 h-4 animate-spin text-[#0070ba] shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col items-center gap-2.5">
            <button
              type="submit"
              disabled={isSubmitting || !answer.trim()}
              className="w-full py-4 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 active:scale-[0.99] text-white shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Verify & Authorize Transfer</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1"
            >
              Cancel Transfer
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
