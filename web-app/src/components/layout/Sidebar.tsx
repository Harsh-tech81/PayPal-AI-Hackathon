"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Send, Shield, AlertTriangle, Sparkles } from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Send Money", href: "/dashboard/transactions", icon: Send },
  { label: "Security Questions", href: "/intent-form", icon: Sparkles },
  { label: "Security & Devices", href: "/dashboard/security", icon: Shield },
  { label: "Alert History", href: "/dashboard/alerts", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white/60 backdrop-blur-xl p-4 flex flex-col shrink-0 hidden md:flex h-full select-none transition-all">
      <div className="space-y-1.5 overflow-y-auto overflow-x-hidden pr-1 flex-1 py-2">
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
    </aside>
  );
}