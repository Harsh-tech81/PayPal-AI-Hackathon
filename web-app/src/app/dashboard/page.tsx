"use client";

import React from "react";
import { BalanceCards } from "../../components/dashboard/BalanceCards";
import { TransactionList } from "../../components/dashboard/TransactionList";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
            Account Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your wallet balance, recent payments, and account security.
          </p>
        </div>
      </div>

      <BalanceCards />
      <TransactionList />
    </div>
  );
}