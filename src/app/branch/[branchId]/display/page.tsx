"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Milk,
  User,
  Scale,
  Sparkles,
  CheckCircle2,
  QrCode,
  Maximize2,
  Minimize2,
  Bluetooth,
  Wifi,
  Clock,
  Calendar,
  Zap,
  TrendingUp,
  Award,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon
} from "lucide-react";
import { DualDisplayState, listenDualDisplayState } from "@/lib/dual-display";

interface PageProps {
  params: Promise<{ branchId: string }>;
}

export default function CustomerDualDisplay({ params }: PageProps) {
  const { branchId } = use(params);

  const [displayState, setDisplayState] = useState<DualDisplayState>({
    branchId: branchId || "B-01",
    branchName: "Kolhapur Central Hub",
    status: "standby",
    farmer: null,
    measurement: {
      weight: 0,
      fat: 4.2,
      snf: 8.5,
      shift: "Morning",
      ratePerLiter: 41.5,
      totalAmount: 0,
      scaleConnected: true,
      scaleName: "Bluetooth Scale (Auto-Link)"
    },
    baseRates: {
      basePrice: 15,
      fatFactor: 5.5,
      snfFactor: 2.0
    },
    timestamp: Date.now()
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isSuccessFlash, setIsSuccessFlash] = useState(false);
  const prevStatusRef = useRef(displayState.status);

  // Sound generator for weighment lock & submission (Web Audio API synth)
  const playChime = (type: "beep" | "success") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "beep") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {}
  };

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for 0ms terminal dual display updates
  useEffect(() => {
    const cleanup = listenDualDisplayState(branchId, (newState) => {
      if (newState.status === "recorded" && prevStatusRef.current !== "recorded") {
        playChime("success");
        setIsSuccessFlash(true);
        setTimeout(() => setIsSuccessFlash(false), 2500);
      } else if (
        newState.measurement.weight > 0 &&
        newState.measurement.weight !== displayState.measurement.weight
      ) {
        playChime("beep");
      }
      prevStatusRef.current = newState.status;
      setDisplayState(newState);
    });

    return () => cleanup();
  }, [branchId, displayState.measurement.weight]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isWeighingActive = displayState.farmer !== null && displayState.measurement.weight > 0;
  const farmer = displayState.farmer;
  const m = displayState.measurement;

  // Passbook mobile link for dynamic QR
  const passbookUrl = farmer
    ? `https://3tdairy.vercel.app/farmer/${farmer.id}`
    : "https://3tdairy.vercel.app";

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans select-none overflow-hidden flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.08),transparent_50%)] pointer-events-none" />

      {/* Success Flash Effect */}
      <AnimatePresence>
        {isSuccessFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-400 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER BAR */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800/80 relative z-10">
        {/* Left: Brand & Branch */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
            <Milk className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">3T DAIRY</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Customer Display
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {displayState.branchName || "Center Terminal"} · Branch #{displayState.branchId}
            </p>
          </div>
        </div>

        {/* Center: Live Connectivity Badge */}
        <div className="hidden sm:flex items-center space-x-3 bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold text-emerald-400">0ms Live Sync</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300">
            <Bluetooth className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>{m.scaleName || "Bluetooth Scale Online"}</span>
          </div>
        </div>

        {/* Right: Shift & Clock & Fullscreen */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <div className="text-base font-mono font-black text-slate-100 tracking-wider">
              {currentTime}
            </div>
            <div className="text-[11px] font-bold text-slate-400">{currentDate}</div>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 border ${
              m.shift === "Morning"
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
            }`}
          >
            <span>{m.shift === "Morning" ? "🌅 Morning" : "🌇 Evening"} Shift</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Toggle Fullscreen (F11)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 2. MAIN BODY: WEIGHING ACTIVE vs STANDBY */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <main className="my-auto py-6 relative z-10">
        <AnimatePresence mode="wait">
          {isWeighingActive && farmer ? (
            /* ACTIVE WEIGHMENT VIEW */
            <motion.div
              key="active-weighing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
            >
              {/* LEFT: Farmer Profile & QR Slip (4 cols) */}
              <div className="lg:col-span-4 bg-slate-900/90 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                      Farmer Verified
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>KYC Linked</span>
                    </span>
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center space-x-4 pt-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg ring-4 ring-emerald-500/20">
                      {farmer.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight">{farmer.name}</h2>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-slate-800 text-emerald-400 rounded-md border border-slate-700">
                          {farmer.id}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">{farmer.village}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cattle & Stats */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cattle Registered</span>
                      <span className="text-base font-extrabold text-white mt-0.5 block">{farmer.animals || 1} Animals</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shift Status</span>
                      <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                        {displayState.status === "recorded" ? "✓ Logged" : "Active Scale"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom QR Code Scan */}
                <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center space-x-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                  <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                    <img
                      src={`https://quickchart.io/qr?text=${encodeURIComponent(passbookUrl)}&size=120`}
                      onError={(e: any) => {
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(passbookUrl)}`;
                      }}
                      alt="Passbook QR"
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-extrabold">
                      <QrCode className="w-4 h-4" />
                      <span>Instant Mobile Passbook</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 leading-snug">
                      Scan with any camera app to view your digital passbook & payment slip.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT: High-Impact Digital Scale & Rate Readouts (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* 1. HUGE DIGITAL WEIGHT DISPLAY */}
                <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-emerald-400">
                      <Scale className="w-5 h-5 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-widest">
                        Digital Milk Quantity (Weight)
                      </span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ● Live Sensor Streaming
                    </span>
                  </div>

                  {/* Mega Numbers */}
                  <div className="my-2 flex items-baseline justify-center space-x-4">
                    <span className="font-mono text-7xl sm:text-8xl lg:text-9xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.35)]">
                      {m.weight.toFixed(1)}
                    </span>
                    <span className="text-2xl sm:text-4xl font-extrabold text-slate-400 uppercase tracking-widest">
                      Liters
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-t border-slate-800/80 pt-3 mt-2">
                    <span>Precision: ±0.05 Liters</span>
                    <span>Direct Bluetooth Optical Interface</span>
                  </div>
                </div>

                {/* 2. QUALITY ANALYZER + RATE + TOTAL EARNINGS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* FAT % */}
                  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Butterfat (FAT)
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-white">{m.fat.toFixed(1)}</span>
                      <span className="text-base font-extrabold text-emerald-400">%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((m.fat / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* SNF % */}
                  <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                      Solid-Not-Fat (SNF)
                    </span>
                    <div className="flex items-baseline space-x-1.5">
                      <span className="font-mono text-3xl sm:text-4xl font-black text-white">{m.snf.toFixed(1)}</span>
                      <span className="text-base font-extrabold text-teal-400">%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((m.snf / 12) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* TOTAL EARNINGS (GOLD) */}
                  <div className="bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-slate-900 rounded-2xl p-5 border border-amber-500/40 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                        Shift Payout
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">₹{m.ratePerLiter.toFixed(2)}/L</span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xl font-black text-amber-400 font-sans">₹</span>
                      <span className="font-mono text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                        {m.totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] font-extrabold text-amber-400/90 flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Instant Bank Payout</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* STANDBY / WELCOME VIEW */
            <motion.div
              key="standby"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto text-center space-y-8 py-8"
            >
              {/* Standby Pulse Icon */}
              <div className="relative inline-flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <Scale className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  Ready For Milk Weighing
                </h1>
                <p className="text-base font-semibold text-slate-400 mt-2 max-w-lg mx-auto">
                  Please place milk container on the digital scale. Live weight, FAT analysis, and rate will display automatically.
                </p>
              </div>

              {/* Rate Board */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🐄 Standard Cow Rate</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono block mt-1">₹38.50 - ₹44.00</span>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">Standard 3.5% FAT · 8.5% SNF</p>
                </div>

                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🐃 Buffalo Premium</span>
                  <span className="text-2xl font-extrabold text-teal-400 font-mono block mt-1">₹58.00 - ₹72.50</span>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">High 6.5% FAT · 9.0% SNF</p>
                </div>

                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">⚡ Payout Mode</span>
                  <span className="text-2xl font-extrabold text-amber-300 block mt-1">Instant UPI / Bank</span>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">Direct to Aadhaar linked account</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* 3. FOOTER BAR */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs font-semibold text-slate-400 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>3T Dairy Autonomous Weighing & IoT Analyzer Gateway</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>Formula: ₹{displayState.baseRates.basePrice} + (FAT×{displayState.baseRates.fatFactor}) + (SNF×{displayState.baseRates.snfFactor})</span>
          <span className="text-slate-700">|</span>
          <Link
            href={`/branch/${branchId}`}
            className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
          >
            Operator Terminal ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
