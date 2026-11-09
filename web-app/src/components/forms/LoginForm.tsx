"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, AlertCircle, RefreshCw, KeyRound, Shield, Fingerprint } from "lucide-react";
import { api } from "../../lib/api-client";
import { useAuth } from "../../hooks/useAuth";
import { verifyBiometricPasskey, getStoredBiometricCredential } from "../../lib/webauthn";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.token && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("payshield_user_frozen", res.user.isFrozen ? "true" : "false");
          if (!res.user.isFrozen) {
            localStorage.removeItem("payshield_frozen_until");
          }
        }
        loginUser(res.token, res.user);
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(res.error || "Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to reach User Service");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setError(null);

    try {
      const stored = getStoredBiometricCredential();
      const verifyRes = await verifyBiometricPasskey();
      if (!verifyRes.success) {
        setError(verifyRes.error || "Biometric passkey authentication was cancelled or failed.");
        setPasskeyLoading(false);
        return;
      }

      const res = await api.passkeyLogin({
        email: email.trim() || undefined,
        credentialId: stored?.id,
      });

      if (res.token && res.user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("payshield_user_frozen", "false");
          localStorage.removeItem("payshield_frozen_until");
        }
        loginUser(res.token, { ...res.user, isFrozen: false });
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(res.error || "No account found matching this passkey. Please sign in with password first.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with passkey.");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200/90 text-xs font-semibold text-red-700 flex items-start gap-2.5 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
          Email Address
        </label>
        <div className="relative group">
          <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@domain.com"
            className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
            Password
          </label>
          <span className="text-[11px] font-bold text-[#0070ba] hover:underline cursor-pointer">
            Forgot password?
          </span>
        </div>
        <div className="relative group">
          <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••••"
            className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full py-3.5 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>Verifying Credentials...</span>
            </>
          ) : (
            <>
              <span>Log In to PayPal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      <div className="relative my-4 pt-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white/95 px-3 text-slate-400 font-black tracking-wider">Or Fast Biometric Access</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={loading || passkeyLoading}
          className="w-full py-3.5 px-4 rounded-full font-bold text-xs bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#0070ba] border border-blue-200/90 shadow-sm transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.99] disabled:opacity-50 group"
        >
          {passkeyLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#0070ba]" />
              <span>Scanning Biometrics on Device...</span>
            </>
          ) : (
            <>
              <Fingerprint className="w-4 h-4 text-[#0070ba] group-hover:scale-110 transition-transform" />
              <span>Sign In with Passkey / Fingerprint</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}