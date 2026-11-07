"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Download, CheckCircle2, Clock, Video, ArrowLeft, ShieldCheck } from "lucide-react";
import { api } from "../../../lib/api-client";
import { VideoKycModal } from "../../../components/verification/VideoKycModal";

export default function LockdownPage() {
  const [minutes, setMinutes] = useState(56);
  const [seconds, setSeconds] = useState(12);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [unfreezeSuccess, setUnfreezeSuccess] = useState(false);
  const [attemptedAmount, setAttemptedAmount] = useState("1,200.00");
  const [incidentRef, setIncidentRef] = useState("PS-FR-2026-9812A");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const amt = search.get("amount");
      if (amt && !isNaN(parseFloat(amt))) {
        setAttemptedAmount(parseFloat(amt).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      const ref = search.get("ref");
      if (ref) setIncidentRef(ref);

      const userId = search.get("userId") || undefined;
      api.getFreezeStatus(userId)
        .then((status) => {
          if (status && status.isFrozen === false) {
            setUnfreezeSuccess(true);
          } else if (status && typeof status.remainingSeconds === "number") {
            const m = Math.floor(status.remainingSeconds / 60);
            const s = status.remainingSeconds % 60;
            setMinutes(m);
            setSeconds(s);
          }
        })
        .catch((err) => {
          console.warn("[Lockdown] Could not fetch real-time freeze status:", err);
        });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 0) return prev - 1;
        setMinutes((m) => Math.max(0, m - 1));
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDownloadDossier = async () => {
    try {
      let res: any;
      try {
        res = await api.getIncidentEvidence(incidentRef);
      } catch {
        res = await api.downloadBankReport(incidentRef);
      }
      const payload = res.package || res.dossier || res;
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bank-Dispute-Dossier-${incidentRef}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error generating dossier: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-4 sm:p-8 flex flex-col items-center justify-center text-slate-900">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Top Header Badge */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mb-3">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full bg-red-100/80 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
            Security Lockdown Mode
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account Temporarily Locked
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            PayShield AI intercepted an unauthorized payment attempt before any funds were transferred.
          </p>
        </div>

        {/* Status card */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0070ba]" /> Freeze Duration: 1-Hour Lock
            </span>
            <span className="text-xs font-mono font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {unfreezeSuccess ? "RESTORED ✅" : `${minutes}m ${seconds < 10 ? `0${seconds}` : seconds}s`}
            </span>
          </div>

          <div className="text-xs space-y-2 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Attempted Amount:</span>
              <span className="font-bold text-slate-900">${attemptedAmount} USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Attacker IP Node:</span>
              <span className="font-mono text-red-600 font-semibold">185.220.101.5 (Overseas Proxy / Tor Node)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trigger Reason:</span>
              <span className="text-red-700 font-medium">Cognitive Memory Verification Mismatch</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PayPal Order Status:</span>
              <span className="text-emerald-700 font-bold">VOIDED & CANCELLED (Safe ✅)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Incident Reference:</span>
              <span className="font-mono text-[#0070ba] font-bold">{incidentRef}</span>
            </div>
          </div>
        </div>

        {/* Automated Actions Taken */}
        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 mb-6 space-y-2 text-xs">
          <div className="text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
            Automated Protection Executed:
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Multi-channel SMS & Email dispatched via Twilio & SendGrid</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Forensic Incident Dossier compiled for your bank</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Attacker IP submitted to Edge Firewall blocklist</span>
          </div>
        </div>

        {/* Action Buttons - Fixed, centered positions */}
        <div className="flex flex-col items-center gap-3 w-full">
          {!unfreezeSuccess ? (
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="w-full py-4 px-6 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition flex items-center justify-center gap-2"
            >
              <Video className="w-4 h-4 text-sky-400" />
              Verify with Video KYC to Unlock Account
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-full py-4 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Access Restored! Return to Dashboard
            </Link>
          )}

          <button
            onClick={handleDownloadDossier}
            className="w-full py-3.5 px-6 rounded-full font-semibold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-[#0070ba]" />
            Download Bank Dispute Evidence (JSON)
          </button>

          <div className="text-center pt-2">
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Safety Overview
            </Link>
          </div>
        </div>
      </div>

      {/* Video KYC Modal */}
      <VideoKycModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSuccess={() => {
          setIsVideoModalOpen(false);
          setUnfreezeSuccess(true);
        }}
      />
    </div>
  );
}
