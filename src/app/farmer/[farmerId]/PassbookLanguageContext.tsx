"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Globe } from "lucide-react";

export type PassbookLang = "en" | "mr" | "hi";

export interface Translations {
  // Header
  officialPassbook: string;
  ledgerTitle: string;
  ledgerSubtitle: string;
  logout: string;
  language: string;
  addToPhone: string;
  addToDesktop: string;
  appInstalled: string;

  // Support / Query
  supportTag: string;
  supportQueryTitle: string;
  supportQuerySubtitle: string;
  raiseQueryBtn: string;

  // Credit Score
  creditScoreTitle: string;
  newFeature: string;
  creditScoreSubtitle: string;
  checkBtn: string;
  closeBtn: string;

  // Farmer Profile
  bankVerified: string;

  // Summary Cards
  totalMilkVolume: string;
  filteredMilkVolume: string;
  deliveries: string;
  delivery: string;
  totalSettledOutflow: string;
  periodSettled: string;
  directUpiCredited: string;
  noPayoutsYet: string;
  avgFat: string;
  qualityStandard: string;
  noMilkTested: string;
  avgSnf: string;
  liveQualityIndex: string;

  // Search & Period
  searchPlaceholder: string;
  allMonths: string;
  tenDayCycles: string;
  allDays: string;
  cycle1: string;
  cycle1Sub: string;
  cycle2: string;
  cycle2Sub: string;
  cycle3: string;
  cycle3Sub: string;
  resetFilters: string;

  // Table
  intakeHistory: string;
  records: string;
  updated: string;
  verifiedBadge: string;
  thDate: string;
  thShift: string;
  thVolume: string;
  thFat: string;
  thSnf: string;
  thRate: string;
  thPayout: string;
  thStatus: string;
  morning: string;
  evening: string;
  credited: string;
  payoutLabel: string;
  noRecordsMatch: string;
  showAllRecords: string;

  // Footer
  footerCopyright: string;
  footerPowered: string;
}

export const PASSBOOK_TRANSLATIONS: Record<PassbookLang, Translations> = {
  en: {
    officialPassbook: "Official Digital Farmer Passbook",
    ledgerTitle: "Village Milk Co-Operative Ledger",
    ledgerSubtitle: "Central Collection Center B-01 · Instant UPI Settlement Network",
    logout: "Logout",
    language: "Language",
    addToPhone: "📲 Add to Phone",
    addToDesktop: "💻 Add to Desktop",
    appInstalled: "Passbook App Installed",

    supportTag: "Support & Queries",
    supportQueryTitle: "Payment or Technical Issue?",
    supportQuerySubtitle: "No email needed — register complaint directly to dairy manager's dashboard",
    raiseQueryBtn: "Raise Query",

    creditScoreTitle: "Govt Loan Eligibility & 3T Credit Score",
    newFeature: "New Feature",
    creditScoreSubtitle: "Click here to assess loan eligibility and financial credit score",
    checkBtn: "Check",
    closeBtn: "Close",

    bankVerified: "Bank & UPI Verified",

    totalMilkVolume: "Total Milk Volume",
    filteredMilkVolume: "Filtered Milk Volume",
    deliveries: "Deliveries",
    delivery: "Delivery",
    totalSettledOutflow: "Total Settled Outflow",
    periodSettled: "Period Settled",
    directUpiCredited: "Direct UPI Credited",
    noPayoutsYet: "No Payouts Yet",
    avgFat: "Average FAT%",
    qualityStandard: "Quality Standard",
    noMilkTested: "No Milk Tested",
    avgSnf: "Average SNF%",
    liveQualityIndex: "Live Quality Index",

    searchPlaceholder: "Search by date (YYYY-MM-DD), shift, FAT%, rate, or UTR...",
    allMonths: "📅 All Months",
    tenDayCycles: "10-Day Cycles:",
    allDays: "All Days",
    cycle1: "1st – 10th",
    cycle1Sub: "(Cycle 1)",
    cycle2: "11th – 20th",
    cycle2Sub: "(Cycle 2)",
    cycle3: "21st – End",
    cycle3Sub: "(Cycle 3)",
    resetFilters: "Reset Filters",

    intakeHistory: "Milk Intake & Payout History",
    records: "Records",
    updated: "Updated",
    verifiedBadge: "3T-PASSBOOK-VERIFIED",
    thDate: "Date",
    thShift: "Shift",
    thVolume: "Volume (L)",
    thFat: "FAT%",
    thSnf: "SNF%",
    thRate: "Rate (₹/L)",
    thPayout: "Payout (₹)",
    thStatus: "Status / UTR",
    morning: "☀️ Morning",
    evening: "🌙 Evening",
    credited: "CREDITED",
    payoutLabel: "Payout:",
    noRecordsMatch: "No milk delivery records match your selected 10-day period or search.",
    showAllRecords: "Show All Records",

    footerCopyright: "3T Dairy Payment Network · Verified Digital Passbook System",
    footerPowered: "Powered by 3T Instant UPI Settlement Gateway",
  },
  mr: {
    officialPassbook: "अधिकृत डिजिटल शेतकरी पासबुक",
    ledgerTitle: "गाव दूध सहकारी संस्था खातेवही",
    ledgerSubtitle: "मध्यवर्ती संकलन केंद्र B-01 · झटपट UPI सेटलमेंट नेटवर्क",
    logout: "बाहेर पडा",
    language: "भाषा",
    addToPhone: "📲 मोबाईलवर ॲप जोडा",
    addToDesktop: "💻 संगणकावर जोडा",
    appInstalled: "पासबुक ॲप इन्स्टॉल केले आहे",

    supportTag: "मदत व तक्रार निवारण",
    supportQueryTitle: "पेमेंट किंवा तांत्रिक अडचण आहे का?",
    supportQuerySubtitle: "ई-मेलची गरज नाही — तक्रार थेट डेअरी मॅनेजरच्या डॅशबोर्डवर नोंदवा",
    raiseQueryBtn: "तक्रार नोंदवा",

    creditScoreTitle: "शासकीय कर्ज पात्रता व ३T क्रेडिट स्कोअर",
    newFeature: "नवीन सुविधा",
    creditScoreSubtitle: "पात्रता व स्कोअर तपासण्यासाठी येथे क्लिक करा",
    checkBtn: "तपासा",
    closeBtn: "बंद करा",

    bankVerified: "बँक आणि UPI पडताळणी पूर्ण",

    totalMilkVolume: "एकूण दूध संकलन",
    filteredMilkVolume: "निवडलेले दूध संकलन",
    deliveries: "नोंदी / खेपा",
    delivery: "नोंद",
    totalSettledOutflow: "एकूण जमा रक्कम",
    periodSettled: "कालावधी जमा रक्कम",
    directUpiCredited: "थेट बँक / UPI जमा",
    noPayoutsYet: "अद्याप रक्कम नाही",
    avgFat: "सरासरी फॅट (FAT%)",
    qualityStandard: "गुणवत्ता प्रमाण",
    noMilkTested: "चाचणी उपलब्ध नाही",
    avgSnf: "सरासरी एस.एन.एफ (SNF%)",
    liveQualityIndex: "गुणवत्ता निर्देशांक",

    searchPlaceholder: "तारीख (YYYY-MM-DD), सत्र, फॅट%, दर किंवा UTR शोधा...",
    allMonths: "📅 सर्व महिने",
    tenDayCycles: "१०-दिवसीय आवर्तन (सायकल):",
    allDays: "सर्व दिवस",
    cycle1: "१ ते १०",
    cycle1Sub: "(सायकल १)",
    cycle2: "११ ते २०",
    cycle2Sub: "(सायकल २)",
    cycle3: "२१ ते अखेर",
    cycle3Sub: "(सायकल ३)",
    resetFilters: "फिल्टर पूर्ववत करा",

    intakeHistory: "दूध संकलन व पेमेंट इतिहास",
    records: "नोंदी",
    updated: "अपडेट वेळ",
    verifiedBadge: "३T-खातेवही-प्रमाणित",
    thDate: "दिनांक",
    thShift: "सत्र",
    thVolume: "दूध प्रमाण (लिटर)",
    thFat: "फॅट %",
    thSnf: "एस.एन.एफ %",
    thRate: "दर (रु/लिटर)",
    thPayout: "रक्कम (₹)",
    thStatus: "स्थिती / UTR",
    morning: "☀️ सकाळ",
    evening: "🌙 संध्याकाळ",
    credited: "जमा झाले",
    payoutLabel: "रक्कम:",
    noRecordsMatch: "निवडलेल्या १०-दिवसीय कालावधी किंवा शोधामध्ये कोणत्याही दूध संकलन नोंदी आढळल्या नाहीत.",
    showAllRecords: "सर्व नोंदी दाखवा",

    footerCopyright: "३T डेअरी पेमेंट नेटवर्क · प्रमाणित डिजिटल शेतकरी खातेवही प्रणाली",
    footerPowered: "३T झटपट UPI सेटलमेंट प्रणालीद्वारे संचलित",
  },
  hi: {
    officialPassbook: "आधिकारिक डिजिटल किसान पासबुक",
    ledgerTitle: "ग्राम दुग्ध सहकारी खाता बही",
    ledgerSubtitle: "केंद्रीय संकलन केंद्र B-01 · त्वरित UPI निपटान नेटवर्क",
    logout: "लॉग आउट",
    language: "भाषा",
    addToPhone: "📲 मोबाइल में ऐप जोड़ें",
    addToDesktop: "💻 कंप्यूटर में जोड़ें",
    appInstalled: "पासबुक ऐप स्थापित है",

    supportTag: "सहायता एवं शिकायत",
    supportQueryTitle: "भुगतान या तकनीकी समस्या है?",
    supportQuerySubtitle: "ईमेल की आवश्यकता नहीं — सीधे डेयरी प्रबंधक डैशबोर्ड पर शिकायत दर्ज करें",
    raiseQueryBtn: "शिकायत दर्ज करें",

    creditScoreTitle: "सरकारी ऋण पात्रता और 3T क्रेडिट स्कोर",
    newFeature: "नई सुविधा",
    creditScoreSubtitle: "ऋण पात्रता और वित्तीय स्कोर जांचने के लिए यहां क्लिक करें",
    checkBtn: "जांचें",
    closeBtn: "बंद करें",

    bankVerified: "बैंक और UPI सत्यापित",

    totalMilkVolume: "कुल दूध मात्रा",
    filteredMilkVolume: "चयनित दूध मात्रा",
    deliveries: "आपूर्ति खेप",
    delivery: "खेप",
    totalSettledOutflow: "कुल प्राप्त भुगतान",
    periodSettled: "अवधि जमा भुगतान",
    directUpiCredited: "सीधा UPI / बैंक ट्रांसफर",
    noPayoutsYet: "कोई भुगतान नहीं",
    avgFat: "औसत फैट (FAT%)",
    qualityStandard: "गुणवत्ता मानक",
    noMilkTested: "दूध परीक्षण नहीं",
    avgSnf: "औसत एस.एन.एफ (SNF%)",
    liveQualityIndex: "गुणवत्ता सूचकांक",

    searchPlaceholder: "तारीख (YYYY-MM-DD), पाली, फैट%, दर या UTR खोजें...",
    allMonths: "📅 सभी महीने",
    tenDayCycles: "१०-दिवसीय चक्र:",
    allDays: "सभी दिन",
    cycle1: "१ से १०",
    cycle1Sub: "(चक्र १)",
    cycle2: "११ से २०",
    cycle2Sub: "(चक्र २)",
    cycle3: "२१ से अंत",
    cycle3Sub: "(चक्र ३)",
    resetFilters: "फ़िल्टर रीसेट करें",

    intakeHistory: "दूध संकलन और भुगतान इतिहास",
    records: "रिकॉर्ड",
    updated: "अद्यतन समय",
    verifiedBadge: "3T-पासबुक-सत्यापित",
    thDate: "तारीख",
    thShift: "पाली",
    thVolume: "मात्रा (लीटर)",
    thFat: "फैट %",
    thSnf: "एस.एन.एफ %",
    thRate: "दर (₹/लीटर)",
    thPayout: "भुगतान (₹)",
    thStatus: "स्थिति / UTR",
    morning: "☀️ सुबह",
    evening: "🌙 शाम",
    credited: "जमा हुआ",
    payoutLabel: "भुगतान:",
    noRecordsMatch: "चयनित १०-दिवसीय चक्र या खोज में कोई दूध आपूर्ति रिकॉर्ड नहीं मिला।",
    showAllRecords: "सभी रिकॉर्ड दिखाएं",

    footerCopyright: "3T डेयरी पेमेंट नेटवर्क · सत्यापित डिजिटल किसान पासबुक प्रणाली",
    footerPowered: "3T त्वरित UPI निपटान गेटवे द्वारा संचालित",
  },
};

interface PassbookLanguageContextType {
  lang: PassbookLang;
  setLang: (lang: PassbookLang) => void;
  t: Translations;
}

const PassbookLanguageContext = createContext<PassbookLanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: PASSBOOK_TRANSLATIONS.en,
});

export function PassbookLanguageProvider({ children }: { children: React.ReactNode }) {
  // Default language is explicitly "en" (English) as requested
  const [lang, setLangState] = useState<PassbookLang>("en");

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("3t_passbook_lang") as PassbookLang | null;
        if (saved && (saved === "en" || saved === "mr" || saved === "hi")) {
          setLangState(saved);
        }
      }
    } catch {}
  }, []);

  const setLang = (newLang: PassbookLang) => {
    setLangState(newLang);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("3t_passbook_lang", newLang);
      }
    } catch {}
  };

  return (
    <PassbookLanguageContext.Provider
      value={{
        lang,
        setLang,
        t: PASSBOOK_TRANSLATIONS[lang],
      }}
    >
      {children}
    </PassbookLanguageContext.Provider>
  );
}

export function usePassbookLanguage() {
  return useContext(PassbookLanguageContext);
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLang } = usePassbookLanguage();

  const options: { id: PassbookLang; label: string; native: string }[] = [
    { id: "en", label: "English", native: "EN" },
    { id: "mr", label: "मराठी", native: "मराठी" },
    { id: "hi", label: "हिंदी", native: "हिंदी" },
  ];

  return (
    <div
      className={`inline-flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200 shadow-2xs ${className}`}
      title="Select Passbook Language / भाषा निवडा"
    >
      <div className="flex items-center pl-2 pr-1.5 text-gray-400">
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <div className="flex items-center space-x-1">
        {options.map((opt) => {
          const isActive = lang === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLang(opt.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-700 text-white shadow-xs font-black scale-100"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
