"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Droplet, 
  Scale, 
  Cpu, 
  Smartphone, 
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from "lucide-react";

export default function ProcessVideoPlayer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      id: 0,
      time: "05:30 AM",
      title: "Step 1: Fresh Cow Milking",
      subtitle: "Morning Shift at the Farm",
      icon: Droplet,
      accentColor: "#3B82F6",
      bgGradient: "from-blue-500/20 via-sky-500/10 to-transparent",
      headline: "Fresh Milk Collected at Sunrise",
      description: "The farmer completes the morning milking shift. Milk is sealed into standardized stainless steel collection cans at optimal temperature for immediate delivery.",
      visualBadge: "Stage: Farm Origin",
      metrics: [
        { label: "Shift", value: "Morning (05:30 AM)" },
        { label: "Cattle Type", value: "Crossbred Cow" },
        { label: "Freshness", value: "100% Pure" },
      ],
      animationGraphic: "🐄 ➔ 🥛"
    },
    {
      id: 1,
      time: "06:15 AM",
      title: "Step 2: Smart Analyzer Quality Scan",
      subtitle: "Village Collection Center",
      icon: Scale,
      accentColor: "#10B981",
      bgGradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      headline: "Instant FAT & SNF Digitization in 5s",
      description: "Milk is poured into the 3T connected digital scale and ultrasonic analyzer. Weight, FAT percentage, and SNF percentage are captured automatically with zero manual entry.",
      visualBadge: "Stage: Quality Testing",
      metrics: [
        { label: "Quantity", value: "15.40 Liters" },
        { label: "FAT Score", value: "4.5 %" },
        { label: "SNF Score", value: "8.8 %" },
      ],
      animationGraphic: "⚖️ ➔ 🔬"
    },
    {
      id: 2,
      time: "06:16 AM",
      title: "Step 3: 3T Algorithmic Pricing",
      subtitle: "Cloud Settlement Engine",
      icon: Cpu,
      accentColor: "#F59E0B",
      bgGradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
      headline: "Transparent Formula Calculation",
      description: "3T's pricing engine receives the encrypted readings and applies the transparent rate formula. Rate per liter and exact gross payout are computed instantly.",
      visualBadge: "Stage: Calculation",
      metrics: [
        { label: "Rate Applied", value: "₹67.56 / Liter" },
        { label: "Deductions", value: "₹0.00 (Zero Hidden)" },
        { label: "Net Payout", value: "₹1,040.42" },
      ],
      animationGraphic: "⚡ ➔ 💰"
    },
    {
      id: 3,
      time: "06:17 AM",
      title: "Step 4: Bank Credit & Mobile Passbook",
      subtitle: "Instant Settlement & SMS Receipt",
      icon: Smartphone,
      accentColor: "#8B5CF6",
      bgGradient: "from-purple-500/20 via-pink-500/10 to-transparent",
      headline: "Funds Credited & Passbook Updated",
      description: "Direct bank transfer is executed. The farmer immediately receives an SMS confirmation and a live digital passbook receipt showing every detail.",
      visualBadge: "Stage: Final Settlement",
      metrics: [
        { label: "Payment Status", value: "SUCCESS (Credited)" },
        { label: "UTR Reference", value: "3T-8921938210" },
        { label: "Farmer Passbook", value: "Updated Live" },
      ],
      animationGraphic: "📲 ➔ 🏦"
    }
  ];

  // Auto-play timeline timer
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentStep((curr) => (curr + 1) % steps.length);
          return 0;
        }
        return prev + 2.5; // ~4 seconds per step
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, steps.length]);

  const active = steps[currentStep];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-4xl bg-[#0F172A] border border-white/15 rounded-[32px] shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0F8A5F] flex items-center justify-center font-black text-xs">
              3T
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>The 3T Journey: Cow to Bank Settlement</span>
                <span className="px-2 py-0.5 rounded-full bg-[#0F8A5F]/30 text-[#4ade80] text-[10px] font-extrabold uppercase tracking-wider">
                  Interactive Video
                </span>
              </h3>
              <p className="text-xs text-white/50">Simulating the complete 4-step real-time milk payment workflow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas Body */}
        <div className="relative flex-1 p-6 sm:p-8 overflow-y-auto">
          
          {/* Animated Background Mesh */}
          <div className={`absolute inset-0 bg-gradient-to-br ${active.bgGradient} transition-all duration-700 pointer-events-none -z-10`} />

          {/* Step Timeline Indicator */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentStep(idx);
                  setProgress(0);
                }}
                className="text-left group"
              >
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-[#4ade80] transition-all duration-100"
                    style={{
                      width: idx < currentStep ? "100%" : idx === currentStep ? `${progress}%` : "0%"
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-bold ${idx === currentStep ? "text-white" : "text-white/40"}`}>
                    Step {idx + 1}
                  </span>
                  <span className="text-[10px] text-white/40 hidden sm:inline">{s.time}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Main Visual Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column: Visual Scene Card */}
              <div className="md:col-span-6 bg-white/[0.04] border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md relative overflow-hidden flex flex-col justify-between min-h-[300px] shadow-xl">
                
                {/* Visual Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10">
                    {active.visualBadge}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4ade80]">
                    ⏱ {active.time}
                  </span>
                </div>

                {/* Center Animated Graphic */}
                <div className="my-6 text-center space-y-3">
                  <div className="text-5xl sm:text-6xl filter drop-shadow-md animate-bounce">
                    {active.animationGraphic}
                  </div>
                  <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {active.headline}
                  </h4>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                  {active.metrics.map((m) => (
                    <div key={m.label} className="p-2.5 rounded-xl bg-black/40 text-center">
                      <span className="text-[9px] uppercase tracking-wider text-white/50 block">{m.label}</span>
                      <span className="text-xs font-bold text-white block mt-0.5 truncate">{m.value}</span>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Column: Explanatory Breakdown */}
              <div className="md:col-span-6 space-y-5">
                
                <div>
                  <span className="text-xs font-bold text-[#4ade80] uppercase tracking-widest block">
                    {active.subtitle}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-founder-name tracking-tight mt-1">
                    {active.title}
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-white/70 leading-relaxed font-normal">
                  {active.description}
                </p>

                {/* Simulated Phone Notification on Step 4 */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs space-y-1.5 shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>SMS & WhatsApp Alert Sent</span>
                    </div>
                    <p className="text-white/90 font-mono text-[11px] leading-snug">
                      &quot;Namaste Ramesh ji! ₹1,040.42 credited to Bank A/c for 15.4L Milk (FAT 4.5%, SNF 8.8%). Rate: ₹67.56/L. — 3T Network&quot;
                    </p>
                  </motion.div>
                )}

                {/* Key Benefit Highlight */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#4ade80] shrink-0" />
                  <span className="text-xs text-white/80 font-medium">
                    {currentStep === 0 && "Zero waiting time at collection — straight from farm to station."}
                    {currentStep === 1 && "Hardware-sealed readings prevent manual grading disputes."}
                    {currentStep === 2 && "Automated formula calculation completely removes human math errors."}
                    {currentStep === 3 && "Money reaches the farmer's bank account before they return home."}
                  </span>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Video Player Controls Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F8A5F] hover:bg-[#16a34a] text-white text-xs font-bold uppercase tracking-wider transition shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={() => {
                setCurrentStep(0);
                setProgress(0);
                setIsPlaying(true);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition"
              title="Restart Video"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentStep === 0}
              onClick={() => {
                setCurrentStep((prev) => Math.max(0, prev - 1));
                setProgress(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-bold"
            >
              Previous
            </button>
            <button
              disabled={currentStep === steps.length - 1}
              onClick={() => {
                setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
                setProgress(0);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold text-[#4ade80]"
            >
              Next
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
