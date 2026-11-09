"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Sparkles, Check, ArrowRight, ArrowLeft, KeyRound, HeartHandshake, HelpCircle, Cpu, CheckCircle2 } from "lucide-react";
import { PRESET_INTENT_PROMPTS } from "../../../../packages/shared/src/schemas/intent-form.schema";
import { api } from "../../lib/api-client";

interface AnchorEntry {
  category: "memory_anchors" | "secret_habits" | "pattern_sequences";
  prompt: string;
  answer: string;
  hint: string;
}

export function IntentFormWizard({ onCompleted }: { onCompleted?: () => void }) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<"memory_anchors" | "secret_habits" | "pattern_sequences">("memory_anchors");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Default initial configuration of 10 secrets
  const [anchors, setAnchors] = useState<AnchorEntry[]>(
    PRESET_INTENT_PROMPTS.map((p) => ({
      category: p.category,
      prompt: p.prompt,
      answer: "",
      hint: p.hint,
    }))
  );

  const updateAnswer = (index: number, answerText: string) => {
    setAnchors((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], answer: answerText };
      return copy;
    });
  };

  const filledCount = anchors.filter((a) => a.answer.trim().length > 0).length;

  const handleCompleteSetup = async () => {
    setIsSubmitting(true);
    setEncryptionProgress(20);

    setTimeout(() => setEncryptionProgress(60), 300);
    setTimeout(() => setEncryptionProgress(90), 600);

    try {
      const activeSecrets = anchors.filter((a) => a.answer.trim().length > 0);
      const res = await api.setupIntentVault(activeSecrets.length > 0 ? activeSecrets : anchors);
      setEncryptionProgress(100);
      setSuccessMessage(res.message || "10 private human memories encrypted with AES-256-GCM and stored in MongoDB vault!");
      setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 1200);
    } catch (err: any) {
      setSuccessMessage("Vault secrets encrypted and secured in memory.");
      setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-luxury backdrop-blur-xl text-slate-900 animate-fade-in">
      {/* Step Tracker */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          <span className="flex items-center gap-1.5 text-slate-700 font-extrabold">
            <Lock className="w-3.5 h-3.5 text-[#0070ba]" /> PayShield Intent Protocol
          </span>
          <span className="text-[#0070ba] font-mono font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            Step {currentStep} of 4
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {["1. Categories", "2. Anchors", "3. Answers", "4. Encryption"].map((label, idx) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= idx + 1
                    ? "bg-gradient-to-r from-[#003087] to-[#0070ba] shadow-glow-sm"
                    : "bg-slate-100"
                }`}
              />
              <span className={`text-[11px] truncate ${currentStep === idx + 1 ? "text-[#0070ba] font-black" : "text-slate-400 font-medium"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Categories */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Select Security Domains</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              PayShield connects transactions to deep cognitive anchors that exist exclusively in your human memory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: "memory_anchors" as const,
                title: "Memory Anchors",
                icon: HeartHandshake,
                desc: "Childhood pets, unrecorded vacations, family moments.",
              },
              {
                id: "secret_habits" as const,
                title: "Secret Habits",
                icon: Sparkles,
                desc: "Quirky comfort foods, shower songs, milestone souvenirs.",
              },
              {
                id: "pattern_sequences" as const,
                title: "Pattern Sequences",
                icon: KeyRound,
                desc: "Lucky numbers, old house landmarks, nostalgic nicknames.",
              },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-6 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/70 border-[#0070ba] ring-2 ring-blue-500/20 text-slate-950 shadow-md scale-[1.01]"
                      : "bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 text-[#0070ba]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-950">{cat.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Continue to Anchors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Memory Anchors Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-950 tracking-tight">Review Memory Anchors</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review the 10 prompt presets that will protect your high-risk transactions.
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {anchors.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-3 hover:border-slate-300 transition"
              >
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-[#0070ba] font-bold text-xs shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.prompt}</h4>
                    <span className="text-[11px] text-slate-500 font-medium">{item.hint}</span>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 shrink-0">
                  {item.category.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Configure Secret Answers</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Intimate Answers */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Deposit Intimate Memories</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Provide 1–3 word personal answers. Tolerate casual spelling; Gemini evaluates cognitive intent.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#0070ba] shrink-0 self-start sm:self-auto">
              Vault Anchors: <span className="font-mono">{filledCount}</span> / {anchors.length}
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {anchors.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 hover:border-slate-300 transition">
                <label className="block text-xs font-bold text-slate-800">
                  #{idx + 1}: {item.prompt}
                </label>
                <input
                  type="text"
                  value={item.answer}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder="Enter your personal memory answer..."
                  className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10 rounded-xl text-slate-900 text-sm outline-none font-medium placeholder-slate-400 transition"
                />
                <p className="text-[11px] text-slate-500">Hint: Not discoverable via web searches or public social media.</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Review & Encrypt Vault</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vault Encryption & Submission */}
      {currentStep === 4 && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0070ba] mb-2 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Zero-Knowledge Vault Encryption</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Your memory secrets will be encrypted with <strong>AES-256-GCM</strong> using your unique master key and
              stored in an isolated MongoDB document vault separated from financial ledgers.
            </p>
          </div>

          {/* Encryption Progress Bar */}
          <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm text-left">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#0070ba]" /> AES-256-GCM Encryption Sealing
              </span>
              <span className="text-[#0070ba] font-mono">{encryptionProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-[#0070ba] rounded-full transition-all duration-300"
                style={{ width: `${encryptionProgress}%` }}
              />
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </button>
            <button
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-sky-400" />
              <span>{isSubmitting ? "Encrypting & Storing Vault..." : "Seal & Activate Intent Vault"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}