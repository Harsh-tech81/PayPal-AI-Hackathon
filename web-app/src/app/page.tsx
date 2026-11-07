"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, ChevronDown, Lock, Sparkles, Zap, Brain, ShieldAlert } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"personal" | "business">("personal");

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Official PayPal Top Navbar */}
      <header className="h-20 border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between max-w-7xl mx-auto w-full sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="flex items-center gap-10">
          {/* PayPal Monogram Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-[#0070ba] text-white font-black text-xl italic flex items-center justify-center shadow-sm">
              P
            </div>
            <div className="flex items-baseline">
              <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
              <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
              <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider text-slate-700 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                Shield AI
              </span>
            </div>
          </Link>

          {/* Nav links from uploaded photo */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <button className="flex items-center gap-1 hover:text-[#0070ba] transition">
              Personal <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button className="flex items-center gap-1 hover:text-[#0070ba] transition">
              Business <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <span className="hover:text-[#0070ba] transition cursor-pointer">Advertiser</span>
            <span className="hover:text-[#0070ba] transition cursor-pointer">Developer</span>
          </nav>
        </div>

        {/* Right CTA links from uploaded photo */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-bold text-slate-800 hover:text-slate-950 px-4 py-2 rounded-full hover:bg-slate-100 transition"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold bg-black hover:bg-neutral-800 text-white px-6 py-2.5 rounded-full shadow-sm transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section matching the uploaded photo */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-20 max-w-5xl mx-auto w-full text-center">
        {/* Personal | Business Pill Selector (Exact match to uploaded image) */}
        <div className="mb-10 inline-flex p-1 rounded-full bg-slate-100 border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${
              activeTab === "personal"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition ${
              activeTab === "business"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Business
          </button>
        </div>

        {/* Hero Headline from image */}
        <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight max-w-3xl leading-[1.1]">
          Shine all season with PayPal
        </h1>

        {/* Subtitle from image */}
        <p className="text-base sm:text-lg text-slate-600 max-w-xl mt-4 leading-relaxed font-normal">
          Fill your payments with flexible and secure ways to shop and pay. Guarded in real time by PayShield AI cognitive defense.
        </p>

        {/* Centered Solid Black Pill Button from image */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition"
          >
            Learn More
          </Link>
          <Link
            href="/intent-form"
            className="px-8 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#0070ba]" />
            Set Up Memory Vault
          </Link>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center mb-4">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Zero-Knowledge Memory Vault</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              10 personal episodic memories encrypted with AES-256-GCM. Never leaves our encrypted vault in plaintext.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">50ms Auto-Approval</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Routine payments pass friction-free. Only severe anomalies from unknown proxies trigger the 20s cognitive verification gate.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#f8fafc] border border-slate-200 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900">Automated 1-Hour Lock</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Unauthorized transfers are voided instantly on PayPal, offending IPs are blocked, and Video KYC enables physical biometric recovery.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Bottom Cookie & Security Notice */}
      <footer className="mt-auto border-t border-slate-100 py-6 px-6 sm:px-12 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>🛡️ PayShield AI • Zero-Knowledge Cognitive Security Architecture for PayPal.</span>
        </div>
        <div className="flex items-center gap-6 font-semibold text-slate-400">
          <span>AES-256-GCM Vault</span>
          <span>Google Gemini 3.5 Verification Enclave</span>
        </div>
      </footer>
    </div>
  );
}
