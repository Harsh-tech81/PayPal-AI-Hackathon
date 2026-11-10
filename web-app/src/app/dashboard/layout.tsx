"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Header } from "../../components/layout/Header";
import { Sidebar, NAV_ITEMS } from "../../components/layout/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { ShieldCheck } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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
          Loading account...
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 pb-24 md:pb-10 transition-all">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phone Screens) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-slate-200/90 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? "text-[#0070ba]"
                  : "text-slate-400 hover:text-slate-800"
              }`}
            >
              <div className={`p-1 rounded-xl transition ${isActive ? "bg-blue-50" : ""}`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-[#0070ba]" : "text-slate-400"}`} />
              </div>
              <span className="truncate max-w-[60px] leading-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}