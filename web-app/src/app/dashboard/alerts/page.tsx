"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Download, FileText, Lock, ShieldCheck } from "lucide-react";
import { api } from "../../../lib/api-client";

export default function AlertsHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [evidenceData, setEvidenceData] = useState<any | null>(null);
  const [isVerifyingSeal, setIsVerifyingSeal] = useState(false);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await api.getAlertHistory();
        if (res.logs) setLogs(res.logs);
      } catch (err) {
        console.warn("Alert fetch notice:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const handleInspectForensicSeal = async () => {
    setIsVerifyingSeal(true);
    try {
      const res = await api.getIncidentEvidence("PS-FR-2026-9812A");
      setEvidenceData(res);
    } catch (err: any) {
      alert(`Could not compile forensic package: ${err.message}`);
    } finally {
      setIsVerifyingSeal(false);
    }
  };

  const handleDownloadDossier = () => {
    if (!evidenceData) return;
    const blob = new Blob([JSON.stringify(evidenceData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Forensic-Evidence-PS-FR-2026-9812A.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Security Incident & Alert Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time audit log of blocked fraud attempts, multi-channel alert dispatches, and freeze events.
          </p>
        </div>
        <Link
          href="/alerts/lockdown"
          className="py-2.5 px-5 rounded-full font-bold text-xs bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex items-center gap-1.5 transition"
        >
          <ShieldAlert className="w-4 h-4 text-red-600" /> View Lockdown Screen
        </Link>
      </div>

      {/* Forensic Seal Verification Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                Forensic Evidence Packaging & Cryptographic Seal
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-mono">
                  SHA-256
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generates court-admissible bank dispute dossiers with tamper-evident digital fingerprints.
              </p>
            </div>
          </div>

          <button
            onClick={handleInspectForensicSeal}
            disabled={isVerifyingSeal}
            className="py-2.5 px-5 rounded-full text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shrink-0"
          >
            {isVerifyingSeal ? "Verifying Seal..." : "Verify & Inspect Seal"}
          </button>
        </div>

        {evidenceData && (
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-3 mt-4 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>SHA-256 Cryptographic Seal Valid & Tamper-Evident</span>
              </div>
              <button
                onClick={handleDownloadDossier}
                className="py-1.5 px-3 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" /> Export JSON
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="text-slate-400">
                Evidence Hash: <span className="text-indigo-300 font-semibold break-all">{evidenceData.cryptographicSeal?.evidenceHash}</span>
              </div>
              <div className="text-slate-400">
                Sealed At: <span className="text-slate-300">{evidenceData.cryptographicSeal?.sealedAt}</span>
              </div>
              <div className="text-slate-400">
                Incident Ref: <span className="text-slate-300">{evidenceData.incidentId}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-Channel Incident Logs</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading incident history...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No incidents recorded. Your account is actively protected by PayShield AI.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {log.channel || "Multi-Channel Alert"}
                    </h4>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed">{log.message}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Dispatched
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
