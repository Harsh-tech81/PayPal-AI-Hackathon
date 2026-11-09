"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IntentFormWizard } from "../../../components/forms/IntentFormWizard";
import { CameraVaultGate as BiometricVaultGate } from "../../../components/verification/CameraVaultGate";
import { X, ShieldCheck, ArrowLeft } from "lucide-react";

export default function IntentFormPage() {
  const router = useRouter();
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 flex flex-col items-center justify-center text-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-hero pointer-events-none" />
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8 z-10">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-lg italic flex items-center justify-center shadow-glow-sm group-hover:scale-105 transition-all">
            P
          </div>
          <div className="flex items-baseline">
            <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
            <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#0070ba] px-2 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/70 shadow-sm">
              Shield Vault
            </span>
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md transition-all hover:scale-[1.02]"
        >
          <span>Return to Dashboard</span>
          <X className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="w-full z-10">
        {!isBiometricVerified ? (
          <BiometricVaultGate onVerified={() => setIsBiometricVerified(true)} />
        ) : (
          <IntentFormWizard onCompleted={() => router.push("/dashboard")} />
        )}
      </div>
    </div>
  );
}