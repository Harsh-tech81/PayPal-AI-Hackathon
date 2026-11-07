"use client";

import React from "react";
import { BalanceCards } from "../../components/dashboard/BalanceCards";
import { TransactionList } from "../../components/dashboard/TransactionList";
import { ShieldCheck, Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[#0070ba] text-[10px] font-black uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            Live Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
            Security & Financial Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor your PayPal wallet balance, active device sessions, and zero-knowledge cognitive defense status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white/90 border border-slate-200/90 px-3.5 py-2 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All 6 Microservices Operational
          </span>
        </div>
      </div>

      <BalanceCards />
      <TransactionList />
    </div>
  );
}