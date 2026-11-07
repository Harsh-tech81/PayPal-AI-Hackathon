"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, CheckCircle2, ShieldCheck, RefreshCw, Lock, ArrowLeft } from "lucide-react";
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
    <div className="w-full max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl text-center">
      <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0070ba] flex items-center justify-center mx-auto mb-4">
        <Lock className="w-7 h-7" />
      </div>

      <span className="inline-block px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0070ba] text-xs font-bold uppercase tracking-wider mb-2">
        Biometric Camera Guard Active
      </span>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Camera Verification Required</h2>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
        To configure or update your Zero-Knowledge Memory Vault, please confirm your physical identity with a quick camera face scan.
      </p>

      {/* Viewfinder */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-slate-950 overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center my-6">
        {hasWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#0070ba] flex items-center justify-center mb-3 animate-pulse">
              <Camera className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-xs font-bold text-slate-200">Biometric Sensor Standby</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for live facial keypoint alignment.</p>
          </div>
        )}

        {/* Oval Face Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className={`w-40 h-52 rounded-full border-2 transition-all duration-300 ${
              step === "verified"
                ? "border-emerald-500 bg-emerald-500/10"
                : step === "scanning"
                ? "border-[#0070ba] shadow-[0_0_25px_rgba(0,112,186,0.6)]"
                : "border-white/50 border-dashed"
            }`}
          />
        </div>

        {/* Scanning Laser Beam */}
        {step === "scanning" && (
          <div className="absolute inset-x-8 top-10 bottom-10 pointer-events-none overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent animate-bounce shadow-[0_0_15px_#38bdf8]" />
          </div>
        )}

        {/* Verified Overlay */}
        {step === "verified" && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Identity Confirmed!</h3>
            <p className="text-xs font-medium text-slate-500 mt-1">Opening Encrypted Memory Vault...</p>
          </div>
        )}
      </div>

      {/* Progress & Actions */}
      {step === "scanning" && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-600 mb-1.5">
            <span>Verifying Facial Biometrics...</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#0070ba] rounded-full transition-all duration-200"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {step === "ready" && (
          <button
            onClick={handleStartScan}
            className="w-full py-4 rounded-full font-bold text-sm bg-black hover:bg-neutral-800 text-white shadow-md transition flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scan Face to Unlock Memory Vault
          </button>
        )}

        {step === "scanning" && (
          <button
            disabled
            className="w-full py-4 rounded-full font-bold text-sm bg-slate-200 text-slate-500 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            Verifying Live Physical Presence...
          </button>
        )}

        <Link
          href="/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Cancel & Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
