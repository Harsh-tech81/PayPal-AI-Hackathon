"use client";

import React from "react";
import { CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, X } from "lucide-react";
import Link from "next/link";

interface ResultBannerProps {
  status: "APPROVED" | "REJECTED_FRAUD" | "AUTO_APPROVED" | null;
  message?: string;
  dossierReference?: string;
  onDismiss?: () => void;
}

export function ResultBanner({ status, message, dossierReference, onDismiss }: ResultBannerProps) {
  if (!status) return null;

  if (status === "APPROVED" || status === "AUTO_APPROVED") {
    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 text-emerald-950 flex items-center justify-between shadow-glow-emerald animate-fade-in">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm text-emerald-950">Payment Successfully Verified & Approved!</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{message || "Funds moved securely under PayShield Protection."}</p>
          </div>
        </div>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="p-2 rounded-full hover:bg-emerald-100 text-emerald-700 transition active:scale-95"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-50 via-red-50 to-rose-50 border border-rose-200/90 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow-rose animate-fade-in">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm border border-rose-200">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-black text-sm text-rose-950">Unauthorized Transfer Intercepted & Blocked!</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            Account frozen for 1 hour to protect funds. Ref: <span className="font-mono font-bold">{dossierReference || "PS-FR-2026-9812A"}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link
          href="/alerts/lockdown"
          className="text-xs font-bold px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-sm flex items-center gap-1.5"
        >
          <span>View Lockdown</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {onDismiss && (
          <button 
            onClick={onDismiss} 
            className="p-2 rounded-full hover:bg-rose-100 text-rose-700 transition active:scale-95"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}