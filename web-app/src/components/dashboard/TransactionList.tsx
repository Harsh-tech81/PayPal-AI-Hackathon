"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, ShieldAlert, Check, Clock, RefreshCw, Send, Activity, User } from "lucide-react";
import { api } from "../../lib/api-client";

interface TxnItem {
  id: string;
  recipientEmail: string;
  amount: number;
  currency: string;
  status: string;
  riskScore: number;
  verificationMethod?: string;
  createdAt: string;
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<TxnItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const res = await api.getTransactionHistory();
      if (res && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.warn("Unable to fetch live transaction history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury p-6 sm:p-8 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-950 tracking-tight">Recent Activity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Your latest sent and received transactions with real-time verification status.</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchTransactions();
          }}
          className="p-2.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 shadow-sm"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#0070ba]" : ""}`} />
        </button>
      </div>

      {transactions.length === 0 && !loading ? (
        <div className="py-14 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 text-[#0070ba] flex items-center justify-center mb-4 shadow-sm">
            <Clock className="w-8 h-8" />
          </div>
          <h4 className="text-base font-black text-slate-900">No transactions recorded yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
            Send money to family, friends, or trusted merchants to see activity here.
          </p>
          <Link
            href="/dashboard/transactions"
            className="mt-5 px-7 py-3 rounded-full font-bold text-xs bg-slate-950 text-white hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            Send Your First Transfer
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Recipient</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Heuristic Score</th>
                <th className="py-3.5 px-4 text-right">Defense Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {transactions.map((tx) => {
                const isHighRisk = (tx.riskScore || 0) >= 0.65;
                const isMedRisk = (tx.riskScore || 0) >= 0.3 && (tx.riskScore || 0) < 0.65;
                const isFrozen = tx.status === "FROZEN" || tx.status === "REJECTED_FRAUD";

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center font-bold text-xs border border-blue-100">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate max-w-[180px] sm:max-w-xs">{tx.recipientEmail || "Unknown Recipient"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-950">
                      ${Number(tx.amount).toFixed(2)}{" "}
                      <span className="text-[11px] font-semibold text-slate-400">{tx.currency || "USD"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isHighRisk
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : isMedRisk
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isHighRisk ? "bg-rose-500" : isMedRisk ? "bg-amber-500" : "bg-emerald-500"}`} />
                        {isHighRisk ? "High Risk" : isMedRisk ? "Moderate" : "Low Risk"} (
                        {Number(tx.riskScore || 0.05).toFixed(2)})
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {isFrozen ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 shadow-sm animate-pulse">
                          FROZEN
                        </span>
                      ) : tx.status === "APPROVED" || tx.status === "AUTO_APPROVED" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Approved
                        </span>
                      ) : tx.status === "UNVERIFIED" || tx.status === "CANCELLED" || tx.status === "EXPIRED" || (tx.status === "verifying" && Date.now() - new Date(tx.createdAt).getTime() > 60000) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Unverified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0070ba] border border-blue-200">
                          <Clock className="w-3.5 h-3.5 animate-spin text-[#0070ba]" /> Verifying
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}