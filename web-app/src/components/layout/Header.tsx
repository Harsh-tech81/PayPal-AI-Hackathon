"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api-client";
import { NAV_ITEMS } from "./Sidebar";

export function Header() {
  const { user, logoutUser } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);

  // Close menu on route change & manage unread alerts state
  useEffect(() => {
    setMobileMenuOpen(false);

    // If currently viewing alerts, mark as read immediately
    if (pathname === "/dashboard/alerts") {
      setHasUnreadAlerts(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("payshield_alerts_read_at", new Date().toISOString());
      }
      return;
    }

    // Check if there are any unread alerts newer than last read timestamp
    const checkUnread = async () => {
      try {
        const res = await api.getAlertHistory();
        if (res?.logs && Array.isArray(res.logs) && res.logs.length > 0) {
          const lastRead = typeof window !== "undefined" ? localStorage.getItem("payshield_alerts_read_at") : null;
          if (!lastRead) {
            setHasUnreadAlerts(true);
          } else {
            const lastReadTime = new Date(lastRead).getTime();
            const hasNew = res.logs.some((log: any) => new Date(log.createdAt).getTime() > lastReadTime);
            setHasUnreadAlerts(hasNew);
          }
        } else {
          setHasUnreadAlerts(false);
        }
      } catch {
        setHasUnreadAlerts(false);
      }
    };

    checkUnread();

    const handleAlertsRead = () => setHasUnreadAlerts(false);
    window.addEventListener("payshield_alerts_read", handleAlertsRead);
    return () => window.removeEventListener("payshield_alerts_read", handleAlertsRead);
  }, [pathname]);

  // Close menu on Escape key press
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="h-20 shrink-0 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-4 sm:px-8 md:px-10 flex items-center justify-between sticky top-0 z-40 transition-all">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {/* Official PayPal Monogram */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white font-black text-xl italic flex items-center justify-center shadow-glow-sm group-hover:scale-105 group-hover:shadow-glow-md transition-all duration-300">
              P
            </div>
            <div className="flex items-baseline">
              <span className="font-black text-2xl text-[#003087] tracking-tight">Pay</span>
              <span className="font-black text-2xl text-[#0070ba] tracking-tight">Pal</span>
            </div>
          </Link>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Alerts Bell */}
          <Link
            href="/dashboard/alerts"
            className="p-2.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border border-slate-200/80 transition-all relative hover:scale-105 active:scale-95 shadow-sm"
            title={hasUnreadAlerts ? "New Security Alerts" : "Security Alerts"}
          >
            <Bell className="w-4 h-4" />
            {hasUnreadAlerts && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </Link>

          {/* User Profile / Logout (Desktop) */}
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
                className="hidden md:flex p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all hover:scale-105 active:scale-95"
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

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 flex items-center justify-center border border-slate-200"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-900" />}
          </button>
        </div>
      </header>

      {/* Mobile Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 top-20 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border-b border-slate-200 shadow-2xl p-5 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            {/* User Info on Mobile */}
            {user && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#003087] to-[#0070ba] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {user.fullName?.charAt(0)?.toUpperCase() || "P"}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900 leading-tight">{user.fullName}</span>
                    <span className="block text-[11px] text-slate-500 font-medium truncate max-w-[180px]">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logoutUser();
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Navigation List */}
            <div className="space-y-1.5 pt-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                      isActive
                        ? "bg-blue-50 text-[#0070ba] border border-blue-200/80 shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#0070ba]" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0070ba]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}