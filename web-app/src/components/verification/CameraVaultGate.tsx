"use client";

import React, { useState } from "react";
import { Fingerprint, CheckCircle2, ShieldCheck, RefreshCw, Lock, ArrowLeft, AlertCircle, Laptop, Sparkles, Smartphone } from "lucide-react";
import Link from "next/link";
import {
  verifyBiometricPasskey,
  registerBiometricPasskey,
  getStoredBiometricCredential,
  instantBiometricBypass,
  isWebAuthnSupported,
} from "../../lib/webauthn";
import { getSession } from "../../lib/auth-session";
import { api } from "../../lib/api-client";

interface CameraVaultGateProps {
  onVerified: () => void;
}

export function CameraVaultGate({ onVerified }: CameraVaultGateProps) {
  const [step, setStep] = useState<"ready" | "authenticating" | "verified" | "error">("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const markAccountUnfrozen = async () => {
    try {
      await api.unfreezeAccount("webauthn_biometric");
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.setItem("payshield_user_frozen", "false");
      localStorage.removeItem("payshield_frozen_until");
    }
  };

  const handleBiometricAuth = async (mode: "auto" | "register" | "bypass" = "auto") => {
    setErrorMessage(null);

    // 1. One-Click Instant Bypass for localhost testing / presentations
    if (mode === "bypass") {
      setStep("authenticating");
      setTimeout(async () => {
        instantBiometricBypass();
        await markAccountUnfrozen();
        setStep("verified");
        setTimeout(() => onVerified(), 700);
      }, 400);
      return;
    }

    setStep("authenticating");

    try {
      const session = getSession();
      const existing = getStoredBiometricCredential();

      // If user explicitly requested registration OR no passkey has been saved yet
      if (mode === "register" || !existing || existing.id.startsWith("dev_")) {
        const regRes = await registerBiometricPasskey({
          id: session?.user?.id || "owner-vault-biometric",
          name: session?.user?.email || "owner@payshield.ai",
          displayName: session?.user?.fullName || "PayPal Account Owner",
        });

        if (!regRes.success) {
          setStep("error");
          setErrorMessage(regRes.error || "Biometric registration was cancelled.");
          return;
        }

        // Successfully created & verified passkey with fingerprint
        await markAccountUnfrozen();
        setStep("verified");
        setTimeout(() => onVerified(), 900);
        return;
      }

      // Existing passkey: verify assertion
      const verifyRes = await verifyBiometricPasskey();
      if (!verifyRes.success) {
        setStep("error");
        setErrorMessage(
          verifyRes.error || "No passkey found on this device. Click 'Register Android Fingerprint' below to set it up."
        );
        return;
      }

      await markAccountUnfrozen();
      setStep("verified");
      setTimeout(() => onVerified(), 900);
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

      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0070ba] text-[10px] font-black uppercase tracking-wider mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba] animate-pulse" />
        WebAuthn FIDO2 Biometric Gate Active
      </span>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
        Device Biometric Verification
      </h2>
      <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        Verify your identity using your hardware biometric sensor (Android Fingerprint, Windows Hello, Touch ID, or PIN) to unlock your Zero-Knowledge Memory Vault.
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
                ? "Biometric Identity Verified"
                : step === "authenticating"
                ? "Awaiting Biometric Touch on Android / PC..."
                : "Android Fingerprint & Windows Hello Ready"}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            {step === "verified"
              ? "Opening encrypted Zero-Knowledge Memory Vault..."
              : step === "authenticating"
              ? "Scan your fingerprint on your phone or PC to authenticate"
              : "Hardware-backed biometric passkey via Bluetooth / FIDO2"}
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
                  ? "Retry Biometric Verification"
                  : "Authenticate with Android Fingerprint / Passkey"}
              </span>
            </button>

            {/* Direct Register Passkey Button (Fixes "No passkeys available" by creating passkey on phone) */}
            <button
              type="button"
              onClick={() => handleBiometricAuth("register")}
              className="w-full py-3 rounded-full font-bold text-xs bg-sky-50 hover:bg-sky-100 text-[#0070ba] border border-sky-200/80 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Smartphone className="w-4 h-4 text-[#0070ba]" />
              <span>Register New Fingerprint Passkey on Android Phone</span>
            </button>

            {/* Instant 1-Click Biometric Demo Pass */}
            <button
              type="button"
              onClick={() => handleBiometricAuth("bypass")}
              className="w-full py-2.5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant 1-Click Biometric Verification (Demo / Localhost)</span>
            </button>
          </>
        )}

        {step === "authenticating" && (
          <button
            disabled
            className="w-full py-4 rounded-full font-bold text-sm bg-slate-200 text-slate-600 flex items-center justify-center gap-2 cursor-wait"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#0070ba]" />
            <span>Awaiting Biometric Prompt on Phone / Device...</span>
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

// Export alias for forward compatibility
export const BiometricVaultGate = CameraVaultGate;
