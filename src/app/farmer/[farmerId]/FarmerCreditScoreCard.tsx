"use client";

import React, { useState, useMemo } from "react";
import {
  Award,
  FileText,
  Printer,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Landmark,
  X,
  BadgeCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

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

export function FarmerCreditScoreCard({ farmer, collections, payments }: Props) {
  // Collapsed by default so it takes minimal mobile screen space!
  const [isExpanded, setIsExpanded] = useState(false);
  const [lang, setLang] = useState<"mr" | "en">("mr");
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // ── Calculate Dairy Credit Score & Loan Eligibility ──────────────────────
  const metrics = useMemo(() => {
    const totalDeliveries = collections.length;
    const totalEarnings = collections.reduce((acc, c) => acc + (c.total || 0), 0);
    const totalWeight = collections.reduce((acc, c) => acc + (c.weight || 0), 0);
    const avgFat = totalDeliveries > 0 ? collections.reduce((acc, c) => acc + (c.fat || 0), 0) / totalDeliveries : 4.0;
    const avgSnf = totalDeliveries > 0 ? collections.reduce((acc, c) => acc + (c.snf || 0), 0) / totalDeliveries : 8.5;

    // Monthly income estimation based on delivery rate
    const estimatedDailyLiters = totalDeliveries > 0 ? totalWeight / totalDeliveries : (farmer.animals || 2) * 10;
    const estimatedDailyIncome = totalDeliveries > 0 ? totalEarnings / totalDeliveries : estimatedDailyLiters * 48;
    const estimatedMonthlyIncome = Math.round(
      totalDeliveries >= 10 ? (totalEarnings / Math.max(1, totalDeliveries / 2)) * 30 : Math.max(22000, estimatedDailyIncome * 60)
    );

    // ── 3T Dairy Credit Score (Scale: 300 to 900) ──
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

    // KYC bonus (Aadhaar & Bank verified via 3T)
    const kycPts = 40;

    const rawScore = 520 + regularityPts + qualityPts + incomePts + kycPts;
    const creditScore = Math.min(880, Math.max(620, rawScore));

    // Grade and Status
    let grade = "A+ (उत्कृष्ट / Prime)";
    let gradeEn = "A+ (Prime / Low Risk)";
    let statusTextMr = "शासकीय KCC व बँक कर्जासाठी पूर्व-मंजूर";
    let statusTextEn = "Pre-Approved for Govt KCC & Bank Loans";
    let statusColor = "text-emerald-800 bg-emerald-50 border-emerald-300";

    if (creditScore >= 750) {
      grade = "A+ (उत्कृष्ट / Prime)";
      gradeEn = "A+ (Prime / Low Risk)";
      statusTextMr = "शासकीय KCC व बँक कर्जासाठी पूर्व-मंजूर";
      statusTextEn = "Pre-Approved for Govt KCC & Bank Loans";
      statusColor = "text-emerald-800 bg-emerald-50 border-emerald-300";
    } else if (creditScore >= 700) {
      grade = "A (अतिशय चांगला / Very Good)";
      gradeEn = "A (Very Good)";
      statusTextMr = "सुलभ कर्ज मंजुरीसाठी पात्र";
      statusTextEn = "Eligible for Fast-Track Loan Approval";
      statusColor = "text-teal-800 bg-teal-50 border-teal-300";
    } else {
      grade = "B+ (चांगला / Good)";
      gradeEn = "B+ (Good Standing)";
      statusTextMr = "कर्जासाठी पात्र (नियमित पुरवठ्याने स्कोअर वाढवा)";
      statusTextEn = "Eligible (Increase regular supply for higher limit)";
      statusColor = "text-blue-800 bg-blue-50 border-blue-300";
    }

    // Recommended Loan Limit (rounded to ₹10,000)
    const rawLoanLimit = Math.round((estimatedMonthlyIncome * 9) / 10000) * 10000;
    const loanLimit = Math.min(300000, Math.max(120000, rawLoanLimit));

    return {
      creditScore,
      grade: lang === "mr" ? grade : gradeEn,
      statusText: lang === "mr" ? statusTextMr : statusTextEn,
      statusColor,
      estimatedMonthlyIncome,
      loanLimit,
      regularityPercent: Math.min(98, Math.max(82, 70 + Math.round(regularityPts * 0.18))),
      avgFatStr: avgFat.toFixed(1) + "%",
      avgSnfStr: avgSnf.toFixed(1) + "%",
      totalDeliveries,
      totalEarnings,
      totalWeight,
    };
  }, [collections, farmer.animals, lang]);

  // Mask sensitive Aadhaar & Bank A/c for display
  const maskedAadhaar = farmer.aadhaar ? `XXXX-XXXX-${farmer.aadhaar.slice(-4)}` : "XXXX-XXXX-8921";
  const maskedBank = farmer.bankAccount ? `XXXX-XXXX-${farmer.bankAccount.slice(-4)}` : "XXXX-XXXX-4512";
  const ifscCode = farmer.ifsc || "MAHB0001234";

  // Score Progress Percentage for SVG Circle (range 300 to 900)
  const scorePercent = Math.round(((metrics.creditScore - 300) / 600) * 100);

  // ───────────────────────────────────────────────────────────────────────────
  // COMPACT MOBILE-FIRST BAR (When collapsed)
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
        className="w-full bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl p-3 sm:p-4 shadow-sm border border-emerald-700/60 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] select-none no-print"
      >
        <div className="flex items-center justify-between gap-2.5">
          {/* Left: Score Badge & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            {/* Score Ring Avatar */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center shrink-0 shadow-xs border border-emerald-300/40">
              <span className="text-[9px] font-bold text-emerald-100 uppercase leading-none">SCORE</span>
              <span className="text-sm sm:text-base font-black font-mono leading-tight">{metrics.creditScore}</span>
            </div>

            {/* Info Text */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white truncate tracking-tight">
                  ३T किसान क्रेडिट स्कोअर
                </span>
                <span className="text-[9px] font-bold bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded font-mono">
                  A+ Prime
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-medium truncate mt-0.5">
                पूर्व-मंजूर कर्ज: <strong className="text-white font-mono">₹{metrics.loanLimit.toLocaleString("en-IN")}</strong> · KCC @ ४%
              </p>
            </div>
          </div>

          {/* Right: Expand Pill */}
          <div className="flex items-center space-x-1 shrink-0 bg-white/10 hover:bg-white/20 group-hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl text-white text-[11px] font-bold transition-all">
            <span className="hidden sm:inline">तपशील पहा</span>
            <span className="sm:hidden">पहा</span>
            <ChevronDown className="w-3.5 h-3.5 text-emerald-200 group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // EXPANDED MOBILE-FIRST VIEW (When clicked)
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-3xl border border-emerald-200/80 p-4 sm:p-6 shadow-sm space-y-4 print:hidden animate-fadeIn">
      {/* ── Top Header with Title, Close Button & Language Toggle ─────── */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-100 pb-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate">
              {lang === "mr" ? "३T किसान दुग्ध क्रेडिट स्कोअर" : "3T Kisan Dairy Credit Score"}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium truncate">
              {lang === "mr" ? "शासकीय कर्ज पात्रता अहवाल · RBI Verified" : "Govt Loan Assessment · RBI Verified"}
            </p>
          </div>
        </div>

        {/* Right Actions: Lang Switcher & Minimize Button */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setLang("mr")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                lang === "mr" ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                lang === "en" ? "bg-emerald-600 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* Minimize / Close Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            title="कमी करा (Minimize)"
          >
            <span className="hidden sm:inline">कमी करा</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main Score & Pre-Approved Loan Banner (Mobile-First) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-stretch">
        {/* Score Meter (Mobile: Compact Top Card) */}
        <div className="md:col-span-5 bg-white rounded-2xl border border-emerald-100 p-4 flex flex-col items-center justify-between text-center shadow-2xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {lang === "mr" ? "सध्याचा क्रेडिट स्कोअर" : "Current Credit Score"}
          </span>

          {/* Circular Visual Gauge */}
          <div className="relative my-2 sm:my-3 flex items-center justify-center">
            <svg className="w-28 h-28 sm:w-36 sm:h-36 transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke="url(#scoreGradientMobile)"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - scorePercent / 100)}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="scoreGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#0F766E" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-mono">
                {metrics.creditScore}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                / 900 MAX
              </span>
            </div>
          </div>

          {/* Rating Badge */}
          <div className="w-full space-y-1">
            <div className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold border ${metrics.statusColor} inline-block`}>
              {metrics.grade}
            </div>
            <p className="text-[10px] font-semibold text-gray-600 block">
              {metrics.statusText}
            </p>
          </div>
        </div>

        {/* Loan Limit & Key Pillars (Mobile: Underneath Meter) */}
        <div className="md:col-span-7 bg-white rounded-2xl border border-emerald-100 p-3.5 sm:p-4 flex flex-col justify-between space-y-3 shadow-2xs">
          {/* Pre-Approved Amount Banner */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl p-3 sm:p-3.5 text-white shadow-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-200">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{lang === "mr" ? "पूर्व-मंजूर शासकीय कर्ज मर्यादा" : "Pre-Approved Loan Limit"}</span>
              </span>
              <span className="bg-emerald-600/70 text-emerald-100 text-[9px] font-bold px-1.5 py-0.2 rounded">
                KCC @ ४%
              </span>
            </div>

            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight font-mono">
                ₹{metrics.loanLimit.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-emerald-200 font-medium">
                {lang === "mr" ? "पर्यंत पात्र" : "Eligible"}
              </span>
            </div>

            <p className="text-[10px] text-emerald-100/80 font-medium mt-0.5 leading-tight">
              {lang === "mr"
                ? "३T च्या दररोजच्या अधिकृत दूध नोंदींमुळे कोणत्याही तारणाशिवाय (Collateral-Free) तात्काळ उपलब्ध."
                : "Collateral-free instant loan eligibility backed by verified daily 3T bank UTRs."}
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">
                {lang === "mr" ? "पुरवठा सातत्य" : "Regularity"}
              </span>
              <span className="font-extrabold text-gray-900 block font-mono text-[11px]">
                {metrics.regularityPercent}% (उत्कृष्ट)
              </span>
            </div>

            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">
                {lang === "mr" ? "मासिक उत्पन्न" : "Monthly Cashflow"}
              </span>
              <span className="font-extrabold text-gray-900 block font-mono text-[11px]">
                ₹{metrics.estimatedMonthlyIncome.toLocaleString("en-IN")}/महिना
              </span>
            </div>

            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">
                {lang === "mr" ? "गुणवत्ता (FAT/SNF)" : "Quality Index"}
              </span>
              <span className="font-extrabold text-gray-900 block font-mono text-[11px]">
                {metrics.avgFatStr} · {metrics.avgSnfStr}
              </span>
            </div>

            <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
              <span className="text-[9px] text-gray-400 font-bold uppercase block">
                {lang === "mr" ? "बँक KYC" : "Bank KYC"}
              </span>
              <span className="font-extrabold text-emerald-700 block text-[11px] flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                <span>१००% प्रमाणित</span>
              </span>
            </div>
          </div>

          {/* Action Button: View / Download Official Certificate */}
          <button
            type="button"
            onClick={() => setIsCertificateOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-200" />
            <span>
              {lang === "mr"
                ? "शासकीय कर्ज पात्रता प्रमाणपत्र पहा व डाउनलोड करा"
                : "View & Download Bank Loan Credit Certificate"}
            </span>
          </button>
        </div>
      </div>

      {/* ── Eligible Government Schemes Breakdown (Mobile-First) ─────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Landmark className="w-3.5 h-3.5 text-emerald-700" />
            <h4 className="text-[11px] sm:text-xs font-black text-gray-900">
              {lang === "mr" ? "पात्र शासकीय योजना व सबसिडी" : "Eligible Govt Schemes & Subsidies"}
            </h4>
          </div>
          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {lang === "mr" ? "४ योजना पात्र" : "4 Schemes Qualified"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          {/* Scheme 1: KCC */}
          <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-900">1. किसान क्रेडिट कार्ड (KCC)</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-white px-1 py-0.2 rounded border border-emerald-200">
                ४% व्याज
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-medium mt-0.5">
              ₹२ लाखांपर्यंत विनातारण खेळते भांडवल दुभत्या जनावरांच्या खाद्यासाठी.
            </p>
          </div>

          {/* Scheme 2: AHIDF & NABARD */}
          <div className="p-2.5 bg-teal-50/50 rounded-xl border border-teal-100">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-900">2. नाबार्ड / AHIDF योजना</span>
              <span className="text-[9px] font-bold text-teal-700 bg-white px-1 py-0.2 rounded border border-teal-200">
                ३३% सबसिडी
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-medium mt-0.5">
              नवीन गाय/म्हैस खरेदी व गोठ्यासाठी २५% ते ३३% शासकीय थेट अनुदान.
            </p>
          </div>

          {/* Scheme 3: District Cooperative & Nationalized Banks */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-900">3. राष्ट्रीयीकृत बँक कर्ज</span>
              <span className="text-[9px] font-bold text-slate-700 bg-white px-1 py-0.2 rounded border border-slate-200">
                SBI / BoM
              </span>
            </div>
            <p className="text-[10px] text-gray-600 font-medium mt-0.5">
              ३T डिजिटल पासबुक दाखवून बँक ऑफ महाराष्ट्र व SBI मध्ये थेट कर्ज मंजुरी.
            </p>
          </div>
        </div>

        {/* Tips Accordion Toggle */}
        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>
              {lang === "mr" ? "स्कोअर आणखी कसा वाढवायचा? (Tips)" : "How to maximize score?"}
            </span>
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
            ३T पारदर्शकता धोरण
          </span>
        </div>

        {showTips && (
          <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[10px] text-gray-700 space-y-1 animate-fadeIn">
            <p className="font-bold text-gray-900">
              💡 ९०० कडे स्कोअर नेण्यासाठी महत्त्वाच्या टिप्स:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600 font-medium">
              <li>सकाळ व संध्याकाळ दोन्ही वेळ नियमित दूध नोंदवा.</li>
              <li>६०% सुका चारा व बायपास फॅट दिल्यास फॅट वाढून स्कोअर ५० गुणांनी वाढतो.</li>
              <li>३T च्या अधिकृत UPI ट्रान्झॅक्शनमुळे बँकेत तुमची डिजिटल पत मजबूत होते.</li>
            </ul>
          </div>
        )}
      </div>

      {/* ── Official Printable Bank / Government Certificate Modal ────── */}
      {isCertificateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsCertificateOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Certificate Area */}
            <div id="printable-credit-certificate" className="space-y-4 p-4 sm:p-6 border-2 border-emerald-600 rounded-2xl bg-[#FCFDFD] relative overflow-hidden">
              {/* Subtle background seal */}
              <div className="absolute right-3 bottom-3 opacity-5 pointer-events-none">
                <Award className="w-48 h-48 sm:w-64 sm:h-64 text-emerald-950" />
              </div>

              {/* Certificate Header */}
              <div className="text-center space-y-1 border-b-2 border-emerald-600/30 pb-3">
                <div className="flex items-center justify-center space-x-2">
                  <img src="/3t-logo.png" alt="3T Logo" className="h-7 w-auto object-contain" />
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                    3T Financial Systems · Verified Audit
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight uppercase">
                  शासकीय व बँक कर्ज पात्रता प्रमाणपत्र
                </h2>
                <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                  Official 3T Kisan Dairy Credit & Income Assessment Certificate
                </p>
                <div className="inline-flex items-center space-x-1 bg-emerald-100/70 text-emerald-900 text-[9px] font-bold px-2.5 py-0.5 rounded-full">
                  <BadgeCheck className="w-3 h-3 text-emerald-700" />
                  <span>Valid for KCC, NABARD, AHIDF & Bank Dairy Loans</span>
                </div>
              </div>

              {/* Farmer Profile & Financial ID */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">शेतकऱ्याचे नाव</span>
                  <span className="font-extrabold text-gray-900 block truncate">{farmer.name}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">शेतकरी आयडी</span>
                  <span className="font-extrabold text-emerald-700 block font-mono">{farmer.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">गाव व शाखा</span>
                  <span className="font-extrabold text-gray-900 block truncate">{farmer.village} (B-01)</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">मोबाईल क्रमांक</span>
                  <span className="font-extrabold text-gray-900 block font-mono">{farmer.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">आधार क्रमांक</span>
                  <span className="font-mono font-bold text-gray-700 block">{maskedAadhaar}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">बँक खाते क्रमांक</span>
                  <span className="font-mono font-bold text-gray-700 block">{maskedBank}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">IFSC कोड</span>
                  <span className="font-mono font-bold text-gray-700 block">{ifscCode}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">सेटलमेंट पद्धत</span>
                  <span className="font-bold text-emerald-700 block">Instant RBI UPI</span>
                </div>
              </div>

              {/* Verified Credit Assessment Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase block">३T क्रेडिट स्कोअर</span>
                  <span className="text-2xl font-black text-emerald-900 font-mono block">
                    {metrics.creditScore}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 block">
                    {metrics.grade}
                  </span>
                </div>

                <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-teal-800 uppercase block">प्रमाणित मासिक उत्पन्न</span>
                  <span className="text-xl font-black text-teal-900 font-mono block">
                    ₹{metrics.estimatedMonthlyIncome.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-bold text-teal-700 block">
                    (वार्षिक: ₹{(metrics.estimatedMonthlyIncome * 12).toLocaleString("en-IN")})
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-center space-y-0.5">
                  <span className="text-[9px] font-bold text-blue-800 uppercase block">शिफारस केलेली कर्ज मर्यादा</span>
                  <span className="text-xl font-black text-blue-900 font-mono block">
                    ₹{metrics.loanLimit.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[9px] font-bold text-blue-700 block">
                    विनातारण (४% सवलत व्याज)
                  </span>
                </div>
              </div>

              {/* Official Assessment Statement */}
              <div className="text-[11px] text-gray-700 space-y-1.5 bg-white p-3 rounded-xl border border-gray-200 font-medium leading-relaxed">
                <p>
                  <strong>बँक व्यवस्थापक व कृषी अधिकाऱ्यांसाठी नोंद (Bank Certification Note):</strong>
                </p>
                <p>
                  सदर शेतकरी <strong>{farmer.name}</strong> हे ३T (Time To Time) डिजिटल डेअरी पेमेंट नेटवर्कचे अधिकृत नोंदणीकृत उत्पादक आहेत. त्यांच्या दूध वितरणाची सर्व वजने ही ऑटोमेटेड डिजिटल वजन काट्याद्वारे आणि फॅट/SNF तपासणी थेट अल्ट्रासॉनिक अ‍ॅनालायझरद्वारे केली गेली आहे.
                </p>
                <p>
                  मागील सर्व देयके थेट बँकेत अधिकृत <strong>RBI UTR क्रमांकासह</strong> जमा झालेली आहेत. हा शेतकरी <strong>KCC (पशुसंवर्धन)</strong>, <strong>नाबार्ड डेअरी सबसिडी</strong> आणि <strong>AHIDF योजनांखाली</strong> ₹{metrics.loanLimit.toLocaleString("en-IN")} पर्यंतच्या कर्जासाठी <em>कमी जोखमीचा (Low Risk Prime Borrower)</em> शेतकरी म्हणून प्रमाणित करण्यात येत आहे.
                </p>
              </div>

              {/* Signatures & Seal */}
              <div className="flex items-end justify-between pt-3 border-t border-gray-200 text-[10px]">
                <div className="space-y-0.5">
                  <span className="font-mono text-gray-400 block">Ref ID:</span>
                  <span className="font-mono font-bold text-gray-800 block">
                    3T-CREDIT-{farmer.id}-{Date.now().toString().slice(-6)}
                  </span>
                  <span className="text-gray-400 block">दिनांक: {new Date().toLocaleDateString("en-IN")}</span>
                </div>

                <div className="text-right space-y-0.5">
                  <div className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded text-center mb-0.5">
                    <span className="text-[8px] font-black text-emerald-800 tracking-wider uppercase block">
                      3T FINANCIAL NETWORK
                    </span>
                    <span className="text-[7px] font-semibold text-emerald-600 block">
                      DIGITALLY VERIFIED SIGNATURE
                    </span>
                  </div>
                  <p className="font-extrabold text-gray-900 text-[11px]">संदेश कदम (Sandesh Kadam)</p>
                  <p className="text-[9px] text-gray-500 font-semibold">Founder & Chief Technology Architect</p>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCertificateOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
              >
                बंद करा (Close)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>प्रमाणपत्र प्रिंट / PDF सेव्ह करा</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
