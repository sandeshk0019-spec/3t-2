"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Scale, 
  Smartphone, 
  MessageSquare, 
  Cpu, 
  Building, 
  DollarSign, 
  Droplet, 
  Percent, 
  Calculator, 
  Bell,
  Sparkles,
  Film,
  Play,
  Layers
} from "lucide-react";
import { calculateRate, defaultFormulaConfig, FormulaConfig } from "./data";
import ProcessVideoPlayer from "@/app/components/ProcessVideoPlayer";

export default function LandingPage() {
  // Workflow step state
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      title: "Farmer Gives Milk",
      desc: "Farmer brings fresh milk to the nearest 3T smart collection center.",
      icon: Droplet,
      color: "text-primary",
      bgColor: "bg-primary-light"
    },
    {
      title: "Digital Weighing & Quality Scan",
      desc: "Weight, FAT%, and SNF% are captured digitally on IoT-enabled scales.",
      icon: Layers,
      color: "text-amber-500",
      bgColor: "bg-amber-50"
    },
    {
      title: "Transparent Rate Calculation",
      desc: "Instant dynamic formula calculation based on verified quality metrics.",
      icon: Calculator,
      color: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      title: "Instant Direct Payment",
      desc: "Bank API triggers UPI/IMPS transfer straight to farmer's account.",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50"
    }
  ];

  // Auto-advance workflow steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [steps.length]);

  // Simulator state
  const [showVideo, setShowVideo] = useState(false);
  const [weight, setWeight] = useState(12.45);
  const [fat, setFat] = useState(4.2);
  const [snf, setSnf] = useState(8.6);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(defaultFormulaConfig);

  // Synchronize live formula configuration from the dairy database
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setFormulaConfig(data.data);
        }
      })
      .catch(() => {});

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => {
          fetch("/api/settings", { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.data) setFormulaConfig(d.data);
            })
            .catch(() => {});
        };
      }
    } catch {}

    return () => {
      if (channel) channel.close();
    };
  }, []);

  const rate = calculateRate(fat, snf, formulaConfig);
  const total = Math.round(weight * rate * 100) / 100;

  const handleSimulate = () => {
    setIsSimulating(true);
    setShowNotification(false);
    setTimeout(() => {
      setIsSimulating(false);
      setShowNotification(true);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAFA] flex flex-col font-sans selection:bg-primary-light selection:text-primary">
      {/* Background radial grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none z-0" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border-light">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/3t-logo.png" alt="3T Logo" className="h-10 w-auto max-w-[140px] object-contain drop-shadow-xs" />
            <div>
              <span className="font-bold text-xl tracking-tight text-text-main">3T</span>
              <span className="text-xs block text-text-muted font-medium tracking-widest uppercase -mt-1">Time To Time</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#workflow" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#simulator" className="hover:text-primary transition-colors">Live Demo</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/farmer/login"
              className="px-5 py-2.5 rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary-light transition-all duration-200"
            >
              🌾 Farmer Login
            </Link>
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-[#0b6b49] transition-all duration-200 shadow-premium-sm hover:shadow-premium-md hover:-translate-y-0.5"
            >
              Dashboard Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 flex flex-col space-y-6">
            <div className="inline-flex items-center space-x-2 bg-primary-light text-primary px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>India&apos;s Fastest Farmer Payment Network</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-text-main tracking-tight leading-tight md:leading-none">
              Milk Now.<br />
              <span className="text-primary bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Money Now.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-text-muted max-w-xl font-medium leading-relaxed">
              Get paid instantly in your bank account right after every milk collection. Fast checks, 100% transparency, and bulletproof security.
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <Link
                href="/farmer/login"
                className="px-8 py-4 rounded-xl bg-primary text-white font-semibold text-center hover:bg-[#0b6b49] transition-all shadow-premium-md hover:shadow-premium-lg hover:-translate-y-0.5 flex items-center justify-center space-x-2 group"
              >
                <span>🌾 View My Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login"
                className="px-8 py-4 rounded-xl border border-border-light bg-white text-text-main font-semibold text-center hover:bg-[#FAFAFA] transition-all hover:border-gray-300 flex items-center justify-center space-x-2 shadow-premium-sm"
              >
                <span>Launch Dashboard</span>
              </Link>
            </div>

            <div className="flex items-center space-x-8 pt-8 border-t border-border-light max-w-md">
              <div>
                <span className="block text-2xl font-bold text-text-main">10s</span>
                <span className="text-xs text-text-muted font-medium">Quality Testing</span>
              </div>
              <div className="w-px h-8 bg-border-light" />
              <div>
                <span className="block text-2xl font-bold text-text-main">Instant</span>
                <span className="text-xs text-text-muted font-medium">Direct Bank Settlement</span>
              </div>
              <div className="w-px h-8 bg-border-light" />
              <div>
                <span className="block text-2xl font-bold text-text-main">100%</span>
                <span className="text-xs text-text-muted font-medium">Digital Transparency</span>
              </div>
            </div>
          </div>

          {/* Workflow Interactive Illustration */}
          <div className="md:col-span-5 relative">
            <div className="bg-white border border-border-light rounded-2xl p-6 shadow-premium-lg">
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Instant Payment Pipeline</span>
                <div className="flex space-x-1.5">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        activeStep === idx ? "bg-primary w-6" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = activeStep === idx;
                  
                  return (
                    <motion.div
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`flex items-start space-x-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? "border-primary bg-primary-light/30 shadow-premium-sm" 
                          : "border-transparent hover:bg-gray-50"
                      }`}
                      animate={{ scale: isActive ? 1.02 : 1 }}
                    >
                      <div className={`p-3 rounded-xl ${isActive ? step.bgColor : "bg-gray-100"} ${isActive ? step.color : "text-gray-400"} transition-colors`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-base font-bold transition-colors ${isActive ? "text-primary" : "text-text-main"}`}>
                            {step.title}
                          </h4>
                          {isActive && (
                            <span className="text-xs bg-primary text-white font-bold px-2 py-0.5 rounded-md">
                              Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted font-medium mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-white border-y border-border-light py-24 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Uncompromising Quality</span>
              <h2 className="text-4xl font-extrabold text-text-main tracking-tight mt-2">
                Designed for Farmers, Powered by Tech
              </h2>
              <p className="text-text-muted mt-4 font-medium">
                We remove administrative delays, intermediaries, and manual calculation errors to guarantee fair value.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  title: "Instant Payments",
                  desc: "Money hits the farmer's bank account instantly via UPI and IMPS direct API triggers.",
                  icon: DollarSign,
                  color: "text-primary",
                  bgColor: "bg-primary-light"
                },
                {
                  title: "Milk Quality Scan",
                  desc: "Automatic digital logging of FAT, SNF, and weight prevents manual sheet tampering.",
                  icon: Scale,
                  color: "text-secondary",
                  bgColor: "bg-green-50"
                },
                {
                  title: "100% Transparency",
                  desc: "Every milk transaction, quality metric, and payout trace is visible to both farmers and hubs.",
                  icon: CheckCircle2,
                  color: "text-accent",
                  bgColor: "bg-amber-50"
                },
                {
                  title: "Bank-Grade Security",
                  icon: ShieldCheck,
                  desc: "All transaction logs are encrypted and processed through RBI-approved merchant payment gateways.",
                  color: "text-blue-600",
                  bgColor: "bg-blue-50"
                }
              ].map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <div 
                    key={index} 
                    className="p-8 rounded-2xl border border-border-light bg-[#FAFAFA] hover-lift flex flex-col space-y-4"
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${feat.bgColor} ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main">{feat.title}</h3>
                    <p className="text-sm font-medium text-text-muted leading-relaxed flex-grow">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Timeline */}
        <section id="workflow" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">The Process</span>
            <h2 className="text-4xl font-extrabold text-text-main tracking-tight mt-2">
              From Milking to Banking in 7 Steps
            </h2>
            <p className="text-text-muted mt-4 font-medium">
              We have digitised the dairy collection process, cutting out hours of paper logs and check delays.
            </p>
          </div>

          <div className="relative">
            {/* Horizontal line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-4 right-4 h-0.5 bg-border-light -translate-y-1/2 z-0" />
            
            <div className="grid md:grid-cols-7 gap-8 relative z-10">
              {[
                { step: "01", label: "Farmer", desc: "Milk drop-off", icon: Droplet },
                { step: "02", label: "Center Scan", desc: "Digital verification", icon: Building },
                { step: "03", label: "Weight Check", desc: "Loadcell measure", icon: Scale },
                { step: "04", label: "FAT & SNF", desc: "Digital ultrasonic analyzer", icon: Percent },
                { step: "05", label: "Calculation", desc: "Algorithm rate check", icon: Calculator },
                { step: "06", label: "Instant Bank", desc: "UPI / IMPS dispatch", icon: DollarSign },
                { step: "07", label: "SMS Receipt", desc: "WhatsApp & SMS alert", icon: MessageSquare }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-border-light shadow-premium-sm flex items-center justify-center text-primary hover:border-primary transition-colors group relative">
                      <Icon className="w-6 h-6" />
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {item.step}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main">{item.label}</h4>
                      <p className="text-xs font-medium text-text-muted mt-1 max-w-[120px] mx-auto leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Demo / Simulator Section */}
        <section id="simulator" className="bg-white border-t border-border-light py-24">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
            
            {/* Calculator controls */}
            <div className="md:col-span-6 flex flex-col space-y-6">
              <div className="inline-flex items-center space-x-1.5 text-primary text-xs font-bold uppercase tracking-widest">
                <Calculator className="w-4 h-4" />
                <span>Milk Payout Simulator</span>
              </div>
              <h2 className="text-4xl font-extrabold text-text-main tracking-tight leading-tight">
                Try the Payout Simulator Yourself
              </h2>
              <p className="text-text-muted font-medium">
                Adjust the sliders below representing the milk quantity and quality metrics. See the rate per liter calculated instantly by the pricing engine, and simulate the payment dispatch.
              </p>

              {/* Dynamic Live Formula Badge */}
              <div className="p-3.5 bg-primary-light/60 border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-900">Live Quality Formula:</span>
                <span className="font-mono font-bold text-primary bg-white px-2.5 py-1 rounded-xl shadow-xs border border-primary/20">
                  ₹{formulaConfig.basePrice.toFixed(2)} + ({formulaConfig.fatFactor}x FAT) + ({formulaConfig.snfFactor}x SNF)
                </span>
              </div>

              <div className="space-y-6 pt-4">
                {/* Weight Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-text-main">
                    <span>Milk Weight (Liters)</span>
                    <span className="text-primary">{weight.toFixed(2)} L</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="50" 
                    step="0.05"
                    value={weight} 
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-xs text-text-muted font-semibold">
                    <span>1.0 L</span>
                    <span>50.0 L</span>
                  </div>
                </div>

                {/* FAT Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-text-main">
                    <span>FAT Percentage (%)</span>
                    <span className="text-primary">{fat.toFixed(1)} %</span>
                  </div>
                  <input 
                    type="range" 
                    min="2.5" 
                    max="8.0" 
                    step="0.1"
                    value={fat} 
                    onChange={(e) => setFat(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-xs text-text-muted font-semibold">
                    <span>2.5%</span>
                    <span>8.0%</span>
                  </div>
                </div>

                {/* SNF Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-text-main">
                    <span>SNF Percentage (%)</span>
                    <span className="text-primary">{snf.toFixed(1)} %</span>
                  </div>
                  <input 
                    type="range" 
                    min="6.0" 
                    max="11.0" 
                    step="0.1"
                    value={snf} 
                    onChange={(e) => setSnf(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-xs text-text-muted font-semibold">
                    <span>6.0%</span>
                    <span>11.0%</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full md:w-auto px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-[#0b6b49] transition-all shadow-premium-md hover:shadow-premium-lg flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing UPI Dispatch...</span>
                  </>
                ) : (
                  <>
                    <span>Simulate Instant Payment</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Interactive Phone mockup */}
            <div className="md:col-span-6 flex justify-center">
              <div className="relative w-[320px] h-[640px] rounded-[42px] border-[10px] border-text-main bg-white shadow-premium-lg overflow-hidden flex flex-col">
                {/* Speaker and notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-text-main rounded-b-2xl z-40 flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                </div>

                {/* Phone screen content */}
                <div className="flex-1 flex flex-col bg-[#F3F4F6] relative pt-8 p-4 z-10 overflow-hidden">
                  
                  {/* Notifications Overlay (Animated) */}
                  <AnimatePresence>
                    {showNotification && (
                      <motion.div
                        initial={{ opacity: 0, y: -80, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute top-4 left-3 right-3 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-primary/20 z-50 flex items-start space-x-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-primary">3T Payment Success</span>
                            <span className="text-[10px] text-text-muted">Just Now</span>
                          </div>
                          <p className="text-xs font-semibold text-text-main mt-1">
                            ₹{total.toLocaleString("en-IN")} credited!
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5 leading-tight">
                            Rate: ₹{rate.toFixed(2)}/L for {weight.toFixed(2)}L (FAT: {fat}%, SNF: {snf}%).
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* WhatsApp Message Simulation (Animated) */}
                  <AnimatePresence>
                    {showNotification && (
                      <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="absolute bottom-6 left-3 right-3 bg-[#E2F0D9] rounded-xl p-3 shadow-md border border-[#C5E0B4] z-30"
                      >
                        <div className="flex items-center space-x-2 text-green-700 text-[10px] font-bold">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Receipt</span>
                        </div>
                        <p className="text-xs text-gray-800 font-medium mt-1 leading-snug">
                          Hello Ramesh Kadam, your milk payment has been settled successfully.<br />
                          🥛 <b>{weight.toFixed(2)} L</b><br />
                          💰 Rate: <b>₹{rate.toFixed(2)}/L</b><br />
                          💵 Total Paid: <b>₹{total.toLocaleString("en-IN")}</b><br />
                          UTR: <b>3T89182390</b>. Thank you for choosing 3T!
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Simulated Receipt inside App */}
                  <div className="flex-1 bg-white rounded-2xl p-4 flex flex-col justify-between border border-border-light shadow-sm">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-border-light">
                        <div>
                          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Receipt Details</span>
                          <span className="text-xs font-bold text-text-main">3T Station #B-01</span>
                        </div>
                        <div className="px-2 py-0.5 rounded-full bg-primary-light text-primary font-bold text-[9px] uppercase">
                          Live Scan
                        </div>
                      </div>

                      <div className="py-4 space-y-3">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-text-muted">Farmer ID</span>
                          <span className="text-text-main font-bold">F-101</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-text-muted">Weight (Liters)</span>
                          <span className="text-text-main font-bold">{weight.toFixed(2)} L</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-text-muted">FAT Percentage</span>
                          <span className="text-text-main font-bold">{fat.toFixed(1)} %</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-text-muted">SNF Percentage</span>
                          <span className="text-text-main font-bold">{snf.toFixed(1)} %</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium pt-2 border-t border-border-light">
                          <span className="text-text-muted">Rate / Liter</span>
                          <span className="text-text-main font-bold">₹{rate.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-light">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-text-muted">Net Payout</span>
                        <span className="text-lg font-extrabold text-primary">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      
                      <div className={`w-full py-2.5 rounded-xl flex items-center justify-center space-x-2 text-xs font-bold transition-all duration-300 ${
                        showNotification 
                          ? "bg-primary text-white" 
                          : isSimulating 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-gray-100 text-text-muted"
                      }`}>
                        {isSimulating ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : showNotification ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>Payment Credited</span>
                          </>
                        ) : (
                          <span>Awaiting Collection</span>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-text-main tracking-tight">Frequently Asked Questions</h2>
            <p className="text-text-muted mt-4 font-medium">Have questions? We have answers to help you understand our network.</p>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "How does 3T process payments so quickly?",
                a: "3T integrates directly with partner banks via unified payment gateways. Once the milk weight and quality scores are digitized on the collection scale, our automated payment engine instantly generates a credit request via UPI and IMPS, putting funds in the farmer's account within minutes."
              },
              {
                q: "Is there any charge for farmers to use 3T?",
                a: "No, farmers do not pay any transaction or membership fees. The settlement infrastructure is provided free of charge. The system is funded by our partner diaries and processing centers to improve supply reliability."
              },
              {
                q: "What variables determine the milk pricing?",
                a: "Milk price is calculated transparently based on the weight, FAT percentage, and Solid-Not-FAT (SNF) parameters. The basic formula is configured at the regional collection branch and is visible to everyone in the digital log."
              }
            ].map((faq, index) => (
              <div key={index} className="p-6 bg-white rounded-2xl border border-border-light">
                <h4 className="text-base font-bold text-text-main">{faq.q}</h4>
                <p className="text-sm font-medium text-text-muted mt-2 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Interactive Process Video Modal */}
      <ProcessVideoPlayer isOpen={showVideo} onClose={() => setShowVideo(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-border-light py-16 z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          {/* Interactive Process Video Footer Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-primary-light via-brand-bg to-amber-50/40 border border-primary/20 flex flex-wrap items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shrink-0 shadow-md">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-main flex items-center gap-2">
                  <span>How 3T Works: Cow Milking to Bank Payment</span>
                  <span className="text-[10px] uppercase font-extrabold bg-primary text-white px-2 py-0.5 rounded-full">
                    Video Demo
                  </span>
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  Watch the complete 4-step workflow: Fresh Milking ➔ Smart Scan ➔ Rate Formula ➔ Instant Bank Settlement.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-primary/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Process Video</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/3t-logo.png" alt="3T Logo" className="h-9 w-auto max-w-[130px] object-contain drop-shadow-xs" />
              <span className="font-bold text-lg text-text-main">3T (Time To Time)</span>
            </div>
            <p className="text-xs font-semibold text-text-muted max-w-sm leading-relaxed">
              India&apos;s fastest and most transparent farmer payment network, connecting milk quality data straight to bank APIs.
            </p>
            <span className="text-xs text-text-muted font-medium pt-4 block">
              &copy; {new Date().getFullYear()} 3T Fintech Ltd. All rights reserved.
            </span>
          </div>
          
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4">Company</h5>
            <ul className="space-y-2 text-xs font-semibold text-text-muted">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/mission" className="hover:text-primary transition-colors">Our Mission</Link></li>
              <li><Link href="/helpdesk" className="hover:text-primary transition-colors font-bold text-emerald-700">Helpdesk & Support</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/press-kit" className="hover:text-primary transition-colors">Press Kit</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4">Solutions</h5>
            <ul className="space-y-2 text-xs font-semibold text-text-muted">
              <li><Link href="/solutions/farmers" className="hover:text-primary transition-colors">For Farmers</Link></li>
              <li><Link href="/solutions/dairies" className="hover:text-primary transition-colors">For Dairies</Link></li>
              <li><Link href="/solutions/bank-integrations" className="hover:text-primary transition-colors">Bank Integrations</Link></li>
              <li><Link href="/solutions/digital-weighing" className="hover:text-primary transition-colors">Digital Weighing</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-main mb-4">Legal</h5>
            <ul className="space-y-2 text-xs font-semibold text-text-muted">
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/security" className="hover:text-primary transition-colors">Security Standards</Link></li>
              <li><Link href="/legal/compliance" className="hover:text-primary transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
}
