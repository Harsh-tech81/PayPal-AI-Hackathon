"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Send, Shield, AlertTriangle, Sparkles, Lock, Cpu } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Send Money", href: "/dashboard/transactions", icon: Send },
  { label: "Memory Vault", href: "/intent-form", icon: Sparkles },
  { label: "Security & Devices", href: "/dashboard/security", icon: Shield },
  { label: "Alert History", href: "/dashboard/alerts", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white/60 backdrop-blur-xl p-4 flex flex-col shrink-0 hidden md:flex h-full select-none transition-all">
      <div className="space-y-1.5 overflow-y-auto overflow-x-hidden pr-1 flex-1">
        <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
          Main Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-[#0070ba] shadow-sm border border-blue-200/70 translate-x-1"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 hover:translate-x-0.5"
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform ${isActive ? "text-[#0070ba] scale-110" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0070ba] shadow-glow-sm" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Security Status Box - Permanently pinned at bottom */}
      <div className="shrink-0 pt-4 mt-auto">
        <div className="p-4 rounded-3xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0070ba]" /> Cognitive Shield
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            Real-time dynamic cognitive challenge gate protects all high-risk payments.
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Latency: &lt; 400ms</span>
            <span className="text-[#0070ba]">10/10 Anchors</span>
          </div>
        </div>
      </div>
    </aside>
  );
}