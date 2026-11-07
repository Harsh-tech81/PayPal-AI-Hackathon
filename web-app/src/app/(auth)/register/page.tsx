"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RegisterForm } from "../../../components/forms/RegisterForm";
import { Lock, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-900 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-radial-hero pointer-events-none" />
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none" />

      {/* Back to Home Link */}
      <Link 
        href="/"
        className="absolute top-8 left-8 hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-x-0.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
      </Link>

      {/* Brand Monogram */}
      <Link href="/" className="flex items-center gap-3 mb-8 group z-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-2xl italic flex items-center justify-center shadow-glow-sm group-hover:scale-105 group-hover:shadow-glow-md transition-all duration-300">
          P
        </div>
        <div className="flex items-baseline">
          <span className="font-black text-3xl text-[#003087] tracking-tight">Pay</span>
          <span className="font-black text-3xl text-[#0070ba] tracking-tight">Pal</span>
          <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[#0070ba] px-2 py-0.5 rounded-full bg-blue-50/90 border border-blue-200/70 shadow-sm">
            Shield AI
          </span>
        </div>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white/95 border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-luxury backdrop-blur-xl z-10 transition-all">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0070ba] text-[10px] font-black uppercase tracking-wider mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba] animate-pulse" />
            Zero-Knowledge Enclave
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Sign up for PayPal</h1>
          <p className="text-xs text-slate-500 mt-1.5">
            Create your account with zero-knowledge cognitive memory protection
          </p>
        </div>

        <RegisterForm onRegisterSuccess={() => router.push("/intent-form")} />

        <div className="text-center mt-7 pt-5 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0070ba] font-bold hover:underline ml-1">
              Log In directly &rarr;
            </Link>
          </p>
        </div>
      </div>

      {/* Security Footer Notice */}
      <div className="mt-8 text-center text-xs text-slate-400 font-medium flex items-center gap-2 z-10">
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>Argon2id Hashing • AES-256-GCM Vault Compatible</span>
      </div>
    </div>
  );
}