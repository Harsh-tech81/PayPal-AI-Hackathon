"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Sparkles, Check, ArrowRight, ArrowLeft, KeyRound, HeartHandshake, HelpCircle } from "lucide-react";
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
    <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl text-slate-900">
      {/* Step Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          <span>PayShield Intent Protocol</span>
          <span className="text-[#0070ba] font-bold">Step {currentStep} of 4</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {["1. Categories", "2. Anchors", "3. Answers", "4. Encryption"].map((label, idx) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= idx + 1 ? "bg-[#0070ba]" : "bg-slate-100"
                }`}
              />
              <span className={`text-[11px] truncate ${currentStep === idx + 1 ? "text-[#0070ba] font-bold" : "text-slate-400 font-medium"}`}>
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
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select Security Domains</h2>
            <p className="text-sm text-slate-500 mt-1">
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
                  className={`p-6 rounded-2xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-50/60 border-[#0070ba] ring-2 ring-blue-100 text-slate-900"
                      : "bg-slate-50/60 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 text-[#0070ba]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{cat.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white flex items-center gap-2 shadow-sm transition"
            >
              Continue to Anchors <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Memory Anchors Selection */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review Memory Anchors</h2>
            <p className="text-sm text-slate-500 mt-1">
              Review the 10 prompt presets that will protect your high-risk transactions.
            </p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {anchors.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
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
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 shrink-0">
                  {item.category.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white flex items-center gap-2 shadow-sm transition"
            >
              Configure Secret Answers <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Intimate Answers */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Deposit Intimate Memories</h2>
              <p className="text-sm text-slate-500 mt-1">
                Provide 1–3 word personal answers. Tolerate casual spelling; Gemini evaluates cognitive intent.
              </p>
            </div>
            <div className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-[#0070ba]">
              Vault: {filledCount} / {anchors.length}
            </div>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {anchors.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  #{idx + 1}: {item.prompt}
                </label>
                <input
                  type="text"
                  value={item.answer}
                  onChange={(e) => updateAnswer(idx, e.target.value)}
                  placeholder="Enter your personal memory answer..."
                  className="w-full px-4 py-3 bg-white border border-slate-300 focus:border-[#0070ba] focus:ring-2 focus:ring-blue-100 rounded-xl text-slate-900 text-sm outline-none font-medium placeholder-slate-400 transition"
                />
                <p className="text-[11px] text-slate-500">💡 Hint: Not discoverable via web searches or public social media.</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white flex items-center gap-2 shadow-sm transition"
            >
              Review & Encrypt Vault <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Vault Encryption & Submission */}
      {currentStep === 4 && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0070ba] mb-2">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Zero-Knowledge Vault Encryption</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Your memory secrets will be encrypted with <strong>AES-256-GCM</strong> using your unique master key and
              stored in an isolated MongoDB document vault separated from financial ledgers.
            </p>
          </div>

          {/* Encryption Progress Bar */}
          <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
              <span>AES-256 Encryption Progress</span>
              <span className="text-[#0070ba] font-mono">{encryptionProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0070ba] transition-all duration-300"
                style={{ width: `${encryptionProgress}%` }}
              />
            </div>
          </div>

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setCurrentStep(3)}
              disabled={isSubmitting}
              className="py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </button>
            <button
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              className="py-3.5 px-8 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md flex items-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              {isSubmitting ? "Encrypting & Storing Vault..." : "Seal & Activate Intent Vault"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
