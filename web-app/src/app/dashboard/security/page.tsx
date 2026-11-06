"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, Laptop, Trash2, KeyRound, Lock, Check } from "lucide-react";
import { api } from "../../../lib/api-client";

export default function SecurityPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await api.getDevices();
        if (res.devices) setDevices(res.devices);
      } catch (err) {
        console.warn("Device fetch notice:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await api.revokeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(`Error revoking device: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Security & Intent Vault Management</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal cognitive anchors and review authenticated hardware devices.
        </p>
      </div>

      {/* Memory Vault Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Encrypted Intent Memory Vault
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                AES-256 Sealed
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              10 cognitive anchors active in isolated zero-knowledge document store.
            </p>
          </div>
        </div>

        <Link
          href="/intent-form"
          className="py-3 px-6 rounded-full font-bold text-xs bg-black hover:bg-neutral-800 text-white shadow-sm transition flex items-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" /> Reconfigure Secrets
        </Link>
      </div>

      {/* Trusted Devices Section */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900">Active Trusted Devices</h3>
            <p className="text-xs text-slate-500">
              Transactions from recognized hardware bypass the cognitive challenge gate in 50ms.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {devices.map((dev) => {
            const isMobile = dev.osType === "iOS" || dev.osType === "Android";
            const Icon = isMobile ? Smartphone : Laptop;

            return (
              <div key={dev.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {dev.deviceName}
                      {dev.isTrusted && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Trusted
                        </span>
                      )}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      Fingerprint: {dev.deviceFingerprint}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(dev.id)}
                  className="py-2 px-4 rounded-full text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
