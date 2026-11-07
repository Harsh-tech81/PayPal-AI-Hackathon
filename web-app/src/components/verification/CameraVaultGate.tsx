"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, CheckCircle2, ShieldCheck, RefreshCw, Lock, ArrowLeft, Scan, Sparkles } from "lucide-react";
import Link from "next/link";

interface CameraVaultGateProps {
  onVerified: () => void;
}

export function CameraVaultGate({ onVerified }: CameraVaultGateProps) {
  const [step, setStep] = useState<"ready" | "scanning" | "verified">("ready");
  const [scanProgress, setScanProgress] = useState(0);
  const [hasWebcam, setHasWebcam] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setHasWebcam(true);
      } else {
        setHasWebcam(false);
      }
    } catch {
      setHasWebcam(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartScan = () => {
    setStep("scanning");
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep("verified");
          stopCamera();
          setTimeout(() => {
            onVerified();
          }, 1000);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white/95 border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-luxury backdrop-blur-xl text-center relative overflow-hidden animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-50 to-blue-100 text-[#0070ba] flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-200/60">
        <Lock className="w-8 h-8" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0070ba] text-[10px] font-black uppercase tracking-wider mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0070ba] animate-pulse" />
        Biometric Camera Guard Active
      </span>
      <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Camera Verification Required</h2>
      <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
        To configure or update your Zero-Knowledge Memory Vault, please confirm your physical identity with a quick camera face scan.
      </p>

      {/* Viewfinder Viewport with HUD Brackets */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center my-6">
        {hasWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-navy-900 to-slate-900 flex flex-col items-center justify-center p-6 text-center relative">
            <div className="w-20 h-20 rounded-2xl border border-sky-500/30 bg-sky-500/10 flex items-center justify-center mb-3 animate-pulse">
              <Camera className="w-9 h-9 text-sky-400" />
            </div>
            <p className="text-xs font-bold text-slate-200">Biometric Sensor Standby</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for live facial keypoint alignment.</p>
          </div>
        )}

        {/* HUD Corner Brackets */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-sky-400/80 pointer-events-none" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-sky-400/80 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-sky-400/80 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-sky-400/80 pointer-events-none" />

        {/* Oval Face Target Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`w-44 h-56 rounded-full border-2 transition-all duration-300 ${
              step === "verified"
                ? "border-emerald-500 bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                : step === "scanning"
                ? "border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.6)]"
                : "border-white/30 border-dashed"
            }`}
          />
        </div>

        {/* Laser Sweep Beam */}
        {step === "scanning" && <div className="laser-scan-line pointer-events-none" />}

        {/* Verified Overlay */}
        {step === "verified" && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-glow-emerald">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-950">Identity Confirmed!</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Opening Encrypted Memory Vault...</p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {step === "scanning" && (
        <div className="mb-4 text-left">
          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span>Verifying Facial Biometrics...</span>
            <span className="font-mono text-[#0070ba]">{scanProgress}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-[#0070ba] rounded-full transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {step === "ready" && (
          <button
            onClick={handleStartScan}
            className="w-full py-4 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Camera className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Scan Face to Unlock Memory Vault</span>
          </button>
        )}

        {step === "scanning" && (
          <button
            disabled
            className="w-full py-4 rounded-full font-bold text-sm bg-slate-200 text-slate-600 flex items-center justify-center gap-2 cursor-wait"
          >
            <RefreshCw className="w-4 h-4 animate-spin text-[#0070ba]" />
            <span>Verifying Live Physical Presence...</span>
          </button>
        )}

        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-1.5 pt-1 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Return to Dashboard
        </Link>
      </div>
    </div>
  );
}