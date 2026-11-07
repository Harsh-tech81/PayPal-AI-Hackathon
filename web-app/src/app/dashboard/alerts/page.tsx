"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "../../../lib/api-client";

export default function AlertsHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-Channel Incident Logs</h3>

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
      </div>
    </div>
  );
}
