"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "../../../components/forms/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex flex-col items-center justify-center p-6 text-slate-900">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-full bg-[#0070ba] text-white font-black text-xl italic flex items-center justify-center shadow-sm">
          P
        </div>
        <div className="flex items-baseline">
          <span className="font-black text-3xl text-[#003087] tracking-tight">Pay</span>
          <span className="font-black text-3xl text-[#0070ba] tracking-tight">Pal</span>
        </div>
      </Link>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Log in to your account</h1>
          <p className="text-xs text-slate-500 mt-1">Guarded by PayShield AI cognitive defense protocol</p>
        </div>

        <LoginForm onLoginSuccess={() => router.push("/dashboard")} />

        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#0070ba] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
