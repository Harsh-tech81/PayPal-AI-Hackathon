"use client";

import React, { useState } from "react";
import { Shield, Lock, Mail, Phone, User, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, KeyRound, RefreshCw, Check } from "lucide-react";
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
      setError("Please agree to the User Agreement & Terms");
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
        <div className="p-4 rounded-2xl bg-red-50/90 border border-red-200/90 text-xs font-semibold text-red-700 flex items-start gap-2.5 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="leading-relaxed">
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
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <div className="relative group">
              <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Alex Morgan"
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address (for Verification Code)
            </label>
            <div className="relative group">
              <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number (Twilio SMS Security Alerts)
            </label>
            <div className="relative group">
              <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="+1 555 123 4567"
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#0070ba] absolute left-4 top-3.5 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200/90 rounded-2xl text-slate-900 text-sm outline-none focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 font-medium placeholder:text-slate-400"
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#0070ba]" /> Argon2id Hardness Score:
              </span>
              <span className={`font-mono font-bold ${strengthPercent > 70 ? "text-emerald-600" : strengthPercent > 40 ? "text-amber-600" : "text-slate-500"}`}>
                {strengthPercent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  strengthPercent > 70 ? "bg-emerald-500 shadow-glow-emerald" : strengthPercent > 40 ? "bg-amber-500" : "bg-red-400"
                }`}
                style={{ width: `${strengthPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1.5">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="w-4 h-4 rounded-md border-slate-300 text-[#0070ba] focus:ring-[#0070ba] cursor-pointer"
            />
            <label htmlFor="agree" className="text-xs text-slate-600 select-none font-medium cursor-pointer">
              I agree to the <span className="font-bold text-slate-900">User Agreement</span> & <span className="font-bold text-slate-900">Privacy Statement</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Dispatching Security Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* STEP 2: OTP Verification */
        <form onSubmit={handleVerifyAndRegister} className="space-y-5 animate-fade-in">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0070ba] flex items-center justify-center mx-auto mb-3 shadow-sm border border-blue-100">
              <KeyRound className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-950 tracking-tight">Enter Security Code</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              We dispatched a verification code to SMS (<span className="font-bold text-slate-800">{phone}</span>) and email (<span className="font-bold text-slate-800">{email}</span>).
            </p>
          </div>

          {otpNotice && (
            <div className="p-3.5 rounded-2xl bg-blue-50/90 border border-blue-200/80 text-xs font-semibold text-blue-950 text-center shadow-sm">
              {otpNotice}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2 text-center">
              6-Digit Security Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="------"
              autoFocus
              className="w-full text-center py-4 text-3xl font-mono font-black tracking-[12px] bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-950 outline-none transition-all shadow-inner"
            />
            <p className="text-[11px] text-slate-500 text-center mt-2.5 leading-relaxed">
              Enter <strong>either</strong> the code received on phone SMS <strong>or</strong> your email inbox.<br />
              <span className="text-emerald-700 font-semibold">Both channels are active and accepted instantly.</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || otpCode.length < 4}
              className="w-full py-3.5 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                  <span>Confirming Code...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm Code & Create Account</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("details");
                setError(null);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 py-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Email or Phone
            </button>
          </div>
        </form>
      )}
    </div>
  );
}