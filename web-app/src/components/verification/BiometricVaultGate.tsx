"use client";

import React, { useState } from "react";
import {
  Fingerprint,
  CheckCircle2,
  RefreshCw,
  Lock,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  verifyBiometricPasskey,
  registerBiometricPasskey,
  getStoredBiometricCredential,
  instantBiometricBypass,
  isWebAuthnSupported,
} from "../../lib/webauthn";
import { getSession } from "../../lib/auth-session";

interface BiometricVaultGateProps {
  onVerified: () => void;
}

export function BiometricVaultGate({ onVerified }: BiometricVaultGateProps) {
  const [step, setStep] = useState<"ready" | "authenticating" | "verified" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBiometricAuth = async (mode: "auto" | "register" | "bypass" = "auto") => {
    setErrorMessage(null);

    // 1. One-Click Instant Bypass for localhost testing / presentations
    if (mode === "bypass") {
      setStep("authenticating");
      setTimeout(() => {
        instantBiometricBypass();
        setStep("verified");
        setTimeout(() => onVerified(), 600);
      }, 350);
      return;
    }

    setStep("authenticating");

    try {
      const session = getSession();
      const currentEmail = session?.user?.email;
      const currentUserId = session?.user?.id;
      const existing = getStoredBiometricCredential(currentEmail);

      const isPasskeyMismatch = Boolean(existing?.userEmail && currentEmail && existing.userEmail.toLowerCase().trim() !== currentEmail.toLowerCase().trim());

      // If user explicitly requested registration OR no passkey enrolled yet for this user OR passkey mismatch
      if (mode === "register" || !existing || existing.id.startsWith("dev_") || isPasskeyMismatch) {
        const regRes = await registerBiometricPasskey({
          id: currentUserId || undefined,
          name: currentEmail || undefined,
          displayName: session?.user?.fullName || undefined,
        });

        if (!regRes.success) {
          setStep("error");
          setErrorMessage(regRes.error || "Biometric registration was cancelled.");
          return;
        }

        setStep("verified");
        setTimeout(() => onVerified(), 800);
        return;
      }

      // Existing passkey: verify assertion for current user
      const verifyRes = await verifyBiometricPasskey(currentEmail);
      if (!verifyRes.success) {
        setStep("error");
        setErrorMessage(
          verifyRes.error || "No passkey found on this device for your account. Click 'Register Android Fingerprint' below to set it up."
        );
        return;
      }

      setStep("verified");
      setTimeout(() => onVerified(), 800);
    } catch (err: any) {
      setStep("error");
      setErrorMessage(err.message || "Device biometric authentication failed.");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-luxury backdrop-blur-xl text-center relative overflow-hidden animate-fade-in">
      {/* Top Security Icon */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-50 to-blue-100 text-[#0070ba] flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-200/60">
        <Lock className="w-8 h-8" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
        Security Verification
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        Confirm your identity using your device passkey or fingerprint to access and manage your security questions.
      </p>

      {/* Biometric Sensor Visualizer */}
      <div className="my-7 p-8 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 transition-all duration-500 border ${
              step === "verified"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                : step === "authenticating"
                ? "bg-sky-500/20 border-sky-400 text-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)] animate-pulse"
                : step === "error"
                ? "bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                : "bg-white/5 border-white/10 text-sky-400 shadow-inner"
            }`}
          >
            {step === "verified" ? (
              <CheckCircle2 className="w-12 h-12" />
            ) : step === "authenticating" ? (
              <RefreshCw className="w-12 h-12 animate-spin" />
            ) : (
              <Fingerprint className="w-12 h-12" />
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Smartphone className="w-4 h-4 text-sky-400" />
            <span>
              {step === "verified"
                ? "Identity Confirmed"
                : step === "authenticating"
                ? "Awaiting Device Confirmation..."
                : "Device Passkey Ready"}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            {step === "verified"
              ? "Opening security questions..."
              : step === "authenticating"
              ? "Scan your fingerprint or verify with your device lock"
              : "Protected with device passkey authentication"}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 text-left animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {step !== "authenticating" && (
          <>
            <button
              onClick={() => handleBiometricAuth("auto")}
              className="w-full py-4 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 group"
            >
              <Fingerprint className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>
                {step === "error"
                  ? "Retry Verification"
                  : "Verify Identity with Passkey"}
              </span>
            </button>

            {/* Direct Register Passkey Button */}
            <button
              type="button"
              onClick={() => handleBiometricAuth("register")}
              className="w-full py-3 rounded-full font-bold text-xs bg-sky-50 hover:bg-sky-100 text-[#0070ba] border border-sky-200/80 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-[#0070ba]" />
              <span>Set Up Passkey on this Device</span>
            </button>

            {/* Instant 1-Click Biometric Demo Pass */}
            <button
              type="button"
              onClick={() => handleBiometricAuth("bypass")}
              className="w-full py-2.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Verify (Demo Mode)</span>
            </button>
          </>
        )}

        {step === "authenticating" && (
          <button
            disabled
            className="w-full py-4 rounded-full font-bold text-sm bg-slate-200 text-slate-600 flex items-center justify-center gap-2 cursor-wait"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#0070ba]" />
            <span>Awaiting device confirmation...</span>
          </button>
        )}

        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 pt-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel &amp; Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default BiometricVaultGate;
