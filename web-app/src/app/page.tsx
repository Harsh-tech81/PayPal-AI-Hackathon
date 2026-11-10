"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Lock, 
  Sparkles, 
  Zap, 
  Brain, 
  ShieldAlert, 
  Cpu, 
  Eye, 
  Activity,
  Layers,
  Check,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
  const [demoState, setDemoState] = useState<"safe" | "threat">("safe");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logoutUser, loading } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-[#0070ba] selection:text-white relative overflow-hidden">
      {/* Ambient Radial & Grid Background */}
      <div className="absolute inset-0 bg-radial-hero pointer-events-none" />
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none" />

      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-200/80 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 bg-white/80 backdrop-blur-xl z-50 transition-all">
        <div className="flex items-center gap-10">
          {/* PayPal Monogram Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-xl italic flex items-center justify-center shadow-glow-sm group-hover:scale-105 group-hover:shadow-glow-md transition-all duration-300">
              P
            </div>
            <div className="flex items-baseline">
              <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
              <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/dashboard" className="hover:text-[#0070ba] transition py-1">
              Dashboard
            </Link>
            <Link href="/dashboard/transactions" className="hover:text-[#0070ba] transition py-1">
              Send Money
            </Link>
            <Link href="/intent-form" className="hover:text-[#0070ba] transition py-1">
              Security Questions
            </Link>
            <Link href="/dashboard/alerts" className="hover:text-[#0070ba] transition py-1">
              Security Center
            </Link>
          </nav>
        </div>

        {/* Right CTA Links / Auth State */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-28 h-9 bg-slate-200/60 rounded-full animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-bold bg-slate-950 hover:bg-neutral-800 text-white px-4 sm:px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-blue-100">
                  {user.fullName?.charAt(0)?.toUpperCase() || "P"}
                </div>
                <button
                  onClick={logoutUser}
                  title="Sign Out"
                  className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 px-4 sm:px-5 py-2.5 rounded-full hover:bg-slate-100/80 transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-bold bg-slate-950 hover:bg-neutral-800 text-white px-5 sm:px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
              >
                Sign Up <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer on Landing Page */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-20 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-b border-slate-200 shadow-xl p-5 space-y-2"
          >
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-3 rounded-2xl font-bold text-sm text-slate-800 hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/transactions"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-3 rounded-2xl font-bold text-sm text-slate-800 hover:bg-slate-100"
            >
              Send Money
            </Link>
            <Link
              href="/intent-form"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-3 rounded-2xl font-bold text-sm text-slate-800 hover:bg-slate-100"
            >
              Security Questions
            </Link>
            <Link
              href="/dashboard/alerts"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 p-3 rounded-2xl font-bold text-sm text-slate-800 hover:bg-slate-100"
            >
              Security Center
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-20 max-w-6xl mx-auto w-full text-center relative z-10">
        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight max-w-4xl leading-[1.08]">
          Shine all season with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003087] via-[#0070ba] to-sky-500">PayPal</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mt-5 leading-relaxed font-normal">
          Simple, secure ways to pay, send money, and manage your everyday financial transactions with next-generation fraud defense.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/intent-form"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-900 border border-slate-300/80 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0070ba]" />
            Set Up Security Vault
          </Link>
        </div>

        {/* Interactive Threat Simulator Preview Widget */}
        <div className="mt-16 w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-white/90 border border-slate-200 shadow-luxury backdrop-blur-xl text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0070ba] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Real-Time Defense Simulator
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Simulate Payment Security Decisions</h3>
            </div>
            
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDemoState("safe")}
                className={`px-3.5 py-1.5 rounded-full transition ${demoState === "safe" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
              >
                Routine Payment (50ms)
              </button>
              <button
                onClick={() => setDemoState("threat")}
                className={`px-3.5 py-1.5 rounded-full transition ${demoState === "threat" ? "bg-red-50 text-red-700 border border-red-200 shadow-sm" : "text-slate-500"}`}
              >
                Simulated Hijack Attack (Tor Node)
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Device & Location</div>
              <div className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${demoState === "safe" ? "bg-emerald-500" : "bg-red-500"}`} />
                {demoState === "safe" ? "Trusted MacBook Pro • Bengaluru" : "Overseas Tor Node • Frankfurt"}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {demoState === "safe" ? "Known hardware biometric match" : "Severe geo-velocity anomaly detected"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heuristic Risk Score</div>
              <div className="text-sm font-extrabold text-slate-800 mt-1 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-black ${demoState === "safe" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                  {demoState === "safe" ? "0.08 LOW" : "0.94 CRITICAL"}
                </span>
                <span className="text-xs text-slate-400">Score &gt; 0.30 triggers Gate</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {demoState === "safe" ? "Standard transaction parameters" : "Unprecedented transfer velocity & IP"}
              </div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${demoState === "safe" ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" : "bg-red-50/70 border-red-200 text-red-950"}`}>
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">Automated Resolution</div>
              <div className="text-sm font-extrabold mt-1 flex items-center gap-1.5">
                {demoState === "safe" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Auto-Approval (42ms)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Real-Time Security Challenge</span>
                  </>
                )}
              </div>
              <div className="text-xs opacity-80 mt-1">
                {demoState === "safe" ? "Zero customer friction" : "Unauthorized transfer blocked & funds safe"}
              </div>
            </div>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-7 rounded-3xl bg-white/95 border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-glow-sm hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-[#0070ba] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-black text-slate-900">Personal Security Questions</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0070ba] border border-blue-200/60 inline-block mb-3">
              AES-256-GCM Encrypted
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              10 personal security questions encrypted at rest. Unlike static passwords, your personal memory answers cannot be phished or stolen.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/95 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-glow-emerald hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-black text-slate-900">50ms Frictionless Approval</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-block mb-3">
              Adaptive Risk Scoring
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Routine payments from recognized devices pass instantly. Only severe anomalies from unknown proxies or unusual hours trigger the verification gate.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white/95 border border-slate-200 hover:border-rose-300 shadow-sm hover:shadow-glow-rose hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 text-red-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-black text-slate-900">Autonomous 1-Hour Lock</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200/60 inline-block mb-3">
              Multi-Channel Alert Defense
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unauthorized transfers are voided instantly on PayPal, offending IPs are blocked, emergency SMS & email alerts are sent, and Video KYC enables fast biometric unfreezing.
            </p>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 py-7 px-6 sm:px-12 bg-white/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[#0070ba] text-white flex items-center justify-center font-black text-[10px] italic">
            P
          </div>
          <span className="font-semibold text-slate-700">PayPal Security</span>
          <span>• Intelligent Payment Verification & Defense</span>
        </div>
        <div className="flex items-center gap-6 font-semibold text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-600" /> End-to-End Encrypted</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-[#0070ba]" /> Protected by PayPal</span>
        </div>
      </footer>
    </div>
  );
}