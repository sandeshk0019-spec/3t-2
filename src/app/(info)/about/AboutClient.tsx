"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Scale,
  Smartphone,
  Bot,
  Mail,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Award,
  Lock,
  Unlock,
  KeyRound,
  X,
  Eye,
  EyeOff,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export default function AboutClient() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check persisted session
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem("3t_founder_auth");
      if (savedAuth === "true") {
        setIsUnlocked(true);
      }
    } catch (e) {}
  }, []);

  // Validation function: username '3t@founderlogin', password = current time (with flexible formats)
  const validateCredentials = (user: string, pass: string): boolean => {
    const cleanUser = user.trim().toLowerCase();
    const cleanPass = pass.trim().toLowerCase();

    if (cleanUser !== "3t@founderlogin") {
      return false;
    }

    if (cleanPass === "current time" || cleanPass === "currenttime") {
      return true;
    }

    const now = new Date();
    // Allow ±3 minutes tolerance to avoid clock skew/typing delay
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(now.getTime() + offset * 60000);
      const h24 = d.getHours();
      const h12 = h24 % 12 || 12;
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = h24 >= 12 ? "pm" : "am";

      const validVariants = [
        `${h24.toString().padStart(2, "0")}:${m}`,
        `${h24}:${m}`,
        `${h24.toString().padStart(2, "0")}${m}`,
        `${h24}${m}`,
        `${h12}:${m}`,
        `${h12.toString().padStart(2, "0")}:${m}`,
        `${h12}:${m}${ampm}`,
        `${h12}:${m} ${ampm}`,
        `${h12.toString().padStart(2, "0")}:${m}${ampm}`,
        `${h12.toString().padStart(2, "0")}:${m} ${ampm}`,
        `${h24.toString().padStart(2, "0")}.${m}`,
        `${h12}.${m}`,
      ];

      if (validVariants.some((v) => v.toLowerCase() === cleanPass)) {
        return true;
      }
    }

    return false;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    setTimeout(() => {
      if (validateCredentials(username, password)) {
        setIsUnlocked(true);
        setIsModalOpen(false);
        setUsername("");
        setPassword("");
        try {
          sessionStorage.setItem("3t_founder_auth", "true");
        } catch (e) {}
      } else {
        setErrorMsg("Invalid username or password. Please check credentials.");
      }
      setIsSubmitting(false);
    }, 400);
  };

  const handleLockFounder = () => {
    setIsUnlocked(false);
    try {
      sessionStorage.removeItem("3t_founder_auth");
    } catch (e) {}
  };

  return (
    <div className="bg-[#FAFBFD] text-[#1E293B] antialiased selection:bg-[#99bbf2] selection:text-[#0F172A] relative overflow-hidden font-sans min-h-screen">
      {/* ── SOFT PASTEL AMBIENT BACKGROUND GLOWS ── */}
      <div className="absolute top-0 left-10 w-[550px] h-[550px] bg-[#99bbf2]/30 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#baf2ac]/35 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-[#f2acc0]/25 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ── UNLOCKED STATUS BAR ── */}
      {isUnlocked && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-6 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold sticky top-16 z-40">
          <div className="flex items-center space-x-2">
            <Unlock className="w-4 h-4 text-green-200 animate-pulse" />
            <span>Executive Founder Access Active – Sandesh Kadam Showcase Unlocked</span>
          </div>
          <button
            onClick={handleLockFounder}
            className="inline-flex items-center space-x-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[11px] font-bold transition cursor-pointer"
            title="Lock Founder View"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Hide</span>
          </button>
        </div>
      )}

      {/* ── 1. PASTEL HERO ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#99bbf2]/50 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#99bbf2] animate-pulse" />
          <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>{isUnlocked ? "The Leadership & Vision of 3T" : "About 3T Dairy Payment Network"}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.12]">
          Building India&apos;s Most Honest <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#2563EB] via-[#16A34A] to-[#DB2777] bg-clip-text text-transparent">
            Dairy Payment Network.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto font-normal">
          {isUnlocked ? (
            <>
              Founded by <strong className="text-[#0F172A]">Sandesh Kadam</strong>, 3T (Time To Time) connects milk analyzers 
              directly to transparent pricing algorithms and instant mobile passbooks for dairy farmers.
            </>
          ) : (
            <>
              3T (Time To Time) connects milk analyzers directly to transparent pricing algorithms and instant mobile settlements for dairy farmers across India.
            </>
          )}
        </p>
      </section>

      {/* ── 2. EXECUTIVE FOUNDER SHOWCASE (ONLY VISIBLE WHEN UNLOCKED) ── */}
      <AnimatePresence>
        {isUnlocked && (
          <motion.section
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="max-w-5xl mx-auto px-6 py-8"
          >
            <div className="relative rounded-[32px] md:rounded-[40px] bg-white/85 backdrop-blur-xl border border-white p-8 sm:p-12 shadow-xl shadow-[#99bbf2]/10 overflow-hidden">
              {/* Top Pastel Gradient Accent Strip */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#99bbf2] via-[#baf2ac] to-[#f2acc0]" />

              <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
                {/* Left: Portrait Photo with Pastel Glow Ring */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[320px] group">
                    <div className="absolute -inset-2 bg-gradient-to-tr from-[#99bbf2] via-[#baf2ac] to-[#f2acc0] rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
                    
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white bg-white aspect-[4/5]">
                      <img
                        src="/founder-sandesh.jpeg"
                        alt="Sandesh Kadam – Founder & Creator of 3T Dairy Payment Network"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      
                      <div className="absolute bottom-3 inset-x-3 bg-white/90 backdrop-blur-md py-2.5 px-3 rounded-xl border border-white/60 shadow-xs text-center">
                        <span className="text-xs font-bold text-[#0F172A] block">
                          Sandesh Kadam
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#15803D] block mt-0.5">
                          Founder, 3T
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Personal Founder Story & Vision */}
                <div className="md:col-span-7 space-y-5">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#baf2ac]/30 border border-[#baf2ac]/70 text-[#166534] text-xs font-bold uppercase tracking-wider">
                      <Award className="w-3.5 h-3.5" />
                      <span>Founder, 3T</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                      Sandesh Kadam
                    </h2>

                    <p className="text-sm font-semibold text-[#2563EB] tracking-wide">
                      Founder, 3T — Dairy Payment Network
                    </p>
                  </div>

                  {/* Pastel Quote Block */}
                  <blockquote className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#99bbf2]/15 via-[#baf2ac]/15 to-[#f2acc0]/15 border border-[#99bbf2]/30 text-[#1E293B] italic text-sm sm:text-base leading-relaxed relative">
                    <span className="text-3xl text-[#99bbf2] font-serif leading-none absolute top-2 left-3 select-none">“</span>
                    <p className="pl-4">
                      Dairy farmers work 365 days a year, starting before sunrise. They shouldn&apos;t have to wait 15 to 20 days or wonder how their milk rate was calculated. 3T is built to give them complete clarity, dignity, and real-time payment.
                    </p>
                    <div className="mt-2 text-right">
                      <span className="text-xs font-bold text-[#DB2777] uppercase tracking-wider">— Sandesh Kadam</span>
                    </div>
                  </blockquote>

                  {/* Story */}
                  <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
                    <p>
                      Having observed traditional dairy collection centers across rural Maharashtra relying on handwritten registers and opaque periodic payouts, <strong className="text-[#0F172A]">Sandesh Kadam</strong> engineered 3T as a unified digital ecosystem.
                    </p>
                    <p>
                      3T links milk quality testing machines directly to open pricing formulas and an effortless mobile passbook — enabling any farmer to audit their milk scores and earnings instantly with one-tap OTP access.
                    </p>
                  </div>

                  {/* Quick Contact Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href="mailto:dairy3t@gmail.com"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F172A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Sandesh</span>
                    </a>
                    <Link
                      href="/farmer/login"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#99bbf2]/60 text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-2xs"
                    >
                      <span>Farmer Passbook</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── 3. THREE PASTEL CORE PILLARS ── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#15803D]">Core Principles</span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">
            Why 3T Was Built
          </h2>
          <p className="text-sm text-[#475569] mt-2">Engineered around three uncompromising principles for rural India.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-white/90 border-2 border-[#99bbf2]/50 shadow-md shadow-[#99bbf2]/10 space-y-3 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#99bbf2]/30 flex items-center justify-center text-[#1E3A8A]">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Real-Time Speed</h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Eliminates the traditional 15–20 day credit cycle. Milk delivered in the morning is calculated and settled the very same day.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider">0-Day Settlement Rail</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-white/90 border-2 border-[#baf2ac]/70 shadow-md shadow-[#baf2ac]/15 space-y-3 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#baf2ac]/40 flex items-center justify-center text-[#166534]">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Open Pricing Math</h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Every FAT score, SNF score, and rate multiplier is visible directly inside the farmer&apos;s digital passbook with zero hidden deductions.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">100% Transparent Formula</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-white/90 border-2 border-[#f2acc0]/60 shadow-md shadow-[#f2acc0]/15 space-y-3 hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#f2acc0]/35 flex items-center justify-center text-[#9D174D]">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0F172A]">Zero-Friction Access</h3>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              No complex usernames or forgotten passwords. Designed with high-accessibility mobile OTP login built for rural smartphones.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-bold text-[#DB2777] uppercase tracking-wider">OTP Mobile Passbook</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. WHAT IS INSIDE 3T ── */}
      <section className="bg-white/80 border-y border-[#99bbf2]/30 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Platform Features</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">
              Engineered for Milk Collection Centers
            </h2>
            <p className="text-sm text-[#475569] mt-2">A complete digital stack for modern dairy operations.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Smartphone,
                color: "bg-[#99bbf2]/25 text-[#1E3A8A] border-[#99bbf2]/40",
                title: "Digital Passbook",
                desc: "Farmers log in via mobile OTP to view all milk entries, rates, and past payouts.",
              },
              {
                icon: Scale,
                color: "bg-[#baf2ac]/35 text-[#166534] border-[#baf2ac]/60",
                title: "Algorithmic Pricing Engine",
                desc: "Calculates milk price automatically from FAT and SNF without manual arithmetic.",
              },
              {
                icon: Bot,
                color: "bg-[#f2acc0]/30 text-[#9D174D] border-[#f2acc0]/50",
                title: "AI Krishi Mitra",
                desc: "An intelligent farming assistant in Marathi, Hindi, and English for livestock advice.",
              },
              {
                icon: Zap,
                color: "bg-[#99bbf2]/25 text-[#1E3A8A] border-[#99bbf2]/40",
                title: "Live Shift Alerts",
                desc: "Sends instant updates to farmers when daily morning/evening collections are recorded.",
              },
              {
                icon: ShieldCheck,
                color: "bg-[#baf2ac]/35 text-[#166534] border-[#baf2ac]/60",
                title: "Multi-Branch Admin",
                desc: "Easy interface for dairy operators to manage farmers, pricing rules, and collection branches.",
              },
              {
                icon: HeartHandshake,
                color: "bg-[#f2acc0]/30 text-[#9D174D] border-[#f2acc0]/50",
                title: "Farmer Broadcast",
                desc: "Direct communication channel for dairies to send announcements and bonus notices.",
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:border-[#99bbf2] transition-colors">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-[#0F172A]">{f.title}</h4>
                <p className="text-xs text-[#475569] mt-1.5 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. CONTACT CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="p-10 rounded-[32px] bg-gradient-to-r from-[#99bbf2]/30 via-[#baf2ac]/30 to-[#f2acc0]/30 border border-white shadow-lg space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A]">
            {isUnlocked ? "Connect with Founder Sandesh Kadam" : "Connect with 3T Dairy Network"}
          </h2>
          <p className="text-sm text-[#475569] max-w-md mx-auto leading-relaxed">
            Have questions about 3T, onboarding your collection center, or partnership inquiries? Reach out directly.
          </p>
          <div className="pt-2">
            <a
              href="mailto:dairy3t@gmail.com"
              className="inline-block px-7 py-3 bg-[#0F172A] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md"
            >
              dairy3t@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* ── 6. HIDDEN / DISCREET FOUNDER ACCESS TRIGGER (BOTTOM-RIGHT) ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => {
            if (isUnlocked) {
              handleLockFounder();
            } else {
              setIsModalOpen(true);
              setErrorMsg("");
            }
          }}
          title={isUnlocked ? "Founder Active (Click to Lock)" : "Founder Access"}
          className={`p-2.5 rounded-full transition-all duration-300 shadow-md backdrop-blur-md flex items-center justify-center cursor-pointer group ${
            isUnlocked
              ? "bg-emerald-600/90 text-white hover:bg-emerald-700 ring-2 ring-emerald-400/50"
              : "bg-white/70 hover:bg-white text-gray-400 hover:text-gray-700 border border-gray-200/60 opacity-60 hover:opacity-100"
          }`}
        >
          {isUnlocked ? (
            <Unlock className="w-4 h-4" />
          ) : (
            <Lock className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* ── 7. FOUNDER LOGIN MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 relative overflow-hidden"
            >
              {/* Top Accent */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-500 to-rose-500" />

              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Founder Portal Login</h3>
                    <p className="text-[11px] text-gray-500">Authorized administrative verification</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Founder Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter founder username"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter security passcode"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !username.trim() || !password.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Verifying..." : "Authenticate"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
