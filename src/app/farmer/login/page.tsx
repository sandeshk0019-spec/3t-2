"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  Milk,
  RotateCcw,
  CheckCircle2,
  Loader2,
  LogIn,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[idx] = digit;
    const next = arr.join("");
    onChange(next.padEnd(6, ""));
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const arr = value.split("");
        arr[idx] = "";
        onChange(arr.join("").padEnd(6, ""));
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) inputs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted.padEnd(6, ""));
    const focusIdx = Math.min(pasted.length, 5);
    inputs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => { inputs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`w-11 h-14 rounded-xl border-2 text-center text-lg font-black transition-all duration-200 outline-none
            ${value[idx]
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-gray-200 bg-white text-gray-900 focus:border-emerald-400 focus:bg-emerald-50/30"
            }`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

type Step = "phone" | "otp" | "success";

export default function FarmerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("      ");
  const [farmerName, setFarmerName] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [autoChecking, setAutoChecking] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedPhone = localStorage.getItem("3t_farmer_phone");
        if (savedPhone) {
          setPhone(savedPhone);
        }
      }
    } catch {}
    phoneRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Auto-fill OTP when all 6 digits entered
  const otpVal = otp.trim();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/farmer-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to send OTP. Please try again.");
      } else {
        setFarmerName(data.farmerName || "");
        setDemoOtp(data._demo_otp || "");
        setOtp("      ");
        setStep("otp");
        setResendCountdown(30);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError("Please enter all 6 digits of your OTP.");
      return;
    }
    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, "");
      const res = await fetch("/api/auth/farmer-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits, otp: trimmedOtp }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Incorrect OTP. Please try again.");
        setOtp("      ");
      } else {
        setStep("success");
        // Save persistent farmer session on this device
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("3t_saved_farmer_id", data.farmerId);
            localStorage.setItem("3t_farmer_phone", digits);
          }
        } catch {}
        setTimeout(() => {
          router.push(`/farmer/${data.farmerId}`);
        }, 1200);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCountdown > 0) return;
    setStep("phone");
    setOtp("      ");
    setError("");
    setDemoOtp("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f0faf5] via-[#fafffe] to-[#f0f4ff] p-4 font-sans">
      {/* Background decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center space-x-3 mb-10">
        <img src="/3t-logo.png" alt="3T Logo" className="h-11 w-auto max-w-[140px] object-contain drop-shadow-xs" />
        <div>
          <span className="font-black text-xl text-gray-900">3T Network</span>
          <span className="text-[11px] block text-gray-400 font-semibold tracking-widest uppercase -mt-0.5">
            Farmer Passbook
          </span>
        </div>
      </div>

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-emerald-100/50 border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="p-8">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Phone Entry ── */}
            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Milk className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-gray-900">Farmer Login</h1>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Enter your registered mobile number
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                        +91
                      </span>
                      <input
                        ref={phoneRef}
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 text-gray-900 font-bold text-base tracking-widest focus:outline-none focus:border-emerald-500 focus:bg-emerald-50/30 transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-300"
                      />
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending OTP...</span></>
                    ) : (
                      <><span>Get OTP</span><ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>

                <p className="text-center text-[11px] text-gray-400 font-medium mt-5">
                  Your number must be registered at your collection center.
                </p>
              </motion.div>
            )}

            {/* ── STEP 2: OTP Verification ── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Enter OTP</h2>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Sent to +91 {phone}
                      {farmerName && <span className="text-emerald-700"> ({farmerName})</span>}
                    </p>
                  </div>
                </div>

                {/* Demo OTP banner */}
                {demoOtp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
                        🔧 Demo Mode — Your OTP
                      </span>
                      <span className="font-black text-2xl tracking-[0.3em] text-amber-800">
                        {demoOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(demoOtp.padEnd(6, ""))}
                      className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 transition-colors"
                    >
                      Auto-fill
                    </button>
                  </motion.div>
                )}

                <div className="space-y-5">
                  <OtpInput value={otp} onChange={setOtp} />

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100 text-center"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpVal.length !== 6}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center space-x-2 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Verifying...</span></>
                    ) : (
                      <><LogIn className="w-4 h-4" /><span>View My Catalog</span></>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCountdown > 0}
                      className="text-xs font-bold flex items-center space-x-1.5 text-gray-500 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep("phone"); setError(""); setDemoOtp(""); }}
                      className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      Change number
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Success ── */}
            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 space-y-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">Verified!</h2>
                  <p className="text-sm text-gray-500 font-semibold mt-1">
                    Opening your personal catalog...
                  </p>
                </div>
                <div className="flex space-x-1.5 pt-2">
                  {[0, 0.15, 0.3].map((delay, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>

      <div className="relative z-10 mt-8 text-center space-y-2 max-w-sm">
        <p className="text-[11px] text-gray-400 font-medium">
          Protected by 3T Secure Authentication · Your data is private and encrypted.
        </p>
        <div className="flex items-center justify-center space-x-3 text-[11px] text-gray-400">
          <Link href="/legal/security" className="hover:text-emerald-700 hover:underline transition-colors">
            Security Protocol
          </Link>
          <span>•</span>
          <Link href="/legal/privacy" className="hover:text-emerald-700 hover:underline transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/helpdesk" className="hover:text-emerald-700 hover:underline transition-colors">
            Helpdesk
          </Link>
        </div>
      </div>
    </div>
  );
}
