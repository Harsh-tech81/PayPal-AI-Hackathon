"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Shield, AlertTriangle, ArrowRight, CheckCircle2, Lock, Sparkles, Cpu, Globe, Zap, Radio, ShieldAlert, Fingerprint } from "lucide-react";
import { api } from "../../../lib/api-client";
import { useVerification } from "../../../hooks/useVerification";
import { ChallengeModal } from "../../../components/verification/ChallengeModal";
import { ResultBanner } from "../../../components/verification/ResultBanner";
import { VideoKycModal } from "../../../components/verification/VideoKycModal";

export default function SendTransactionsPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSimulatingHack, setIsSimulatingHack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState("127.0.0.1");
  const [isAccountFrozen, setIsAccountFrozen] = useState(false);
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);

  useEffect(() => {
    // Check if account is frozen from local storage or profile
    const frozenState = typeof window !== "undefined" ? localStorage.getItem("payshield_user_frozen") === "true" : false;
    setIsAccountFrozen(frozenState);

    // Refresh profile in background to get real-time freeze state
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
    async function detectIp() {
      try {
        const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          if (data?.ip) setClientIp(data.ip);
        }
      } catch {
        // Local network / offline fallback
      }
    }
    detectIp();
  }, []);

  const {
    isOpen,
    challengeData,
    startChallenge,
    closeChallenge,
    submitAnswer,
  } = useVerification();

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // If account is frozen, intercept and prompt for Biometric Passkey / KYC verification
    if (isAccountFrozen) {
      setValidationError("Your account is currently frozen for security. Please complete biometric KYC verification using your hardware passkey first to unfreeze your account and send money.");
      setIsUnfreezeModalOpen(true);
      return;
    }

    if (!recipientEmail || !recipientEmail.trim()) {
      setValidationError("Please enter a valid recipient email or phone number.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Please enter a valid transfer amount greater than 0.");
      return;
    }

    setLoading(true);
    setBannerStatus(null);

    try {
      const now = new Date();
      const currentLocalTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const payload = {
        recipientEmail: recipientEmail.trim(),
        amount: parsedAmount,
        currency: "USD",
        description: description.trim(),
        deviceFingerprint: isSimulatingHack ? "fp_unknown_linux_attacker" : "fp_primary_trusted_device",
        ipAddress: isSimulatingHack ? "185.220.101.5" : clientIp,
        location: isSimulatingHack ? "Overseas Proxy (Frankfurt / Tor Node)" : "Verified Local Client",
        timeOfTransfer: isSimulatingHack ? "03:15:00" : currentLocalTime,
      };

      const res = await api.sendMoney(payload);

      if (res.status === "ACCOUNT_FROZEN" || res.isFrozen) {
        setIsAccountFrozen(true);
        setValidationError(res.error || "Your account is temporarily frozen for security. Please verify your biometrics or KYC using your passkey to unfreeze.");
        setIsUnfreezeModalOpen(true);
        return;
      }

      if (res.status === "VERIFICATION_REQUIRED") {
        // Intercepted by Cognitive Shield! Trigger the non-expiring challenge modal
        startChallenge({
          transactionId: res.transactionId,
          challengeToken: res.challengeToken,
          question: res.question,
          timeoutSeconds: res.timeoutSeconds || 86400,
          countdownExpiresAt: res.countdownExpiresAt,
          riskScore: res.riskScore,
          anomalies: res.anomalies,
          amount: parsedAmount,
          recipientEmail: recipientEmail.trim(),
        });
      } else if (res.status === "AUTO_APPROVED" || res.status === "APPROVED") {
        setBannerStatus({
          status: "AUTO_APPROVED",
          message: res.message || "Payment auto-approved under risk policy in 50ms with zero friction.",
        });
      }
    } catch (err: any) {
      setValidationError(`Error initiating payment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-7 animate-fade-in">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0070ba] text-[10px] font-black uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5 text-sky-500" />
          PayPal Express Checkout Terminal
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
          Send Money Securely
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          Every transfer is scored by PayShield's real-time risk engine and guarded by cognitive episodic challenge verification.
        </p>
      </div>

      {isAccountFrozen && (
        <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-luxury backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 tracking-tight">Account Temporarily Frozen for Security</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Payments are restricted while under protective security freeze. Verify your biometric passkey to restore immediate access.
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

      {bannerStatus && (
        <ResultBanner
          status={bannerStatus.status}
          message={bannerStatus.message}
          onDismiss={() => setBannerStatus(null)}
        />
      )}

      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5 shadow-sm animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* Evaluation Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-full bg-slate-200/70 border border-slate-300/60 shadow-inner backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsSimulatingHack(false)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
              !isSimulatingHack
                ? "bg-white text-emerald-800 shadow-sm scale-[1.01]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Standard (Trusted Bengaluru Node)</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSimulatingHack(true)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
              isSimulatingHack
                ? "bg-rose-50 text-rose-800 border border-rose-200 shadow-sm scale-[1.01]"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Simulate Anomaly (Tor Node Proxy)</span>
          </button>
        </div>
      </div>

      {/* Payment Form Container */}
      <div className="p-7 sm:p-10 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl space-y-6">
        <form onSubmit={handleInitiateTransfer} className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
              Recipient Email or Phone
            </label>
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              placeholder="e.g. merchant@company.com or +1 555 234 5678"
              className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-900 font-medium text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                Transfer Amount (USD)
              </label>
              {/* Quick Select Chips */}
              <div className="flex items-center gap-1.5">
                {[50, 250, 1200].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-[#0070ba] text-slate-600 border border-slate-200 transition"
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-black text-xl">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3.5 bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-950 font-black text-2xl outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
              Transfer Note / Memo (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this payment for? (optional)"
              className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-900 font-medium text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
            />
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
            <button
              type="submit"
              disabled={loading || !recipientEmail.trim() || !amount}
              className="w-full py-4 rounded-full font-bold text-base bg-gradient-to-r from-[#003087] via-[#0070ba] to-[#005ea6] hover:brightness-110 active:scale-[0.99] text-white shadow-glow-sm hover:shadow-glow-md flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none group"
            >
              <span className="font-serif italic font-black text-2xl tracking-tighter">PayPal</span>
              <span className="font-bold text-base tracking-tight">
                Authorize Payment {amount && !isNaN(parseFloat(amount)) ? `($${parseFloat(amount).toFixed(2)})` : ""}
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-[11px] text-slate-500 mt-3.5 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#0070ba]" />
              Guarded by PayShield AI Cognitive Interception Protocol
            </p>
          </div>
        </form>
      </div>

      {/* Flagship Interactive Challenge Modal with 20s Window & Relaxed Mode */}
      <ChallengeModal
        isOpen={isOpen}
        challengeData={challengeData}
        onClose={closeChallenge}
        onSubmit={submitAnswer}
        onSuccess={() => {
          setBannerStatus({
            status: "APPROVED",
            message: "Payment verified successfully by Cognitive Security in < 400ms! Funds moved safely.",
          });
        }}
        onFraudLockdown={(dossier) => {
          closeChallenge();
          const query = new URLSearchParams();
          const lockdownAmt = dossier?.attemptedAmount || (amount ? parseFloat(amount) : 1200);
          query.set("amount", String(lockdownAmt));
          if (dossier?.incidentReference) {
            query.set("ref", dossier.incidentReference);
          }
          if (dossier?.attackerIp) {
            query.set("ip", dossier.attackerIp);
          }
          router.push(`/alerts/lockdown?${query.toString()}`);
        }}
      />

      {/* Biometric KYC / Passkey Recovery Modal */}
      <VideoKycModal
        isOpen={isUnfreezeModalOpen}
        onClose={() => setIsUnfreezeModalOpen(false)}
        onSuccess={() => {
          setIsUnfreezeModalOpen(false);
          setIsAccountFrozen(false);
          setValidationError(null);
          setBannerStatus({
            status: "APPROVED",
            message: "Biometric identity verified via passkey! Account has been successfully unfrozen. You can now send payments.",
          });
        }}
      />
    </div>
  );
}