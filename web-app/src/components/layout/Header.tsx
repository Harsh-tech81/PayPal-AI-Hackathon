"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Bell, LogOut, ChevronDown, Sparkles, Activity } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { user, logoutUser } = useAuth();

  return (
    <header className="h-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {/* Official PayPal Monogram */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-xl italic flex items-center justify-center shadow-glow-sm group-hover:scale-105 group-hover:shadow-glow-md transition-all duration-300">
            P
          </div>
          <div className="flex items-baseline">
            <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
            <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#0070ba] px-2 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/70 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba] animate-pulse" />
              Shield AI
            </span>
          </div>
        </Link>

        {/* Top Dropdown Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-[#0070ba] transition py-1 group">
            Personal <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0070ba] transition" />
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-1 hover:text-[#0070ba] transition py-1 group">
            Business <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0070ba] transition" />
          </Link>
          <Link 
            href="/intent-form" 
            className="hover:text-[#0070ba] transition flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/60 border border-blue-200/40 text-[#0070ba] text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0070ba]" /> Memory Vault
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Security telemetry badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold uppercase text-[10px] tracking-wider">Cognitive Shield Active</span>
        </div>

        {/* Alerts Bell */}
        <Link
          href="/dashboard/alerts"
          className="p-2.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80 transition-all relative hover:scale-105 active:scale-95 shadow-sm"
          title="Security Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </Link>

        {/* User Profile / Logout */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
              {user.fullName?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <div className="hidden md:block text-left">
              <span className="block text-xs font-bold text-slate-900 leading-tight">{user.fullName}</span>
              <span className="block text-[11px] text-slate-500 font-medium truncate max-w-[140px]">{user.email}</span>
            </div>
            <button
              onClick={logoutUser}
              title="Sign Out"
              className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all hover:scale-105 active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <Link
              href="/login"
              className="py-2 px-4 rounded-full text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="py-2 px-5 rounded-full text-xs font-bold bg-slate-950 text-white hover:bg-neutral-800 transition shadow-sm hover:scale-[1.02]"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}