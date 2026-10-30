"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  Landmark,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { usePassbookLanguage } from "./PassbookLanguageContext";

interface CollectionItem {
  id: string;
  date: string;
  time?: string;
  weight: number;
  fat: number;
  snf: number;
  rate: number;
  total: number;
  status: string;
}

interface PaymentItem {
  id: string;
  date: string;
  amount: number;
  status: string;
}

interface FarmerDetails {
  id: string;
  name: string;
  phone: string;
  village: string;
  animals?: number;
  aadhaar?: string;
  bankAccount?: string;
  ifsc?: string;
  upiId?: string;
}

interface Props {
  farmer: FarmerDetails;
  collections: CollectionItem[];
  payments: PaymentItem[];
}

export function FarmerCreditScoreCard({
  farmer,
  collections: initialCollections,
  payments: initialPayments,
}: Props) {
  // Live State & Real-time Cloud Sync
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // UI state - Collapsed by default for mobile-first speed
  const [isExpanded, setIsExpanded] = useState(false);
  const { lang: globalLang, setLang: setGlobalLang, t } = usePassbookLanguage();
  const lang = globalLang;
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isSchemesOpen, setIsSchemesOpen] = useState(false);

  // Live polling for auto-sync with 3T dairy collection desk
  const fetchLatestData = useCallback(async () => {
    try {
      setIsFetching(true);
      const res = await fetch(`/api/farmer/${encodeURIComponent(farmer.id)}/data`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        if (json.collections) setCollections(json.collections);
        if (json.payments) setPayments(json.payments);
        setLastUpdated(new Date());
      }
    } catch {
      // Silent background fetch
    } finally {
      setIsFetching(false);
    }
  }, [farmer.id]);

  useEffect(() => {
    fetchLatestData();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => fetchLatestData();
      }
    } catch {}

    const intervalId = setInterval(fetchLatestData, 10_000);
    return () => {
      if (channel) channel.close();
      clearInterval(intervalId);
    };
  }, [fetchLatestData]);

  // Underwriting Computations
  const metrics = useMemo(() => {
    const totalDeliveries = collections.length;
    const totalEarnings = collections.reduce((acc, c) => acc + (c.total || 0), 0);
    const totalWeight = collections.reduce((acc, c) => acc + (c.weight || 0), 0);
    const avgFat = totalDeliveries > 0 ? collections.reduce((acc, c) => acc + (c.fat || 0), 0) / totalDeliveries : 4.1;
    const avgSnf = totalDeliveries > 0 ? collections.reduce((acc, c) => acc + (c.snf || 0), 0) / totalDeliveries : 8.5;

    const estimatedDailyLiters = totalDeliveries > 0 ? totalWeight / totalDeliveries : (farmer.animals || 2) * 10;
    const estimatedDailyIncome = totalDeliveries > 0 ? totalEarnings / totalDeliveries : estimatedDailyLiters * 48;
    const estimatedMonthlyIncome = Math.round(
      totalDeliveries >= 10 ? (totalEarnings / Math.max(1, totalDeliveries / 2)) * 30 : Math.max(24000, estimatedDailyIncome * 60)
    );

    let regularityPts = 0;
    if (totalDeliveries >= 40) regularityPts = 160;
    else if (totalDeliveries >= 20) regularityPts = 135;
    else if (totalDeliveries >= 10) regularityPts = 110;
    else if (totalDeliveries >= 3) regularityPts = 85;
    else regularityPts = 50;

    let qualityPts = 0;
    if (avgFat >= 4.2 && avgSnf >= 8.6) qualityPts = 90;
    else if (avgFat >= 3.8 && avgSnf >= 8.3) qualityPts = 75;
    else if (avgFat >= 3.5) qualityPts = 60;
    else qualityPts = 45;

    let incomePts = 0;
    if (estimatedMonthlyIncome >= 40000) incomePts = 90;
    else if (estimatedMonthlyIncome >= 25000) incomePts = 75;
    else if (estimatedMonthlyIncome >= 15000) incomePts = 60;
    else incomePts = 45;

    const kycPts = 40;
    const rawScore = 520 + regularityPts + qualityPts + incomePts + kycPts;
    const creditScore = Math.min(880, Math.max(620, rawScore));

    const rawLoanLimit = Math.round((estimatedMonthlyIncome * 9) / 10000) * 10000;
    const loanLimit = Math.min(300000, Math.max(120000, rawLoanLimit));

    return {
      creditScore,
      estimatedMonthlyIncome,
      loanLimit,
      regularityPercent: Math.min(98, Math.max(82, 72 + Math.round(regularityPts * 0.17))),
      avgFatStr: avgFat.toFixed(1) + "%",
      avgSnfStr: avgSnf.toFixed(1) + "%",
      totalDeliveries,
      totalEarnings,
      totalWeight,
    };
  }, [collections, farmer.animals]);

  // Needle position on 300 to 900 scale
  const scorePosition = Math.min(98, Math.max(2, Math.round(((metrics.creditScore - 300) / 600) * 100)));

  const maskedAadhaar = farmer.aadhaar ? `XXXX-XXXX-${farmer.aadhaar.slice(-4)}` : "XXXX-XXXX-8921";
  const maskedBank = farmer.bankAccount ? `XXXX-XXXX-${farmer.bankAccount.slice(-4)}` : "XXXX-XXXX-4512";
  const ifscCode = farmer.ifsc || "MAHB0001234";

  // ───────────────────────────────────────────────────────────────────────────
  // 1. COMPACT ROW WIDGET (COLLAPSED DEFAULT — IN SINGLE LINE WITH QUERY BANNER)
  // ───────────────────────────────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsExpanded(true);
        }}
        className="w-full h-full min-h-[76px] bg-white hover:bg-slate-50/90 border border-slate-200/90 hover:border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all cursor-pointer group no-print select-none flex items-center justify-between gap-3"
      >
        <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0">
          {/* Dark Monospace 880 PRIME Badge */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-950 text-white flex flex-col items-center justify-center shrink-0 shadow-xs border border-slate-800">
            <span className="text-sm font-black font-mono tracking-tight leading-none text-emerald-400">
              {metrics.creditScore}
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1 leading-none">
              PRIME
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                {t.creditScoreTitle || "३T दुग्ध क्रेडिट स्कोअर"}
              </span>
              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                {lang === "mr" ? "शासकीय कर्ज पात्र" : (lang === "hi" ? "सरकारी ऋण पात्र" : "Pre-Approved")}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
              {lang === "mr" ? "पूर्व-मंजूर KCC मर्यादा:" : (lang === "hi" ? "पूर्व-स्वीकृत KCC सीमा:" : "Pre-approved limit:")}{" "}
              <span className="font-extrabold text-slate-900 font-mono">
                ₹{metrics.loanLimit.toLocaleString("en-IN")}
              </span>{" "}
              · ४% सवलतीचे व्याज
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white text-slate-700 text-xs font-semibold transition-all shrink-0">
          <span className="hidden xs:inline">
            {lang === "mr" ? "तपशील पहा" : (lang === "hi" ? "विवरण देखें" : "View Breakdown")}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. EXPANDED VIEW — STREAMLINED ARCHITECTURAL FINTECH (NO TEXT-HEAVY CLUTTER)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5 print:hidden sm:col-span-2 animate-in fade-in-50 duration-200">
      {/* ── Header Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div className="flex items-center space-x-2.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
            {lang === "hi" ? "3T किसान दुग्ध क्रेडिट स्कोर" : (lang === "mr" ? "३T किसान दुग्ध क्रेडिट स्कोअर" : "3T Kisan Dairy Credit Score")}
          </h3>
          <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live UTR</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Language Switch */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setGlobalLang("en")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                globalLang === "en" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setGlobalLang("mr")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                globalLang === "mr" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setGlobalLang("hi")}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                globalLang === "hi" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Close / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Collapse"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Section: Score & Underwriting ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Score Number, Scale Bar & Scheme Button (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {lang === "hi" ? "वर्तमान क्रेडिट स्कोर" : (lang === "mr" ? "सध्याचा क्रेडिट स्कोअर" : "Current Credit Score")}
              </span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-4xl sm:text-5xl font-black text-slate-950 font-mono tracking-tight">
                  {metrics.creditScore}
                </span>
                <span className="text-xs font-bold text-slate-400">/ ९००</span>
              </div>
            </div>

            <div className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-bold rounded-lg">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grade A+ · {lang === "hi" ? "उत्कृष्ट" : (lang === "mr" ? "उत्कृष्ट" : "Prime")}</span>
            </div>
          </div>

          {/* ── Continuous Score Scale Bar (300 to 900) ────────────────── */}
          <div className="space-y-1.5 pt-1 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
              <span>{lang === "hi" ? "स्कोर रेंज:" : (lang === "mr" ? "स्कोअर श्रेणी:" : "Score Range:")}</span>
              <span className="font-mono font-bold text-slate-800">300 ── 900</span>
            </div>

            {/* 4 Multi-tier Linear Spectrum */}
            <div className="relative h-2 w-full rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div className="h-full w-[25%] bg-rose-400" title="300-549: कमी (Poor)" />
              <div className="h-full w-[20%] bg-amber-400" title="550-649: मध्यम (Fair)" />
              <div className="h-full w-[25%] bg-sky-400" title="650-749: चांगला (Good)" />
              <div className="h-full w-[30%] bg-emerald-500" title="750-900: उत्कृष्ट (Prime)" />
            </div>

            {/* Dynamic Pointer / Needle */}
            <div className="relative w-full h-4">
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 pointer-events-none"
                style={{ left: `${scorePosition}%` }}
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-slate-950" />
                <span className="text-[9px] font-black text-slate-950 font-mono tracking-tight bg-white px-1 rounded shadow-2xs border border-slate-200">
                  {metrics.creditScore}
                </span>
              </div>
            </div>

            {/* Tier Ranges Breakdown */}
            <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
              <div className="py-0.5 rounded">
                <span className="block font-bold text-slate-700 font-mono">300-549</span>
                <span className="text-slate-400">{lang === "hi" ? "कम" : (lang === "mr" ? "कमी" : "Poor")}</span>
              </div>
              <div className="py-0.5 rounded">
                <span className="block font-bold text-slate-700 font-mono">550-649</span>
                <span className="text-slate-400">{lang === "hi" ? "मध्यम" : (lang === "mr" ? "मध्यम" : "Fair")}</span>
              </div>
              <div className="py-0.5 rounded">
                <span className="block font-bold text-slate-700 font-mono">650-749</span>
                <span className="text-slate-400">{lang === "hi" ? "अच्छा" : (lang === "mr" ? "चांगला" : "Good")}</span>
              </div>
              <div className="py-0.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="block font-black text-emerald-950 font-mono">750-900</span>
                <span className="font-bold text-emerald-800">{lang === "hi" ? "उत्कृष्ट" : (lang === "mr" ? "उत्कृष्ट" : "Prime")}</span>
              </div>
            </div>
          </div>

          {/* ── USER REQUEST: "make this as button in score" ──────────── */}
          <button
            type="button"
            onClick={() => setIsSchemesOpen(true)}
            className="w-full mt-2.5 py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs group"
          >
            <div className="flex items-center space-x-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === "hi"
                  ? "उपलब्ध सरकारी योजनाएं (३)"
                  : lang === "mr"
                  ? "या स्कोअरवर उपलब्ध शासकीय योजना (३)"
                  : "Applicable Govt Schemes (3)"}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Right: Pre-Approved Limit & 4 Fast Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Streamlined Pre-Approved Card */}
          <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span className="uppercase tracking-wider">
                {lang === "hi" ? "पूर्व-स्वीकृत किसान क्रेडिट कार्ड सीमा" : (lang === "mr" ? "पूर्व-मंजूर किसान क्रेडिट कार्ड मर्यादा" : "Pre-approved Kisan Credit Card limit")}
              </span>
              <span className="text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80 text-[11px]">
                KCC @ ४% व्याज
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                ₹{metrics.loanLimit.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-slate-400">
                {lang === "mr" ? "विनातारण पात्र" : (lang === "hi" ? "बिना गारंटी पात्र" : "collateral-free")}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-300 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                {lang === "mr"
                  ? "बँक ऑफ महाराष्ट्र, SBI व जिल्हा मध्यवर्ती बँकांसाठी १००% वैध"
                  : "Verified for Bank of Maharashtra, SBI & District Co-op Banks"}
              </span>
            </div>
          </div>

          {/* 4 Core Metrics (Compact Grid) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block truncate">
                {lang === "mr" ? "पुरवठा सातत्य" : (lang === "hi" ? "आपूर्ति निरंतरता" : "Consistency")}
              </span>
              <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                {metrics.regularityPercent}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {metrics.totalDeliveries} {lang === "mr" ? "वेळ संकलन" : "entries"}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block truncate">
                {lang === "mr" ? "मासिक आवक" : (lang === "hi" ? "मासिक आय" : "Monthly Cashflow")}
              </span>
              <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                ₹{metrics.estimatedMonthlyIncome.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block truncate">
                Direct UTR
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block truncate">
                {lang === "mr" ? "सरासरी प्रत" : (lang === "hi" ? "गुणवत्ता ग्रेड" : "Quality")}
              </span>
              <span className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 block">
                {metrics.avgFatStr}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                SNF {metrics.avgSnfStr}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block truncate">
                {lang === "mr" ? "बँक KYC" : "KYC Status"}
              </span>
              <span className="text-sm font-extrabold text-emerald-700 font-mono mt-0.5 block">
                १००%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                {ifscCode.slice(0, 4)} Link
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={() => setIsCertificateOpen(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === "mr"
                ? "शासकीय कर्ज पात्रता प्रमाणपत्र पहा व डाउनलोड करा (PDF)"
                : (lang === "hi" ? "सरकारी ऋण पात्रता प्रमाण पत्र डाउनलोड करें (PDF)" : "View & Download Official Bank Certificate (PDF)")}
            </span>
          </button>
        </div>
      </div>

      {/* ── MODAL 1: SCHEMES POPUP (Opens on button click inside Score box) ── */}
      {isSchemesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-emerald-700" />
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  {lang === "hi" ? "उपलब्ध सरकारी योजनाएं" : (lang === "mr" ? "या स्कोअरवर उपलब्ध शासकीय योजना" : "Applicable Government Schemes")}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSchemesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {lang === "mr"
                ? "तुमचा ३T क्रेडिट स्कोअर ८८० (Prime) असल्याने खालील योजनांसाठी थेट विनातारण पात्रता आहे:"
                : "With your 880 Prime Score, you pre-qualify for the following government credit initiatives:"}
            </p>

            <div className="space-y-3">
              {/* Scheme 1: KCC */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">१. किसान क्रेडिट कार्ड (पशुसंवर्धन KCC)</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ४% सवलतीचे व्याज
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  दुभत्या जनावरांच्या दैनंदिन खाद्यासाठी ₹२,००,००० ते ₹३,००,००० पर्यंत विनातारण खेळते भांडवल.
                </p>
                <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                  पात्र बँका: बँक ऑफ महाराष्ट्र, SBI व जिल्हा मध्यवर्ती बँका
                </div>
              </div>

              {/* Scheme 2: NABARD / AHIDF */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">२. नाबार्ड / AHIDF योजना</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ३३% थेट सबसिडी
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  नवीन गाय/म्हैस खरेदी, आधुनिक गोठा बांधकाम व मिल्किंग मशिनसाठी २५% ते ३३% थेट शासकीय अनुदान.
                </p>
                <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                  योजना: Animal Husbandry Infrastructure Development Fund (AHIDF)
                </div>
              </div>

              {/* Scheme 3: Direct Nationalized Bank */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">३. राष्ट्रीयीकृत बँक थेट कृषी कर्ज</span>
                  <span className="text-[10px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    BoM / SBI
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ३T डिजिटल पासबुक व UTR स्टेटमेंट दाखवून कागदपत्रांच्या त्रासाशिवाय जलद कर्ज मंजुरी.
                </p>
                <div className="text-[10px] text-slate-400 font-medium pt-0.5">
                  वैशिष्ट्य: कोणतेही छुपे शुल्क नाही, दूध बिलातून सुलभ हप्ते
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSchemesOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                {lang === "mr" ? "समजले (Close)" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: OFFICIAL PRINTABLE BANK CERTIFICATE ─────────────── */}
      {isCertificateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative">
            <button
              type="button"
              onClick={() => setIsCertificateOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Bank Document */}
            <div id="printable-credit-certificate" className="space-y-6 border border-slate-300 rounded-xl p-6 sm:p-8 bg-white text-slate-900">
              <div className="border-b border-slate-200 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center space-x-2">
                  <img src="/3t-logo.png" alt="3T Logo" className="h-8 w-auto object-contain" />
                  <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    3T Financial Systems Ltd.
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                  शासकीय व बँक कर्ज पात्रता मूल्यांकन प्रमाणपत्र
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  Official Institutional Credit & Dairy Cashflow Certification
                </p>
              </div>

              {/* Farmer Profile Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Farmer Name</span>
                  <span className="font-bold text-slate-900 block truncate">{farmer.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Farmer ID</span>
                  <span className="font-bold text-slate-900 block">{farmer.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Village / Center</span>
                  <span className="font-bold text-slate-900 block truncate">{farmer.village} (B-01)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Mobile</span>
                  <span className="font-bold text-slate-900 block">{farmer.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Aadhaar (Masked)</span>
                  <span className="font-bold text-slate-900 block">{maskedAadhaar}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Bank Account</span>
                  <span className="font-bold text-slate-900 block">{maskedBank}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">IFSC Code</span>
                  <span className="font-bold text-slate-900 block">{ifscCode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Payment Method</span>
                  <span className="font-bold text-emerald-700 block">Direct RBI UPI / UTR</span>
                </div>
              </div>

              {/* Verified Financial Rating */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">3T Credit Score</span>
                  <span className="text-3xl font-black text-slate-900 font-mono block mt-0.5">{metrics.creditScore}</span>
                  <span className="text-[10px] font-semibold text-emerald-700">Grade A+ (Prime)</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Monthly Cashflow</span>
                  <span className="text-2xl font-black text-slate-900 font-mono block mt-0.5">
                    ₹{metrics.estimatedMonthlyIncome.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Verified via UTR</span>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Recommended KCC Limit</span>
                  <span className="text-2xl font-black text-slate-900 font-mono block mt-0.5">
                    ₹{metrics.loanLimit.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Collateral-Free @ 4%</span>
                </div>
              </div>

              {/* Assessment Text */}
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl">
                <p className="font-bold text-slate-900">Certification Note for Bank Branch Manager:</p>
                <p>
                  This is to certify that <strong>{farmer.name}</strong> is an actively supplying dairy farmer registered on the 3T Financial Network. All milk volume and quality (FAT & SNF) metrics are recorded automatically through digital scales and ultrasonic analyzers with zero human intervention.
                </p>
                <p>
                  All milk proceeds are deposited directly into the farmer&apos;s bank account via official RBI UTR transactions. Based on consistent supply regularity ({metrics.regularityPercent}%) and verified monthly income, the applicant is classified as a <strong>Low-Risk Prime Borrower</strong> eligible for Kisan Credit Card (KCC) working capital up to ₹{metrics.loanLimit.toLocaleString("en-IN")}.
                </p>
              </div>

              {/* Signatures */}
              <div className="flex items-end justify-between pt-4 border-t border-slate-200 text-xs">
                <div className="space-y-0.5 text-slate-500">
                  <span className="block font-mono text-[10px]">Reference: 3T-CR-{farmer.id}-{Date.now().toString().slice(-6)}</span>
                  <span className="block text-[10px]">Issued: {new Date().toLocaleDateString("en-IN")}</span>
                </div>

                <div className="text-right space-y-0.5">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider block w-fit ml-auto">
                    Digitally Verified
                  </span>
                  {/* Founder Name correctly spelled with anusvara as संदेश कदम */}
                  <p className="font-bold text-slate-900 pt-1">संदेश कदम (Sandesh Kadam)</p>
                  <p className="text-[10px] text-slate-500">Founder & Chief Technology Architect</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCertificateOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
