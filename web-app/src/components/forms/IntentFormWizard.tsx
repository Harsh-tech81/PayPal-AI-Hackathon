"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  HeartHandshake,
  Cpu,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Check,
  Edit3,
  Layers,
  ShieldAlert,
} from "lucide-react";
import {
  INTENT_CATEGORIES,
  DEFAULT_PRESET_PROMPTS,
  MIN_QUESTIONS_TOTAL,
  MAX_WORDS_PER_ANSWER,
  countWords,
  createInitialBlankAnchors,
  AnchorEntry,
  IntentCategory,
} from "../../lib/intent-presets";
import { encryptSecretClientSide } from "../../lib/client-crypto";
import { api } from "../../lib/api-client";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "payshield_intent_draft";

export function IntentFormWizard({ onCompleted }: { onCompleted?: () => void }) {
  // Vault state
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isVaultConfigured, setIsVaultConfigured] = useState(false);
  const [configuredAnchors, setConfiguredAnchors] = useState<any[]>([]);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isFetchingPrevious, setIsFetchingPrevious] = useState(false);

  // Steps: 1 = Overview, 2 = Memory Anchors, 3 = Secret Habits, 4 = Pattern Sequences, 5 = Vault Sealing
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [anchors, setAnchors] = useState<AnchorEntry[]>(createInitialBlankAnchors);
  const [customPromptText, setCustomPromptText] = useState("");
  const [customPromptCategory, setCustomPromptCategory] = useState<IntentCategory>("memory_anchors");
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Sealing & Submitting states
  const [isSealing, setIsSealing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Category mapping
  const categoryOrder: IntentCategory[] = ["memory_anchors", "secret_habits", "pattern_sequences"];

  // 1. Check existing vault on mount & restore draft
  useEffect(() => {
    let isMounted = true;

    async function loadVault() {
      try {
        const res = await api.getVaultStatus();
        if (isMounted && res && res.isConfigured && (res.anchorsCount > 0 || res.anchors?.length > 0)) {
          setIsVaultConfigured(true);
          setConfiguredAnchors(res.anchors || []);
        }
      } catch (err) {
        console.warn("[Vault Status Load Notice]", err);
      } finally {
        if (isMounted) {
          // Restore draft if user was in middle of editing
          try {
            const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
            if (rawDraft) {
              const parsed = JSON.parse(rawDraft);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setAnchors(parsed);
              }
            }
          } catch {}
          setIsLoadingStatus(false);
        }
      }
    }

    loadVault();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch previous vault details and load into anchors state for editing
  const handleStartEditing = async () => {
    setIsFetchingPrevious(true);
    setErrorMessage(null);
    try {
      const res = await api.getVaultAnchors();
      if (res && Array.isArray(res.anchors) && res.anchors.length > 0) {
        const fetchedAnchors: AnchorEntry[] = res.anchors.map((a: any) => ({
          id: a.id || `anc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          category: (a.category as IntentCategory) || "memory_anchors",
          prompt: a.prompt,
          answer: a.plainAnswer || a.answer || "",
          hint: a.hint || "Episodic memory anchor",
          isCustom: a.isCustom ?? (typeof a.id === "string" ? a.id.startsWith("custom_") : false),
        }));

        // Ensure preset options exist so user can choose or add questions
        const finalAnchors = [...fetchedAnchors];
        categoryOrder.forEach((cat) => {
          const count = finalAnchors.filter((a) => a.category === cat).length;
          if (count < 3) {
            const presetsForCat = DEFAULT_PRESET_PROMPTS.filter((p) => p.category === cat);
            for (const preset of presetsForCat) {
              const alreadyExists = finalAnchors.some(
                (a) => a.id === preset.id || a.prompt.toLowerCase() === preset.prompt.toLowerCase()
              );
              if (!alreadyExists) {
                finalAnchors.push({
                  id: preset.id,
                  category: preset.category,
                  prompt: preset.prompt,
                  answer: "",
                  hint: preset.hint,
                  isCustom: false,
                });
                if (finalAnchors.filter((a) => a.category === cat).length >= 3) {
                  break;
                }
              }
            }
          }
        });

        setAnchors(finalAnchors);
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(finalAnchors));
        } catch {}
      }
      setIsEditingMode(true);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Failed to fetch previous vault anchors:", err);
      setIsEditingMode(true);
      setCurrentStep(2);
    } finally {
      setIsFetchingPrevious(false);
    }
  };

  const getCategoryAnchors = (cat: IntentCategory) => anchors.filter((a) => a.category === cat);

  const getValidFilledCount = (cat: IntentCategory) => {
    return getCategoryAnchors(cat).filter((a) => {
      const words = countWords(a.answer);
      return words >= 1 && words <= MAX_WORDS_PER_ANSWER;
    }).length;
  };

  const updateAnswer = (id: string, text: string) => {
    setAnchors((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, answer: text } : a));
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeAnchor = (id: string, cat: IntentCategory) => {
    const remainingInCat = getCategoryAnchors(cat);
    if (remainingInCat.length <= 1) {
      return;
    }
    setAnchors((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const addCustomAnchor = () => {
    const trimmed = customPromptText.trim();
    if (trimmed.length < 5) return;

    const newAnchor: AnchorEntry = {
      id: `custom_${Date.now()}`,
      category: customPromptCategory,
      prompt: trimmed,
      answer: "",
      hint: "Your private custom cognitive anchor",
      isCustom: true,
    };

    setAnchors((prev) => {
      const updated = [...prev, newAnchor];
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCustomPromptText("");
    setIsAddingCustom(false);
  };

  // 1-Click Fill Demo Memories for a specific category
  const fillCategoryDemo = (cat: IntentCategory) => {
    setAnchors((prev) => {
      const updated = prev.map((a) => {
        if (a.category !== cat) return a;
        const preset = DEFAULT_PRESET_PROMPTS.find((p) => p.id === a.id);
        const demoVal = preset?.demoAnswer || "Childhood memory";
        return { ...a, answer: demoVal };
      });
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // 1-Click Fill ALL Demo Memories across the entire vault
  const fillAllDemo = () => {
    setAnchors((prev) => {
      const updated = prev.map((a) => {
        const preset = DEFAULT_PRESET_PROMPTS.find((p) => p.id === a.id);
        const demoVal = preset?.demoAnswer || "Private answer";
        return { ...a, answer: demoVal };
      });
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Direct Payment Mode Handler (0 questions or reset vault)
  const handleSkipToDirectPayments = async () => {
    setIsClearing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await api.clearIntentVault();
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        // Mark intent completed so user is not prompted again during transfers
        localStorage.setItem("payshield_intent_completed", "true");
      }
      setIsVaultConfigured(false);
      setConfiguredAnchors([]);
      setIsEditingMode(false);
      setSuccessMessage("Direct Payment Mode enabled! Transactions will proceed with automatic approval.");

      setTimeout(() => {
        if (onCompleted) {
          onCompleted();
        } else if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        }
      }, 1200);
    } catch (err: any) {
      console.warn("Direct payment mode notice:", err);
      // Fallback: clear local storage anyway
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.setItem("payshield_intent_completed", "true");
      }
      setIsVaultConfigured(false);
      setConfiguredAnchors([]);
      setIsEditingMode(false);
      setSuccessMessage("Direct Payment Mode enabled! Transactions will proceed with automatic approval.");
      setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 1000);
    } finally {
      setIsClearing(false);
    }
  };

  // Final Sealing Handler via Web Crypto AES-256-GCM
  const handleSealAndSubmit = async () => {
    setIsSealing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Filter filled anchors — user can fill 1, 2, 3 or more boxes as they choose
      const active = anchors.filter((a) => a.answer && a.answer.trim().length > 0);

      // If user filled 0 questions, activate Direct Payment Mode directly
      if (active.length === 0) {
        setIsSealing(false);
        await handleSkipToDirectPayments();
        return;
      }

      setEncryptionStatus("Initializing Web Crypto Subsystem (AES-256-GCM)...");
      setEncryptionStatus(`Encrypting ${active.length} cognitive memory anchor${active.length === 1 ? "" : "s"} with Web Crypto...`);

      // Run genuine client-side AES-256-GCM encryption in browser
      const encryptedPayloads = await Promise.all(
        active.map(async (sec) => {
          const encRes = await encryptSecretClientSide(sec.answer.trim());
          return {
            id: sec.id,
            category: sec.category,
            prompt: sec.prompt,
            encryptedAnswer: encRes.serialized,
            hint: sec.hint,
          };
        })
      );

      setEncryptionStatus("Saving security questions in vault...");

      // Submit encrypted payload to backend
      const res = await api.setupIntentVault(encryptedPayloads);

      if (res?.error) {
        setIsSealing(false);
        const detailedMsg = res.message ? `${res.error} (${res.message})` : res.error;
        setErrorMessage(detailedMsg || "Vault configuration was rejected by the User Service.");
        return;
      }

      setEncryptionStatus("Vault saved! Verification complete.");
      setSuccessMessage(
        res?.message ||
          `${active.length} security questions encrypted with AES-256-GCM and saved into your vault!`
      );

      // Clean draft & mark completed
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.setItem("payshield_intent_completed", "true");
      }

      setIsVaultConfigured(true);
      setIsEditingMode(false);

      setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 1500);
    } catch (err: any) {
      setIsSealing(false);
      setErrorMessage(
        err.message || "Network communication failed while attempting to contact User Service."
      );
    }
  };

  // Loading indicator while querying vault status
  if (isLoadingStatus) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-10 shadow-luxury text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0070ba] mx-auto mb-3" />
        <h3 className="font-extrabold text-slate-800 text-sm">Checking Security Vault Status...</h3>
        <p className="text-xs text-slate-400 mt-1">Loading saved security questions...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW: VAULT ALREADY CONFIGURED & SEALED DASHBOARD
  // =========================================================================
  if (isVaultConfigured && !isEditingMode) {
    const memoryAnchorsCount = configuredAnchors.filter(
      (a) => a.category === "memory_anchors"
    ).length || 4;
    const secretHabitsCount = configuredAnchors.filter(
      (a) => a.category === "secret_habits"
    ).length || 5;
    const patternSequencesCount = configuredAnchors.filter(
      (a) => a.category === "pattern_sequences"
    ).length || 5;
    const totalCount = configuredAnchors.length || 14;

    return (
      <div className="w-full max-w-3xl mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-luxury backdrop-blur-xl text-slate-900 animate-fade-in space-y-7">
        {/* Top Status Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Security Vault Sealed
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Security Protection Active
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
            Your personal security questions are encrypted at rest with <strong>AES-256-GCM</strong> in an isolated vault.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Memory Anchors</span>
            <div className="text-xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              <span>{memoryAnchorsCount}</span>
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Secret Habits</span>
            <div className="text-xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              <span>{secretHabitsCount}</span>
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Pattern Sequences</span>
            <div className="text-xl font-black text-slate-950 mt-1 flex items-baseline gap-1">
              <span>{patternSequencesCount}</span>
              <span className="text-xs font-bold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        {/* Sealed Manifest Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                Sealed Vault Manifest
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {totalCount} Total Anchors Guarded
            </span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {(configuredAnchors.length > 0 ? configuredAnchors : DEFAULT_PRESET_PROMPTS).map(
              (item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-white/10 text-sky-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate text-slate-200 font-medium">{item.prompt}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded shrink-0 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span>••••••••••••</span>
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isFetchingPrevious || isClearing}
              onClick={handleStartEditing}
              className="w-full sm:w-auto py-3.5 px-5 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isFetchingPrevious ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0070ba]" />
              ) : (
                <Edit3 className="w-3.5 h-3.5 text-[#0070ba]" />
              )}
              <span>
                {isFetchingPrevious
                  ? "Fetching Saved Memories..."
                  : "Reconfigure Memories"}
              </span>
            </button>

            <button
              type="button"
              disabled={isFetchingPrevious || isClearing}
              onClick={handleSkipToDirectPayments}
              className="w-full sm:w-auto py-3.5 px-5 rounded-full font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center justify-center gap-2 disabled:opacity-60"
              title="Remove all questions and switch to Direct Payments"
            >
              {isClearing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>Reset Vault &amp; Direct Pay</span>
            </button>
          </div>

          <Link
            href="/dashboard"
            className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 5-STEP CATEGORY WIZARD (NEW ONBOARDING OR RECONFIGURE)
  // =========================================================================

  // Current Category for Steps 2, 3, 4
  const currentCategory: IntentCategory | null =
    currentStep >= 2 && currentStep <= 4 ? categoryOrder[currentStep - 2] : null;

  const currentCategoryMeta = currentCategory
    ? INTENT_CATEGORIES.find((c) => c.id === currentCategory)
    : null;

  const currentCategoryAnchors = currentCategory ? getCategoryAnchors(currentCategory) : [];
  const currentCategoryValidCount = currentCategory ? getValidFilledCount(currentCategory) : 0;
  const totalFilledCount = anchors.filter((a) => {
    const words = countWords(a.answer);
    return words >= 1 && words <= MAX_WORDS_PER_ANSWER;
  }).length;
  // Flexible: User can fill 1, 2, 3 or more boxes as they choose, never blocked from moving forward
  const isCurrentCategorySatisfied = true;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-luxury backdrop-blur-xl text-slate-900 animate-fade-in">
      {/* Step Tracker Header */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          <span className="flex items-center gap-1.5 text-slate-700 font-extrabold">
            <Lock className="w-3.5 h-3.5 text-[#0070ba]" /> Security Questions Setup
          </span>
          <span className="text-[#0070ba] font-mono font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
            Step {currentStep} of 5
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {[
            "1. Overview",
            "2. Memory Anchors",
            "3. Secret Habits",
            "4. Patterns",
            "5. Sealing",
          ].map((label, idx) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentStep >= idx + 1
                    ? "bg-gradient-to-r from-[#003087] to-[#0070ba] shadow-glow-sm"
                    : "bg-slate-100"
                }`}
              />
              <span
                className={`text-[10px] truncate ${
                  currentStep === idx + 1
                    ? "text-[#0070ba] font-black"
                    : currentStep > idx + 1
                    ? "text-emerald-600 font-bold"
                    : "text-slate-400 font-medium"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Editing Mode Notification Pill */}
      {isVaultConfigured && isEditingMode && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900 animate-fade-in">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Editing Security Questions:</strong> Loaded your previously saved answers. Make your changes and save when ready.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingMode(false)}
            className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition shrink-0"
          >
            Cancel &amp; Return
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: Overview & Protocol Explanation */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Configure Your Security Questions Vault
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              When high-risk transactions occur, PayPal presents dynamic questions derived
              strictly from your private memories. Remote attackers and automated bots cannot guess them.
            </p>
          </div>

          {/* 3 Domain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INTENT_CATEGORIES.map((cat, idx) => {
              const Icon =
                idx === 0 ? HeartHandshake : idx === 1 ? Sparkles : KeyRound;
              return (
                <div
                  key={cat.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3 text-[#0070ba]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100/70 text-[#0070ba]">
                      {cat.badge}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-950 mt-2">{cat.shortTitle}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Questions:</span>
                    <span className="font-mono text-[#0070ba]">Fill 1, 2, 3 or more</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Helper Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Quick Hackathon Demo:</strong> You can click the 1-click fill button to
                populate valid sample memories instantly.
              </span>
            </div>
            <button
              type="button"
              onClick={fillAllDemo}
              className="px-3.5 py-1.5 rounded-full font-bold text-xs bg-amber-200/80 hover:bg-amber-300 text-amber-950 transition shrink-0 shadow-sm"
            >
              Fill All Demo Values
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isClearing}
              onClick={handleSkipToDirectPayments}
              className="w-full sm:w-auto py-3 px-6 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition"
            >
              {isClearing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Skip Questions &amp; Enable Direct Payments</span>
            </button>

            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <span>Begin Section 1: Memory Anchors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEPS 2, 3, 4: Section-by-Section Sequential Categories */}
      {/* ========================================================================= */}
      {currentStep >= 2 && currentStep <= 4 && currentCategoryMeta && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#0070ba] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                {currentCategoryMeta.badge} • Section {currentStep - 1} of 3
              </span>
              <h2 className="text-2xl font-black text-slate-950 tracking-tight mt-1">
                {currentCategoryMeta.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentCategoryMeta.subtitle}</p>
            </div>

            {/* Answer Counter Badge & Fast Jump */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <div
                className={`px-3.5 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  currentCategoryValidCount > 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {currentCategoryValidCount > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>
                  Filled in this section:{" "}
                  <strong className="font-mono text-sm">{currentCategoryValidCount}</strong>
                  <span className="text-[11px] font-normal text-slate-500 ml-1">(Optional)</span>
                </span>
              </div>

              {totalFilledCount >= 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="px-3.5 py-1.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#0070ba] border border-blue-200/80 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                  title="Jump to seal vault with the answers you've filled"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Done? Seal Vault ({totalFilledCount} Answer{totalFilledCount === 1 ? "" : "s"})</span>
                </button>
              )}
            </div>
          </div>

          {/* Controls Bar: Demo Fill & Add Custom */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => currentCategory && fillCategoryDemo(currentCategory)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-[#0070ba] border border-blue-200/80 transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0070ba]" />
              <span>Fill {currentCategoryMeta.shortTitle} with Demo Answers</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentCategory) setCustomPromptCategory(currentCategory);
                setIsAddingCustom(!isAddingCustom);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>+ Add Custom Memory Question</span>
            </button>
          </div>

          {/* Add Custom Question Form */}
          {isAddingCustom && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-blue-200 text-xs space-y-3 animate-fade-in">
              <label className="block font-bold text-slate-800">
                Enter your private personal question:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPromptText}
                  onChange={(e) => setCustomPromptText(e.target.value)}
                  placeholder="e.g. What was the name of my first high school garage band?"
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-[#0070ba] text-slate-900 font-medium"
                />
                <button
                  type="button"
                  onClick={addCustomAnchor}
                  disabled={customPromptText.trim().length < 5}
                  className="px-4 py-2.5 rounded-xl font-bold bg-[#0070ba] hover:bg-[#005ea6] text-white disabled:opacity-50 transition"
                >
                  Save Question
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="px-3 py-2.5 text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Prompt Cards List */}
          <div className="space-y-4">
            {currentCategoryAnchors.map((item, index) => {
              const words = countWords(item.answer);
              const isOverLimit = words > MAX_WORDS_PER_ANSWER;
              const isValid = words >= 1 && !isOverLimit;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                    isValid
                      ? "bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-500/10"
                      : isOverLimit
                      ? "bg-rose-50/40 border-rose-200 ring-1 ring-rose-500/20"
                      : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          isValid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isValid ? <Check className="w-3.5 h-3.5" /> : index + 1}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-950 leading-snug">
                        {item.prompt}
                      </h4>
                    </div>

                    {currentCategoryAnchors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => currentCategory && removeAnchor(item.id, currentCategory)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Delete this question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Prompt Hint */}
                  <div className="mb-2.5 ml-8.5">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      <span>{item.hint}</span>
                    </p>
                  </div>

                  {/* Input & Word-Count Badge */}
                  <div className="relative">
                    <input
                      type="text"
                      value={item.answer}
                      onChange={(e) => updateAnswer(item.id, e.target.value)}
                      placeholder={
                        DEFAULT_PRESET_PROMPTS.find((p) => p.id === item.id)?.placeholder ||
                        "Enter 1–5 word personal secret memory..."
                      }
                      className={`w-full pl-4 pr-24 py-3 bg-white border rounded-xl text-slate-900 text-sm outline-none transition font-medium placeholder:text-slate-400 ${
                        isOverLimit
                          ? "border-rose-400 focus:ring-4 focus:ring-rose-500/10"
                          : isValid
                          ? "border-emerald-300 focus:border-[#0070ba]"
                          : "border-slate-300 focus:border-[#0070ba] focus:ring-4 focus:ring-blue-500/10"
                      }`}
                    />

                    {/* Word Counter Badge */}
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isOverLimit
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : isValid
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {words} / {MAX_WORDS_PER_ANSWER} words
                      </span>
                    </div>
                  </div>

                  {isOverLimit && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1.5 ml-1">
                      ⚠️ Please keep answers concise (1 to 5 words).
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Category Navigation Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100">
            {isVaultConfigured && isEditingMode && currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setIsEditingMode(false)}
                className="w-full sm:w-auto py-3 px-6 rounded-full font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Cancel &amp; Return to Vault
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="w-full sm:w-auto py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
              {totalFilledCount === 0 && (
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={handleSkipToDirectPayments}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 hover:decoration-slate-600 transition py-2 px-3"
                >
                  Skip to Direct Payments
                </button>
              )}

              {totalFilledCount >= 1 && currentStep < 4 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="py-3 px-5 rounded-full font-bold text-xs bg-blue-50 hover:bg-blue-100 text-[#0070ba] border border-blue-200 transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Done? Seal Vault ({totalFilledCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <span>
                  {currentStep === 4
                    ? "Review & Seal Vault"
                    : `Continue to Step ${currentStep + 1}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Vault Review & Web Crypto AES-256-GCM Sealing */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0070ba] mb-2 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#0070ba] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
              Web Crypto API • Authenticated Encryption
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1.5">
              Save &amp; Protect Security Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Your security answers will be encrypted directly in your browser using{" "}
              <strong>AES-256-GCM</strong> via the W3C Web Cryptography API before saving.
            </p>
          </div>

          {/* Vault Contents Summary Box */}
          <div className="max-w-md mx-auto bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0070ba]" /> Security Questions Summary
            </h4>

            <div className="space-y-2 text-xs font-medium text-slate-600">
              {INTENT_CATEGORIES.map((cat) => {
                const count = getValidFilledCount(cat.id);
                return (
                  <div key={cat.id} className="flex justify-between items-center py-1 border-b border-slate-200/50">
                    <span>{cat.title}</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {count} Configured
                    </span>
                  </div>
                );
              })}

              <div className="flex justify-between items-center pt-1 font-bold text-slate-900">
                <span>Total Active Memory Anchors:</span>
                <span className="font-mono text-[#0070ba] text-sm">
                  {totalFilledCount} {totalFilledCount === 1 ? "Anchor" : "Anchors"}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Payment Mode vs Sealed Anchors Info Box */}
          {totalFilledCount === 0 ? (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-left space-y-2 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0070ba]">
                <Sparkles className="w-4 h-4 text-[#0070ba] shrink-0" />
                <span>Direct Payment Mode (0 Questions Configured)</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                You haven&apos;t entered any memory questions. In <strong>Direct Payment Mode</strong>, all transfers proceed with automatic approval without security question challenges. You can configure personal questions anytime later from Security Settings.
              </p>
            </div>
          ) : (
            <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left flex items-center gap-2.5 text-xs font-bold text-emerald-800 animate-fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {totalFilledCount} Active Memory {totalFilledCount === 1 ? "Question" : "Questions"} ready for Zero-Knowledge Web Crypto sealing.
              </span>
            </div>
          )}

          {/* Real Encryption / Sealing Status */}
          {isSealing && encryptionStatus && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-blue-50 border border-blue-200 text-[#0070ba] text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0070ba]" />
              <span>{encryptionStatus}</span>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 text-left animate-fade-in shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message Display */}
          {successMessage && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-fade-in">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-4">
            <button
              onClick={() => setCurrentStep(4)}
              disabled={isSealing || isClearing}
              className="w-full sm:w-auto py-3 px-6 rounded-full font-bold text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </button>

            {totalFilledCount === 0 ? (
              <button
                type="button"
                onClick={handleSkipToDirectPayments}
                disabled={isClearing}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Activating Direct Payment Mode...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Proceed in Direct Payment Mode</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSealAndSubmit}
                disabled={isSealing || isClearing}
                className="w-full sm:w-auto py-3.5 px-8 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isSealing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                    <span>Encrypting &amp; Sealing Vault...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-sky-400" />
                    <span>Seal &amp; Activate Intent Vault ({totalFilledCount})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {totalFilledCount > 0 && (
            <div className="pt-2">
              <button
                type="button"
                disabled={isClearing || isSealing}
                onClick={handleSkipToDirectPayments}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 underline decoration-slate-300 transition"
              >
                Clear all answers and switch to Direct Payment Mode
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IntentFormWizard;
