"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, ShieldAlert, Check, Clock, RefreshCw, Send } from "lucide-react";
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
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity & Ledger</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live audit trail with real-time heuristic risk scores</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchTransactions();
          }}
          className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {transactions.length === 0 && !loading ? (
        <div className="py-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No transactions recorded yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Initiate a payment using the Send Money form to see PayShield's cognitive verification in action.
          </p>
          <Link
            href="/dashboard/transactions"
            className="mt-4 px-6 py-2.5 rounded-full font-bold text-xs bg-black text-white hover:bg-neutral-800 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send Your First Transfer
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Risk Evaluation</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {transactions.map((tx) => {
                const isHighRisk = (tx.riskScore || 0) >= 0.65;
                const isMedRisk = (tx.riskScore || 0) >= 0.3 && (tx.riskScore || 0) < 0.65;
                const isFrozen = tx.status === "FROZEN" || tx.status === "REJECTED_FRAUD";

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0070ba]" />
                      {tx.recipientEmail || "Unknown Recipient"}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ${Number(tx.amount).toFixed(2)}{" "}
                      <span className="text-xs font-semibold text-slate-400">{tx.currency || "USD"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isHighRisk
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : isMedRisk
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isHighRisk ? "High Risk" : isMedRisk ? "Moderate" : "Low Risk"} (
                        {Number(tx.riskScore || 0.05).toFixed(2)})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isFrozen ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          ❄️ FROZEN
                        </span>
                      ) : tx.status === "APPROVED" || tx.status === "AUTO_APPROVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          <Clock className="w-3.5 h-3.5" /> Verifying
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
