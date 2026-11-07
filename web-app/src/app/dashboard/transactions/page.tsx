"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Shield, AlertTriangle, ArrowRight, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { api } from "../../../lib/api-client";
import { useVerification } from "../../../hooks/useVerification";
import { ChallengeModal } from "../../../components/verification/ChallengeModal";
import { ResultBanner } from "../../../components/verification/ResultBanner";

export default function SendTransactionsPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSimulatingHack, setIsSimulatingHack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
      const payload = {
        recipientEmail: recipientEmail.trim(),
        amount: parsedAmount,
        currency: "USD",
        description: description.trim(),
        deviceFingerprint: isSimulatingHack ? "fp_unknown_linux_attacker" : "fp_primary_trusted_device",
        ipAddress: isSimulatingHack ? "185.220.101.5" : "103.212.144.10",
        location: isSimulatingHack ? "Overseas Proxy (Frankfurt / Tor Node)" : "Bengaluru, India",
        timeOfTransfer: isSimulatingHack ? "03:15:00 IST" : "14:30:00 IST",
      };

      const res = await api.sendMoney(payload);

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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Send Money Securely via PayPal
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Every transaction is analyzed by PayShield's real-time risk engine and guarded by cognitive challenge verification.
        </p>
      </div>

      {bannerStatus && (
        <ResultBanner
          status={bannerStatus.status}
          message={bannerStatus.message}
          onDismiss={() => setBannerStatus(null)}
        />
      )}

      {validationError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Pill Mode Switcher (User toggles evaluation mode without overwriting typed inputs) */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setIsSimulatingHack(false)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition ${
              !isSimulatingHack
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🛡️ Standard Transfer (Domestic Bengaluru Node)
          </button>
          <button
            type="button"
            onClick={() => setIsSimulatingHack(true)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition ${
              isSimulatingHack
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🚨 Anomaly Simulation (Overseas Proxy / Tor Exit)
          </button>
        </div>
      </div>

      {/* Payment Form Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
        <form onSubmit={handleInitiateTransfer} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recipient Email or Phone
            </label>
            <input
              type="text"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              placeholder="e.g. merchant@company.com or +91 98765 43210"
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-900 font-medium text-sm outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Transfer Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-900 font-black text-xl outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Transfer Note (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this payment for? (optional)"
              className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-2xl text-slate-900 font-medium text-sm outline-none transition"
            />
          </div>

          {/* Centered Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center">
            <button
              type="submit"
              disabled={loading || !recipientEmail.trim() || !amount}
              className="w-full py-4 rounded-full font-bold text-base bg-[#0070ba] hover:bg-[#005ea6] active:scale-[0.99] text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span className="font-serif italic font-black text-xl">PayPal</span>
              <span>Checkout {amount && !isNaN(parseFloat(amount)) ? `($${parseFloat(amount).toFixed(2)})` : ""}</span>
            </button>

            <p className="text-center text-[11px] text-slate-500 mt-3 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#0070ba]" />
              Protected by PayShield AI Cognitive Interception Protocol
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
            message: "Payment verified successfully by Google Gemini in < 400ms! Funds moved safely.",
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
          router.push(`/alerts/lockdown?${query.toString()}`);
        }}
      />
    </div>
  );
}
