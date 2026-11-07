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
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950">Payment Successfully Verified & Approved!</h4>
            <p className="text-xs text-emerald-700">{message || "Funds moved securely under PayShield Protection."}</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-emerald-100 text-emerald-600 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-red-950">Unauthorized Transfer Blocked!</h4>
          <p className="text-xs text-red-700">
            Account frozen for 1 hour to protect funds. Ref: {dossierReference || "PS-FR-2026-9812A"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/alerts/lockdown"
          className="text-xs font-bold px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition flex items-center gap-1"
        >
          View Lockdown <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {onDismiss && (
          <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-red-100 text-red-600 transition">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
