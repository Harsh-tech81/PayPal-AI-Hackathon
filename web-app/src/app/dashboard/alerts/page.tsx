"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, CheckCircle2, ArrowRight, Bell, MessageSquare, Mail, Smartphone, Radio } from "lucide-react";
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
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-black uppercase tracking-wider mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            Live Multi-Channel Dispatch Center
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
            Security Incident & Alert Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time audit log of blocked fraud attempts, multi-channel alert dispatches, and automated account freeze events.
          </p>
        </div>
        <Link
          href="/alerts/lockdown"
          className="py-3 px-5 rounded-full font-bold text-xs bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm self-start sm:self-auto"
        >
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>View Lockdown Screen</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-7 sm:p-9 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0070ba]" /> Multi-Channel Incident Stream
          </h3>
          <span className="text-xs font-mono font-bold text-slate-400">
            {logs.length} Total Events
          </span>
        </div>

        {logs.length === 0 && !loading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No incident alerts dispatched yet. Your account is operating normally under low risk scores.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isSMS = log.channel?.toLowerCase().includes("sms");
              const isEmail = log.channel?.toLowerCase().includes("email");
              const ChannelIcon = isSMS ? MessageSquare : isEmail ? Mail : Smartphone;

              return (
                <div key={log.id} className="py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group hover:bg-slate-50/50 p-2 rounded-2xl transition">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-100 shadow-sm">
                      <ChannelIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider">
                          {log.channel || "Multi-Channel Security Alert"}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                          HIGH-SEVERITY
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed">{log.message}</p>
                      <span className="text-[11px] text-slate-400 mt-1.5 block font-medium">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto flex items-center gap-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Dispatched
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}