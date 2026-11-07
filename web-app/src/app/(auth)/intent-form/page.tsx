"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IntentFormWizard } from "../../../components/forms/IntentFormWizard";
import { CameraVaultGate } from "../../../components/verification/CameraVaultGate";
import { X, ShieldCheck } from "lucide-react";

export default function IntentFormPage() {
  const router = useRouter();
  const [isCameraVerified, setIsCameraVerified] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa] py-10 px-4 flex flex-col items-center justify-center text-slate-900">
      <div className="w-full max-w-3xl flex items-center justify-between mb-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0070ba] text-white font-black text-base italic flex items-center justify-center shadow-sm">
            P
          </div>
          <div className="flex items-baseline">
            <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
            <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            <span className="ml-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Shield Vault
            </span>
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-4 py-2 rounded-full bg-white border border-slate-300 shadow-sm transition"
        >
          Return to Dashboard <X className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!isCameraVerified ? (
        <CameraVaultGate onVerified={() => setIsCameraVerified(true)} />
      ) : (
        <IntentFormWizard onCompleted={() => router.push("/dashboard")} />
      )}
    </div>
  );
}
