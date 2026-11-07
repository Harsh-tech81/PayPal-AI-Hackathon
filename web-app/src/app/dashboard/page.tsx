"use client";

import React from "react";
import { BalanceCards } from "../../components/dashboard/BalanceCards";
import { TransactionList } from "../../components/dashboard/TransactionList";

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Security & Financial Overview</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your PayPal wallet balance, active devices, and cognitive defense status.
        </p>
      </div>

      <BalanceCards />
      <TransactionList />
    </div>
  );
}
