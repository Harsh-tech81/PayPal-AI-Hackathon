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
  Check
} from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");
  const [demoState, setDemoState] = useState<"safe" | "threat">("safe");

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
              <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#0070ba] px-2 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/70 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba] animate-pulse" />
                Shield AI
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <button className="flex items-center gap-1 hover:text-[#0070ba] transition py-1 group">
              Personal <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0070ba] group-hover:translate-y-0.5 transition" />
            </button>
            <button className="flex items-center gap-1 hover:text-[#0070ba] transition py-1 group">
              Business <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0070ba] group-hover:translate-y-0.5 transition" />
            </button>
            <span className="hover:text-[#0070ba] transition cursor-pointer py-1">Advertiser</span>
            <span className="hover:text-[#0070ba] transition cursor-pointer py-1">Developer</span>
          </nav>
        </div>

        {/* Right CTA Links */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-slate-700 hover:text-slate-950 px-5 py-2.5 rounded-full hover:bg-slate-100/80 transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-slate-950 hover:bg-neutral-800 text-white px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5"
          >
            Sign Up <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-20 max-w-6xl mx-auto w-full text-center relative z-10">
        
        {/* Live Protection Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-[#0070ba] text-xs font-bold mb-8 shadow-sm backdrop-blur-sm animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0070ba]"></span>
          </span>
          <span className="font-extrabold uppercase tracking-wider text-[11px]">Cognitive Defense Network Active</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600 font-semibold text-[11px]">Sub-400ms Verification Window</span>
        </div>

        {/* Tab Pill Selector */}
        <div className="mb-8 inline-flex p-1.5 rounded-full bg-slate-200/70 border border-slate-300/60 shadow-inner backdrop-blur-md">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-7 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
              activeTab === "personal"
                ? "bg-white text-slate-950 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`px-7 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
              activeTab === "business"
                ? "bg-white text-slate-950 shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-950"
            }`}
          >
            Business
          </button>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-950 tracking-tight max-w-4xl leading-[1.08]">
          Shine all season with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003087] via-[#0070ba] to-sky-500">PayPal</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mt-5 leading-relaxed font-normal">
          Fill your payments with flexible and secure ways to shop and pay. Guarded in real time by PayShield AI zero-knowledge cognitive memory defense.
        </p>

        {/* CTA Buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            Launch Command Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/intent-form"
            className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-900 border border-slate-300/80 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0070ba]" />
            Set Up Memory Vault
          </Link>
        </div>

        {/* Interactive Threat Simulator Preview Widget */}
        <div className="mt-16 w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-white/90 border border-slate-200 shadow-luxury backdrop-blur-xl text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-[#0070ba] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Live Heuristic Defense Interceptor
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Autonomous Cognitive Protection Engine</h3>
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
                    <span>10s Cognitive Intercept + 1hr Lock</span>
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
              <h3 className="text-base font-black text-slate-900">Zero-Knowledge Memory Vault</h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0070ba] border border-blue-200/60 inline-block mb-3">
              AES-256-GCM Hardware Sealed
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              10 personal episodic memory anchors encrypted at rest. Unlike passwords or device cookies, human cognitive memory cannot be phished or cloned.
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
          <span className="font-semibold text-slate-700">PayShield AI</span>
          <span>• Zero-Knowledge Cognitive Security Architecture for PayPal</span>
        </div>
        <div className="flex items-center gap-6 font-semibold text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-600" /> AES-256-GCM Vault</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-[#0070ba]" /> Google Gemini 1.5 Flash</span>
        </div>
      </footer>
    </div>
  );
}