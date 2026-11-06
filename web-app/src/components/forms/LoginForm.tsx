"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../lib/api-client";
import { useAuth } from "../../hooks/useAuth";

export function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login({ email: email.trim(), password });
      if (res.token && res.user) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@domain.com"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 transition font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Password
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••••"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 transition font-medium"
          />
        </div>
      </div>

      {/* Centered Pill Button */}
      <div className="pt-2 flex flex-col items-center">
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full py-4 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
            </>
          ) : (
            <>
              Log In to PayPal <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
