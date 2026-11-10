"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Smartphone, Laptop, Trash2, KeyRound, Lock, Check, Cpu, Sparkles, ShieldAlert, Fingerprint, RefreshCw } from "lucide-react";
import { api } from "../../../lib/api-client";
import { VideoKycModal } from "../../../components/verification/VideoKycModal";
import { registerBiometricPasskey, getStoredBiometricCredential } from "../../../lib/webauthn";
import { getSession } from "../../../lib/auth-session";

export default function SecurityPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAccountFrozen, setIsAccountFrozen] = useState(false);
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [enrollingPasskey, setEnrollingPasskey] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  useEffect(() => {
    const frozenState = typeof window !== "undefined" ? localStorage.getItem("payshield_user_frozen") === "true" : false;
    setIsAccountFrozen(frozenState);

    api.getProfile().then((res) => {
      if (res?.user?.isFrozen !== undefined) {
        setIsAccountFrozen(Boolean(res.user.isFrozen));
        if (typeof window !== "undefined") {
          localStorage.setItem("payshield_user_frozen", res.user.isFrozen ? "true" : "false");
        }
      }
    }).catch(() => {});
  }, []);

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

  const handleEnrollPasskey = async () => {
    setEnrollingPasskey(true);
    setPasskeyNotice(null);
    try {
      const session = getSession();
      const res = await registerBiometricPasskey({
        id: session?.user?.id,
        name: session?.user?.email,
        displayName: session?.user?.fullName,
      });
      if (res.success) {
        setPasskeyNotice("Passkey / Fingerprint successfully enrolled for your account on this device!");
        const devRes = await api.getDevices();
        if (devRes.devices) setDevices(devRes.devices);
      } else {
        setPasskeyNotice(res.error || "Biometric enrollment was cancelled.");
      }
    } catch (err: any) {
      setPasskeyNotice(err.message || "Failed to enroll passkey on this device.");
    } finally {
      setEnrollingPasskey(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
          Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal security questions and review trusted devices.
        </p>
      </div>

      {isAccountFrozen && (
        <div className="p-6 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-luxury backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 tracking-tight">Account Temporarily Frozen for Security</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Payments and transfers are restricted under security freeze. Verify your biometric passkey to restore immediate access.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUnfreezeModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs bg-slate-950 hover:bg-neutral-800 text-white shadow-md transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02] active:scale-95"
          >
            <Fingerprint className="w-4 h-4 text-sky-400" />
            <span>Verify Passkey to Unfreeze</span>
          </button>
        </div>
      )}

      {/* Security Questions Vault Card */}
      <div className="p-7 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-50 to-blue-100 border border-blue-200/80 text-[#0070ba] flex items-center justify-center shrink-0 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-950 flex flex-wrap items-center gap-2">
              <span>Personal Security Questions</span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                Active & Protected
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              10 private security questions configured. Used to authorize sensitive payments and verify your identity.
            </p>
          </div>
        </div>

        <Link
          href="/intent-form"
          className="py-3 px-6 rounded-full font-bold text-xs bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          <span>Update Questions</span>
        </Link>
      </div>

      {/* Trusted Devices Section */}
      <div className="p-7 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-950">Active Trusted Devices &amp; Biometrics</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enrolled passkeys and recognized hardware devices allow secure, instant biometric login.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleEnrollPasskey}
              disabled={enrollingPasskey}
              className="py-2 px-4 rounded-full font-bold text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#0070ba] border border-blue-200 transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
            >
              {enrollingPasskey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0070ba]" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-3.5 h-3.5 text-[#0070ba]" />
                  <span>+ Enroll Device Passkey</span>
                </>
              )}
            </button>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {devices.length} Devices
            </span>
          </div>
        </div>

        {passkeyNotice && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0070ba] flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-[#0070ba] shrink-0" />
            <span>{passkeyNotice}</span>
          </div>
        )}

        {devices.length === 0 && !loading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No external devices authenticated. Current browser session is registered as primary.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {devices.map((dev) => {
              const isMobile = dev.osType === "iOS" || dev.osType === "Android";
              const Icon = isMobile ? Smartphone : Laptop;

              return (
                <div key={dev.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:bg-blue-50 group-hover:text-[#0070ba] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                        <span>{dev.deviceName}</span>
                        {dev.isTrusted && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Trusted
                          </span>
                        )}
                      </h4>
                      <span className="text-xs font-mono text-slate-400 mt-0.5 block truncate max-w-xs sm:max-w-md">
                        Fingerprint: {dev.deviceFingerprint}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(dev.id)}
                    className="py-2 px-4 rounded-full text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all active:scale-95 flex items-center gap-1.5 self-end sm:self-auto shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VideoKycModal
        isOpen={isUnfreezeModalOpen}
        onClose={() => setIsUnfreezeModalOpen(false)}
        onSuccess={() => {
          setIsUnfreezeModalOpen(false);
          setIsAccountFrozen(false);
        }}
      />
    </div>
  );
}