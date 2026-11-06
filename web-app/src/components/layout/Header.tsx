"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Bell, LogOut, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Header() {
  const { user, logoutUser } = useAuth();

  return (
    <header className="h-18 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 sm:px-10 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {/* Official PayPal Monogram */}
          <div className="w-8 h-8 rounded-full bg-[#0070ba] text-white font-black text-lg italic flex items-center justify-center shadow-sm">
            P
          </div>
          <div className="flex items-baseline">
            <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
            <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            <span className="ml-1 text-xs font-black uppercase tracking-wider text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
              Shield AI
            </span>
          </div>
        </Link>

        {/* Top Dropdown Links matching the uploaded image */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
          <Link href="/dashboard" className="flex items-center gap-1 hover:text-[#0070ba] transition">
            Personal <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link href="/dashboard/transactions" className="flex items-center gap-1 hover:text-[#0070ba] transition">
            Business <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <Link href="/intent-form" className="hover:text-[#0070ba] transition flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#0070ba]" /> Memory Vault
          </Link>
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Security badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Cognitive Shield Active
        </div>

        {/* Alerts Bell */}
        <Link
          href="/dashboard/alerts"
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition relative"
          title="Security Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>

        {/* User Profile / Logout */}
        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {user.fullName?.charAt(0)?.toUpperCase() || "P"}
            </div>
            <div className="hidden md:block text-left">
              <span className="block text-xs font-bold text-slate-900">{user.fullName}</span>
              <span className="block text-[11px] text-slate-500 font-medium">{user.email}</span>
            </div>
            <button
              onClick={logoutUser}
              title="Sign Out"
              className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <Link
              href="/login"
              className="py-1.5 px-4 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="py-1.5 px-4 rounded-full text-xs font-bold bg-black text-white hover:bg-neutral-800 transition shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
