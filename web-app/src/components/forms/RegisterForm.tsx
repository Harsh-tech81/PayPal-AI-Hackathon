"use client";

import React, { useState } from "react";
import { Shield, Lock, Mail, Phone, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, KeyRound, RefreshCw } from "lucide-react";
import { api } from "../../lib/api-client";
import { useAuth } from "../../hooks/useAuth";

export function RegisterForm({ onRegisterSuccess }: { onRegisterSuccess?: () => void }) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(true);
  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const { loginUser } = useAuth();

  // Step 1: Submit details and send real OTP via Twilio SMS / Gmail SMTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      setError("Please agree to the Cognitive Security Protocol");
      return;
    }
    if (!email) {
      setError("Please provide a valid email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.sendOtp(email, phone);
      if (res.status === "OTP_SENT") {
        setOtpNotice(res.message || "Security code sent to your email and phone. Please check your SMS inbox and email.");
        setOtpCode("");
        setStep("otp");
      } else {
        setError(res.message || res.error || "Failed to dispatch verification code");
      }
    } catch (err: any) {
      setError(err.message || "Failed to dispatch security code. Please check your network and credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and finalize account registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verifyRes = await api.verifyOtp(email, otpCode.trim());
      if (!verifyRes.verified) {
        setError(verifyRes.error || "Invalid security code. Please check your inbox or SMS.");
        setLoading(false);
        return;
      }

      // Complete registration
      const regRes = await api.register({
        fullName,
        email,
        phone,
        password,
        agreeToSecurityProtocol: true,
      });

      if (regRes.token && regRes.user) {
        loginUser(regRes.token, regRes.user);
        if (onRegisterSuccess) onRegisterSuccess();
      } else {
        setError(regRes.error || "Registration failed after verification.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete account registration");
    } finally {
      setLoading(false);
    }
  };

  // Password Strength
  const passLength = password.length;
  let strengthPercent = 0;
  if (passLength > 0) strengthPercent = Math.min(100, passLength * 10);

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <div>
            <span>{error}</span>
            {error.toLowerCase().includes("already exists") && (
              <a href="/login" className="block text-[#0070ba] font-bold underline mt-1">
                Click here to Log In directly &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      {step === "details" ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Rajesh Kumar"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address (for Verification Code)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number (Twilio SMS Security Alerts)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+91 98765 43210"
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
                placeholder="••••••••••••••••"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-slate-900 text-sm outline-none focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 transition font-medium"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Argon2id Hash Hardness:</span>
              <span className="font-mono font-bold text-[#0070ba]">{strengthPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 ${
                  strengthPercent > 70 ? "bg-emerald-500" : strengthPercent > 40 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="rounded border-slate-300 text-[#0070ba] focus:ring-[#0070ba]"
            />
            <label htmlFor="agree" className="text-xs text-slate-600 select-none font-medium">
              I agree to the Cognitive Security Protocol
            </label>
          </div>

          <div className="pt-2 flex flex-col items-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Security Code...
                </>
              ) : (
                <>
                  Verify Email & Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* STEP 2: OTP Verification */
        <form onSubmit={handleVerifyAndRegister} className="space-y-5 animate-in fade-in duration-200">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Enter Security Code</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              We dispatched a verification code to your phone SMS (<span className="font-bold text-slate-800">{phone}</span>) and email (<span className="font-bold text-slate-800">{email}</span>).
            </p>
          </div>

          {otpNotice && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 text-center">
              {otpNotice}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
              6-Digit Security Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              autoFocus
              className="w-full text-center py-4 text-2xl font-mono font-black tracking-[10px] bg-slate-50 border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-900 outline-none transition"
            />
            <p className="text-[11px] text-slate-500 text-center mt-2 leading-relaxed">
              🔒 Enter <strong>either</strong> the 6-digit code received on your phone SMS <strong>or</strong> your email inbox.<br />
              <span className="text-emerald-700 font-semibold">Both channels are active and accepted instantly.</span>
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="submit"
              disabled={loading || otpCode.length < 4}
              className="w-full py-4 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Confirming Code...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Confirm Code & Create Account
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("details");
                setError(null);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Email or Phone
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
