"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, Download, CheckCircle2, Clock, Video, ArrowLeft, ShieldCheck, AlertTriangle, FileText, Lock, Fingerprint } from "lucide-react";
import { api } from "../../../lib/api-client";
import { VideoKycModal } from "../../../components/verification/VideoKycModal";

export default function LockdownPage() {
  const [minutes, setMinutes] = useState(59);
  const [seconds, setSeconds] = useState(59);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [unfreezeSuccess, setUnfreezeSuccess] = useState(false);
  const [attemptedAmount, setAttemptedAmount] = useState("1,200.00");
  const [incidentRef, setIncidentRef] = useState("PS-FR-2026-9812A");
  const [attackerIp, setAttackerIp] = useState("185.220.101.5 (Tor Proxy / Frankfurt)");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const amt = search.get("amount");
      if (amt && !isNaN(parseFloat(amt))) {
        setAttemptedAmount(parseFloat(amt).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
      const ref = search.get("ref");
      if (ref) setIncidentRef(ref);
      const ip = search.get("ip");
      if (ip) setAttackerIp(`${ip} (Unrecognized Proxy Node)`);

      // Check real freeze expiration timestamp from session
      const rawFrozenUntil = localStorage.getItem("payshield_frozen_until");
      const targetTime = rawFrozenUntil ? new Date(rawFrozenUntil).getTime() : Date.now() + 60 * 60 * 1000;

      const updateRemaining = () => {
        const diffMs = Math.max(0, targetTime - Date.now());
        const totalSecs = Math.floor(diffMs / 1000);
        setMinutes(Math.floor(totalSecs / 60));
        setSeconds(totalSecs % 60);
      };

      updateRemaining();
      const timer = setInterval(updateRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, []);

  const handleDownloadDossier = async () => {
    try {
      const res = await api.downloadBankReport(incidentRef);
      const blob = new Blob([JSON.stringify(res.dossier, null, 2)], { type: "application/json" });
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
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 flex flex-col items-center justify-center text-slate-900 relative overflow-hidden selection:bg-rose-500 selection:text-white">
      {/* Red Ambient Alarm Backing */}
      <div className="absolute inset-0 bg-radial-hero pointer-events-none opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-white/95 border border-slate-200/90 rounded-3xl p-7 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden z-10 animate-fade-in">
        {/* Top Header Badge */}
        <div className="text-center mb-7">
          <div className="mx-auto w-18 h-18 rounded-3xl bg-gradient-to-tr from-rose-50 to-rose-100 border border-rose-200/80 text-rose-600 flex items-center justify-center mb-4 shadow-glow-rose">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200/90 text-rose-700 text-[10px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Security Lockdown Mode
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Account Temporarily Locked
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            PayShield AI intercepted an unauthorized payment attempt before any funds were transferred.
          </p>
        </div>

        {/* Status Card */}
        <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/90 mb-6 space-y-3.5 shadow-inner">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0070ba]" /> Freeze Duration: 1-Hour Lock
            </span>
            <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border shadow-sm ${
              unfreezeSuccess 
                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                : "bg-amber-50 text-amber-900 border-amber-200"
            }`}>
              {unfreezeSuccess ? "RESTORED" : `${minutes}m ${seconds < 10 ? `0${seconds}` : seconds}s`}
            </span>
          </div>

          <div className="text-xs space-y-2.5 text-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Attempted Amount:</span>
              <span className="font-black text-slate-950 text-sm">${attemptedAmount} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Attacker IP Node:</span>
              <span className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                {attackerIp}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Trigger Reason:</span>
              <span className="text-rose-700 font-bold">Cognitive Memory Verification Mismatch</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">PayPal Order Status:</span>
              <span className="text-emerald-700 font-black flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> VOIDED &amp; CANCELLED (Safe)
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Incident Reference:</span>
              <span className="font-mono text-[#0070ba] font-black">{incidentRef}</span>
            </div>
          </div>
        </div>

        {/* Automated Actions Executed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-slate-50 border border-blue-100 mb-6 space-y-2 text-xs">
          <div className="text-slate-800 font-black uppercase tracking-wider text-[10px] mb-2">
            Automated Protection Executed:
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Multi-channel SMS &amp; Email dispatched via Twilio &amp; Gmail</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Forensic Incident Dossier compiled for your bank</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Attacker IP submitted to Edge Firewall blocklist</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full">
          {!unfreezeSuccess ? (
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="w-full py-4 px-6 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 active:scale-[0.99] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <Fingerprint className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
              <span>Verify with Device Biometrics (Windows Hello / Touch ID)</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="w-full py-4 px-6 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Access Restored! Return to Dashboard</span>
            </Link>
          )}

          <button
            onClick={handleDownloadDossier}
            className="w-full py-3.5 px-6 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Download className="w-4 h-4 text-[#0070ba]" />
            <span>Download Bank Dispute Evidence (JSON)</span>
          </button>

          <div className="text-center pt-2">
            <Link
              href="/dashboard"
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1 font-bold transition py-1"
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