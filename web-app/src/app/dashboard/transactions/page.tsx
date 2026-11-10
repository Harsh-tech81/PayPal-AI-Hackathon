"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Shield,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldAlert,
  Fingerprint,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  User,
  Radio,
} from "lucide-react";
import { api } from "../../../lib/api-client";
import { useVerification } from "../../../hooks/useVerification";
import { ChallengeModal } from "../../../components/verification/ChallengeModal";
import { ResultBanner } from "../../../components/verification/ResultBanner";
import { VideoKycModal } from "../../../components/verification/VideoKycModal";

interface SuccessReceiptData {
  transactionId: string;
  amount: number;
  currency: string;
  recipientEmail: string;
  description?: string;
  riskScore?: number;
  confidence?: number;
  verificationType: "AUTO" | "COGNITIVE";
  verificationMethod: string;
  timestamp: string;
}

const DEFAULT_CONTACTS = [
  { name: "Merchant Services", email: "partner-merchant@domain.in", initial: "M", bg: "bg-blue-100 text-[#0070ba]" },
  { name: "Alice Smith", email: "alice@example.com", initial: "A", bg: "bg-purple-100 text-purple-700" },
  { name: "Tech Partner", email: "hardware-vendor@domain.in", initial: "T", bg: "bg-emerald-100 text-emerald-700" },
];

export default function SendTransactionsPage() {
  const router = useRouter();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [bannerStatus, setBannerStatus] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState("127.0.0.1");
  const [isAccountFrozen, setIsAccountFrozen] = useState(false);
  const [isUnfreezeModalOpen, setIsUnfreezeModalOpen] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<SuccessReceiptData | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulateAttack, setSimulateAttack] = useState(false);
  const [recentContacts, setRecentContacts] = useState(DEFAULT_CONTACTS);

  useEffect(() => {
    const frozenState = typeof window !== "undefined" ? localStorage.getItem("payshield_user_frozen") === "true" : false;
    setIsAccountFrozen(frozenState);

    api
      .getProfile()
      .then((res) => {
        if (res?.user?.isFrozen !== undefined) {
          setIsAccountFrozen(Boolean(res.user.isFrozen));
          if (typeof window !== "undefined") {
            localStorage.setItem("payshield_user_frozen", res.user.isFrozen ? "true" : "false");
          }
        }
      })
      .catch(() => {});

    // Dynamically derive recent contacts from live transaction history
    api
      .getTransactionHistory()
      .then((res) => {
        if (res?.transactions && Array.isArray(res.transactions) && res.transactions.length > 0) {
          const seen = new Set<string>();
          const dynamicContacts: any[] = [];
          const colors = [
            "bg-blue-100 text-[#0070ba]",
            "bg-purple-100 text-purple-700",
            "bg-emerald-100 text-emerald-700",
            "bg-amber-100 text-amber-700",
          ];

          for (const tx of res.transactions) {
            const email = tx.recipientEmail?.trim();
            if (email && !seen.has(email.toLowerCase())) {
              seen.add(email.toLowerCase());
              const namePart = email.split("@")[0].replace(/[._-]/g, " ");
              const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
              dynamicContacts.push({
                name: displayName,
                email: email,
                initial: email.charAt(0).toUpperCase(),
                bg: colors[dynamicContacts.length % colors.length],
              });
              if (dynamicContacts.length >= 5) break;
            }
          }

          if (dynamicContacts.length > 0) {
            setRecentContacts(dynamicContacts);
          }
        }
      })
      .catch(() => {});
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
      } catch {}
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

    if (isAccountFrozen) {
      setValidationError("Your account is currently frozen for security. Please verify your passkey to restore access.");
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
    setValidationError(null);

    try {
      const now = new Date();
      const currentLocalTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const payload = {
        recipientEmail: recipientEmail.trim(),
        amount: parsedAmount,
        currency: "USD",
        description: description.trim(),
        deviceFingerprint: simulateAttack ? "fp_foreign_tor_browser" : "fp_primary_trusted_device",
        ipAddress: simulateAttack ? "185.220.101.5" : clientIp,
        location: simulateAttack ? "Frankfurt Tor Node" : "Verified Client",
        timeOfTransfer: currentLocalTime,
      };

      const res = await api.sendMoney(payload);

      if (res?.status === "ACCOUNT_FROZEN" || res?.isFrozen) {
        setIsAccountFrozen(true);
        setValidationError(res.error || "Your account is temporarily frozen for security. Please verify your passkey to unfreeze.");
        setIsUnfreezeModalOpen(true);
        return;
      }

      if (res?.status === "VERIFICATION_REQUIRED") {
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
      } else if (res?.status === "AUTO_APPROVED" || res?.status === "APPROVED") {
        addRecentContact(recipientEmail);
        setSuccessReceipt({
          transactionId: res.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          amount: parsedAmount,
          currency: res.currency || "USD",
          recipientEmail: recipientEmail.trim(),
          description: description.trim(),
          riskScore: res.riskScore || 0.08,
          verificationType: "AUTO",
          verificationMethod: "Instant Verification (< 50ms)",
          timestamp: new Date().toLocaleString(),
        });
        setBannerStatus(null);
        setValidationError(null);
      } else {
        const errorDetail =
          res?.details?.recipientEmail?._errors?.[0] ||
          res?.error ||
          res?.message ||
          "Payment initiation failed. Please check the transfer details and try again.";
        setValidationError(errorDetail);
      }
    } catch (err: any) {
      setValidationError(`Error initiating payment: ${err.message || "Network error. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const addRecentContact = (email: string) => {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim();
    setRecentContacts((prev) => {
      if (prev.some((c) => c.email.toLowerCase() === cleanEmail.toLowerCase())) return prev;
      const namePart = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      return [
        {
          name: displayName,
          email: cleanEmail,
          initial: cleanEmail.charAt(0).toUpperCase(),
          bg: "bg-blue-100 text-[#0070ba]",
        },
        ...prev.slice(0, 4),
      ];
    });
  };

  const handleCopyTxnId = (id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyDemoPreset = (type: "routine" | "attack") => {
    if (type === "routine") {
      setRecipientEmail("partner-merchant@domain.in");
      setAmount("45");
      setDescription("Invoice settlement");
      setSimulateAttack(false);
    } else {
      setRecipientEmail("suspicious-target@foreign-broker.com");
      setAmount("1200");
      setDescription("Urgent wire withdrawal");
      setSimulateAttack(true);
    }
    setValidationError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-7 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
          {successReceipt ? "Payment Confirmation" : "Send Money"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          {successReceipt
            ? "Your funds have moved securely. A receipt has been saved to your account activity."
            : "Send funds quickly and securely to any email address or mobile number."}
        </p>
      </div>

      {isAccountFrozen && !successReceipt && (
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

      {bannerStatus && !successReceipt && (
        <ResultBanner
          status={bannerStatus.status}
          message={bannerStatus.message}
          onDismiss={() => setBannerStatus(null)}
        />
      )}

      {validationError && !successReceipt && (
        <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs font-semibold text-rose-700 flex items-start gap-2.5 shadow-sm animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* VIEW A: Payment Success Confirmation Receipt */}
      {successReceipt ? (
        <div className="p-7 sm:p-10 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl space-y-7 animate-fade-in text-center">
          {/* Check badge */}
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 shadow-glow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              ${Number(successReceipt.amount).toFixed(2)}{" "}
              <span className="text-xl text-slate-400 font-bold">{successReceipt.currency}</span>
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              Sent to <span className="text-slate-900 font-bold">{successReceipt.recipientEmail}</span>
            </p>
          </div>

          {/* Security Guarantee Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#0070ba] text-white shrink-0 shadow-sm mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  PayPal PayShield Guarantee
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {successReceipt.verificationType === "COGNITIVE" ? "VERIFIED" : "APPROVED"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {successReceipt.verificationType === "COGNITIVE"
                  ? "Identity verified via your private security vault. Payment authorized and protected."
                  : "Evaluated by real-time risk intelligence in 32ms. Cleared standard security policy."}
              </p>
            </div>
          </div>

          {/* Transaction Details Grid */}
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-left text-xs bg-slate-50/50 overflow-hidden">
            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Transaction ID</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                <span>{successReceipt.transactionId}</span>
                <button
                  type="button"
                  onClick={() => handleCopyTxnId(successReceipt.transactionId)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Date & Time</span>
              <span className="font-semibold text-slate-900">{successReceipt.timestamp}</span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Payment Method</span>
              <span className="font-semibold text-slate-900">PayPal Verified Balance</span>
            </div>

            {successReceipt.description && (
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Note</span>
                <span className="font-semibold text-slate-900 italic">"{successReceipt.description}"</span>
              </div>
            )}

            <div className="p-3.5 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Settlement Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Settled & Completed
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSuccessReceipt(null);
                setRecipientEmail("");
                setAmount("");
                setDescription("");
                setBannerStatus(null);
                setValidationError(null);
              }}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-full font-bold text-sm bg-gradient-to-r from-[#003087] via-[#0070ba] to-[#005ea6] hover:brightness-110 active:scale-[0.99] text-white shadow-glow-sm transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-sky-300" />
              <span>Send Another Payment</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-full font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition-all flex items-center justify-center gap-2"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: Payment Initiation Form */
        <div className="space-y-4">
          {/* Demo Scenario Quick-Launcher */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">
                Quick Demo Scenarios
              </span>
              <span className="text-[10px] text-slate-400">
                1-click presets for live demonstrations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyDemoPreset("routine")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border ${
                  !simulateAttack && amount === "45"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Routine ($45)</span>
              </button>
              <button
                type="button"
                onClick={() => applyDemoPreset("attack")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border ${
                  simulateAttack
                    ? "bg-rose-50 text-rose-700 border-rose-300 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Simulate Attack ($1,200)</span>
              </button>
            </div>
          </div>

          <div className="p-7 sm:p-10 rounded-3xl bg-white/95 border border-slate-200/90 shadow-luxury backdrop-blur-xl space-y-6">
            <form onSubmit={handleInitiateTransfer} className="space-y-5">
              {/* Recipient Input & Recent Contacts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Recipient Email or Phone
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Recent contacts</span>
                </div>

                {/* Quick Contact Chips */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                  {recentContacts.map((c) => (
                    <button
                      key={c.email}
                      type="button"
                      onClick={() => setRecipientEmail(c.email)}
                      className="px-2.5 py-1 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-xs font-semibold text-slate-700 hover:text-[#0070ba] flex items-center gap-1.5 shrink-0 transition"
                    >
                      <span className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center text-[10px] font-bold`}>
                        {c.initial}
                      </span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  placeholder="e.g. partner-merchant@domain.in or +1 555 234 5678"
                  className="w-full px-4 py-3.5 bg-slate-50/70 border border-slate-200/90 focus:bg-white focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-slate-900 font-medium text-sm outline-none transition-all duration-200 placeholder:text-slate-400"
                />
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                    Amount (USD)
                  </label>
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

              {/* Description */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
                  Note / Memo (Optional)
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
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-white" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-serif italic font-black text-2xl tracking-tighter">PayPal</span>
                      <span className="font-bold text-base tracking-tight">
                        Send Payment {amount && !isNaN(parseFloat(amount)) ? `($${parseFloat(amount).toFixed(2)})` : ""}
                      </span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Protected by PayPal PayShield Security
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flagship Interactive Challenge Modal with Cognitive Verification */}
      <ChallengeModal
        isOpen={isOpen}
        challengeData={challengeData}
        onClose={closeChallenge}
        onSubmit={submitAnswer}
        onSuccess={(verifiedRes) => {
          const sentTo = challengeData?.recipientEmail || recipientEmail.trim();
          addRecentContact(sentTo);
          setSuccessReceipt({
            transactionId: challengeData?.transactionId || verifiedRes?.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            amount: challengeData?.amount || (amount ? parseFloat(amount) : 1200),
            currency: "USD",
            recipientEmail: challengeData?.recipientEmail || recipientEmail.trim() || "partner-merchant@domain.in",
            description: description.trim(),
            riskScore: challengeData?.riskScore || 0.88,
            confidence: verifiedRes?.confidence || 0.98,
            verificationType: "COGNITIVE",
            verificationMethod: "Security Question Verified",
            timestamp: new Date().toLocaleString(),
          });
          setBannerStatus(null);
          setValidationError(null);
        }}
        onFraudLockdown={(dossier) => {
          closeChallenge();
          if (typeof window !== "undefined") {
            const amt = amount ? parseFloat(amount) : 1200;
            router.push(`/alerts/lockdown?amount=${amt}&ref=PS-FR-2026-9812A`);
          }
        }}
      />

      <VideoKycModal
        isOpen={isUnfreezeModalOpen}
        onClose={() => setIsUnfreezeModalOpen(false)}
        onVerified={() => {
          setIsAccountFrozen(false);
          if (typeof window !== "undefined") {
            localStorage.setItem("payshield_user_frozen", "false");
          }
          setIsUnfreezeModalOpen(false);
        }}
      />
    </div>
  );
}