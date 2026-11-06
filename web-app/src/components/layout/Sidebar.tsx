"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Send, Shield, AlertTriangle, Sparkles, Lock } from "lucide-react";

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
    <aside className="w-64 border-r border-slate-200/80 bg-[#fbfcfd] p-4 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4.5rem)]">
      <div className="space-y-1">
        <div className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Account Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full font-bold text-sm transition ${
                isActive
                  ? "bg-blue-50 text-[#0070ba] shadow-sm border border-blue-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Security Status Box */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#0070ba]" /> Cognitive Shield
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Dynamic cognitive challenge gate intercepts high-risk transfers in real-time.
        </p>
      </div>
    </aside>
  );
}
