"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-2xl italic flex items-center justify-center shadow-glow-sm animate-pulse mb-4">
          P
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#0070ba] animate-ping" />
          Synchronizing Cognitive Shield...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-900 flex flex-col relative overflow-hidden selection:bg-[#0070ba] selection:text-white">
      {/* Subtle Ambient Backing */}
      <div className="absolute inset-0 bg-radial-hero pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-grid-subtle pointer-events-none opacity-40" />

      <Header />
      <div className="flex flex-1 relative z-10 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 transition-all">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}