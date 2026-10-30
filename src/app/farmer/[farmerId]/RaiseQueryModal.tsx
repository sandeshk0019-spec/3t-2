"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Phone,
  MessageSquare,
  Wrench,
  CreditCard,
  FileQuestion,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";
import { FarmerQuery, QueryCategory, QueryStatus } from "@/app/data";

export type Language = "marathi" | "english" | "hindi";

interface RaiseQueryModalProps {
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

const DICTIONARY = {
  marathi: {
    langName: "मराठी",
    modalTitle: "डेअरी समस्या व तक्रार निवारण",
    modalSubtitle: "पेमेंट किंवा तांत्रिक अडचण थेट डेअरी डॅशबोर्डवर नोंदवा",
    tabNew: "नवीन तक्रार नोंदवा",
    tabHistory: "माझ्या तक्रारी",
    
    // Category labels
    catLabel: "समस्येचा प्रकार निवडा:",
    catPaymentTitle: "पेमेंट संदर्भातील अडचण",
    catPaymentSub: "दूध बिल, बँक ट्रान्सफर, UTR किंवा रक्कम फरक",
    catTechnicalTitle: "तांत्रिक अडचण",
    catTechnicalSub: "पासबुक नोंद, ॲप लोड, QR कोड किंवा लॉगिन",
    catGeneralTitle: "इतर अडचण / विचारणा",
    catGeneralSub: "दर चार्ट, डेअरी वेळा किंवा सर्वसाधारण मदत",

    // Chips
    quickChipsLabel: "सामान्य अडचणी (क्लिक केल्यास आपोआप भरले जाईल):",
    paymentChips: [
      "दूध बिल खात्यात जमा झाले नाही",
      "कमी रक्कम जमा झाली / दर फरक",
      "बँक UTR किंवा खात्यात त्रुटी",
      "पेमेंट पेंडिंग दिसत आहे",
      "फॅट किंवा SNF दर कपात संदर्भात"
    ],
    technicalChips: [
      "पासबुकमध्ये दुधाची नोंद दिसत नाही",
      "ॲप किंवा पासबुक उघडत नाही",
      "क्यूआर कोड स्कॅन होत नाही",
      "मोबाईल नंबर / बँक डिटेल्स अपडेट करायचे आहेत",
      "लॉगिन किंवा OTP येण्यात अडचण"
    ],
    generalChips: [
      "दूध संकलन वेळेबाबत विचारणा",
      "गोकुळ / शासकीय अनुदान योजना",
      "इतर सर्वसाधारण मदत"
    ],

    // Inputs
    farmerLabel: "शेतकरी नाव व आयडी:",
    phoneLabel: "संपर्क मोबाईल नंबर (ज्यावर डेअरी संपर्क करू शकेल):",
    phonePlaceholder: "१० अंकी मोबाईल नंबर",
    subjectLabel: "समस्येचा विषय / शीर्षक:",
    subjectPlaceholder: "उदा. २४ ऑक्टोबरचे सकाळचे पेमेंट जमा झाले नाही",
    descLabel: "समस्येचे सविस्तर वर्णन:",
    descPlaceholder: "कृपया येथे सविस्तर माहिती लिहा (उदा. तारीख, शिफ्ट, अंदाजे लिटर, रक्कम किंवा काय अडचण आली)...",

    // Direct without email note
    noMailTitle: "ई-मेल उघडण्याची कोणतीही गरज नाही",
    noMailDesc: "ही तक्रार थेट डेअरी व्यवस्थापकांच्या डॅशबोर्डवर जमा होईल आणि व्यवस्थापक त्वरित तपासतील.",

    submitBtn: "तक्रार थेट नोंदवा (Submit Query)",
    submittingBtn: "नोंदवत आहे...",

    // Success screen
    successTitle: "तक्रार यशस्वीरित्या नोंदवली गेली!",
    successDesc: "तुमची समस्या थेट डेअरी डॅशबोर्डवर पोहोचली आहे. व्यवस्थापक लवकरच याची पडताळणी करतील.",
    trackingIdLabel: "तक्रार नोंद क्रमांक (Query ID):",
    closeBtn: "बंद करा",
    viewHistoryBtn: "माझ्या तक्रारी तपासा",

    // History screen
    emptyHistory: "तुम्ही अद्याप कोणतीही तक्रार नोंदवलेली नाही.",
    historyRefresh: "रीफ्रेश करा",
    statusPending: "प्रतिक्षित (Pending)",
    statusInProgress: "तपासणी सुरू (In Progress)",
    statusResolved: "निकाली काढले (Resolved)",
    adminReplyLabel: "डेअरी व्यवस्थापकांचे उत्तर / रिमार्क:",
    noAdminReply: "व्यवस्थापकांकडून लवकरच तपासणी होईल.",
    resolvedOn: "निकाली काढल्याची तारीख:"
  },

  english: {
    langName: "English",
    modalTitle: "Dairy Helpdesk & Query Support",
    modalSubtitle: "Report payment or technical issues directly to dairy management",
    tabNew: "Raise New Query",
    tabHistory: "My Queries",
    
    // Category labels
    catLabel: "Select Issue Category:",
    catPaymentTitle: "Payment Related Problem",
    catPaymentSub: "Milk bill settlement, bank transfer, UTR, or rate dispute",
    catTechnicalTitle: "Technical Problem",
    catTechnicalSub: "Passbook records, app loading, QR code, or login issue",
    catGeneralTitle: "Other / General Inquiry",
    catGeneralSub: "Milk rates, center timing, or general assistance",

    // Chips
    quickChipsLabel: "Common Topics (Click to auto-fill):",
    paymentChips: [
      "Milk payment not credited to bank/UPI",
      "Incorrect payment amount / Rate discrepancy",
      "Payment stuck or failed in bank transfer",
      "Payment status showing Pending",
      "FAT or SNF rate deduction inquiry"
    ],
    technicalChips: [
      "Milk collection record missing in passbook",
      "App or passbook page not loading",
      "QR code scanning failure",
      "Update mobile number or bank details",
      "Login / OTP verification problem"
    ],
    generalChips: [
      "Milk collection center timings inquiry",
      "Cattle feed / dairy scheme inquiry",
      "General question or feedback"
    ],

    // Inputs
    farmerLabel: "Farmer Profile:",
    phoneLabel: "Contact Phone (for dairy callback):",
    phonePlaceholder: "10-digit phone number",
    subjectLabel: "Subject / Issue Title:",
    subjectPlaceholder: "e.g., Oct 24 morning milk payment not received",
    descLabel: "Detailed Description:",
    descPlaceholder: "Please describe your issue in detail (date, shift, volume, amount, what went wrong)...",

    // Direct without email note
    noMailTitle: "No Email Client Needed",
    noMailDesc: "This query goes directly to the dairy management dashboard without needing an email app.",

    submitBtn: "Submit Query Directly",
    submittingBtn: "Submitting...",

    // Success screen
    successTitle: "Query Submitted Successfully!",
    successDesc: "Your issue has been logged on the dairy management dashboard. Staff will review and resolve it promptly.",
    trackingIdLabel: "Query Tracking ID:",
    closeBtn: "Close",
    viewHistoryBtn: "View My Queries",

    // History screen
    emptyHistory: "You have not submitted any queries yet.",
    historyRefresh: "Refresh",
    statusPending: "Pending Review",
    statusInProgress: "In Progress",
    statusResolved: "Resolved",
    adminReplyLabel: "Dairy Management Response / Note:",
    noAdminReply: "Staff will review and update shortly.",
    resolvedOn: "Resolved on:"
  },

  hindi: {
    langName: "हिंदी",
    modalTitle: "डेयरी सहायता एवं समस्या निवारण",
    modalSubtitle: "भुगतान या तकनीकी समस्या सीधे डेयरी प्रबंधन को भेजें",
    tabNew: "नई समस्या दर्ज करें",
    tabHistory: "मेरी समस्याएं",
    
    // Category labels
    catLabel: "समस्या की श्रेणी चुनें:",
    catPaymentTitle: "भुगतान संबंधी समस्या",
    catPaymentSub: "दूध बिल, बैंक ट्रांसफर, UTR, कटौती या राशि में अंतर",
    catTechnicalTitle: "तकनीकी समस्या",
    catTechnicalSub: "पासबुक प्रविष्टि, ऐप एरर, QR कोड या लॉगिन समस्या",
    catGeneralTitle: "अन्य समस्या / पूछताछ",
    catGeneralSub: "दर सूची, डेयरी समय या सामान्य सहायता",

    // Chips
    quickChipsLabel: "सामान्य समस्याएं (क्लिक करने पर स्वतः भर जाएगा):",
    paymentChips: [
      "दूध का भुगतान बैंक या UPI में नहीं मिला",
      "कम राशि जमा हुई / दर में अंतर",
      "बैंक ट्रांसफर या UTR में समस्या",
      "भुगतान स्थिति पेंडिंग दिख रही है",
      "फैट या SNF दर कटौती से जुड़ी समस्या"
    ],
    technicalChips: [
      "पासबुक में दूध की प्रविष्टि नहीं दिख रही",
      "ऐप या वेबसाइट लोड होने में समस्या",
      "क्यूआर कोड स्कैन नहीं हो रहा",
      "मोबाइल नंबर या बैंक विवरण अपडेट करना है",
      "लॉगिन या OTP सत्यापन में समस्या"
    ],
    generalChips: [
      "दूध संकलन समय की जानकारी",
      "पशु आहार या सरकारी योजना जानकारी",
      "सामान्य पूछताछ"
    ],

    // Inputs
    farmerLabel: "किसान विवरण:",
    phoneLabel: "संपर्क मोबाइल नंबर (जिस पर डेयरी कॉल कर सके):",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर",
    subjectLabel: "समस्या का विषय / शीर्षक:",
    subjectPlaceholder: "उदा. २४ अक्टूबर का सुबह का भुगतान नहीं मिला",
    descLabel: "समस्या का विस्तृत विवरण:",
    descPlaceholder: "कृपया पूरी जानकारी लिखें (तारीख, शिफ्ट, मात्रा, क्या समस्या हुई)...",

    // Direct without email note
    noMailTitle: "ईमेल खोलने की आवश्यकता नहीं",
    noMailDesc: "यह शिकायत सीधे डेयरी प्रबंधन डैशबोर्ड पर दर्ज होगी और तुरंत जांची जाएगी।",

    submitBtn: "समस्या दर्ज करें (Submit Query)",
    submittingBtn: "दर्ज की जा रही है...",

    // Success screen
    successTitle: "समस्या सफलतापूर्वक दर्ज हो गई!",
    successDesc: "आपकी शिकायत सीधे डेयरी डैशबोर्ड पर भेज दी गई है। टीम जल्द ही समाधान करेगी।",
    trackingIdLabel: "शिकायत पंजीकरण क्रमांक (Query ID):",
    closeBtn: "बंद करें",
    viewHistoryBtn: "मेरी समस्याएं देखें",

    // History screen
    emptyHistory: "आपने अभी तक कोई समस्या दर्ज नहीं की है।",
    historyRefresh: "ताजा करें",
    statusPending: "प्रतीक्षित (Pending)",
    statusInProgress: "प्रगति पर (In Progress)",
    statusResolved: "समाधान हो गया (Resolved)",
    adminReplyLabel: "डेयरी प्रबंधन का उत्तर / रिमार्क:",
    noAdminReply: "प्रबंधन द्वारा जल्द ही जांच की जाएगी।",
    resolvedOn: "समाधान की तारीख:"
  }
};

export function RaiseQueryModal({
  farmerId,
  farmerName,
  farmerPhone,
  isOpen,
  onClose
}: RaiseQueryModalProps) {
  const [language, setLanguage] = useState<Language>("marathi");
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [category, setCategory] = useState<QueryCategory>("payment");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(farmerPhone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState<FarmerQuery | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [historyList, setHistoryList] = useState<FarmerQuery[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const t = DICTIONARY[language];

  // Load history on mount or when tab changes
  useEffect(() => {
    if (isOpen && farmerId) {
      loadHistory();
    }
  }, [isOpen, farmerId]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/farmer/query?farmerId=${encodeURIComponent(farmerId)}&_t=${Date.now()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.queries)) {
        setHistoryList(data.queries);
      }
    } catch (err) {
      console.warn("Failed to load query history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectChip = (chipText: string) => {
    setSubject(chipText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!subject.trim() && !description.trim()) {
      setErrorMsg(
        language === "marathi"
          ? "कृपया समस्येचा विषय किंवा वर्णन लिहा."
          : language === "hindi"
          ? "कृपया समस्या का विषय या विवरण लिखें।"
          : "Please enter a subject or description."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/farmer/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId,
          farmerName,
          farmerPhone: phone || farmerPhone || "",
          category,
          subject: subject.trim() || description.trim().slice(0, 50),
          description: description.trim() || subject.trim(),
          language
        })
      });

      const data = await res.json();
      if (data.success && data.query) {
        setSubmittedQuery(data.query);
        // Refresh history list
        setHistoryList((prev) => [data.query, ...prev]);
        // Reset form inputs
        setSubject("");
        setDescription("");
      } else {
        setErrorMsg(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 sm:p-6 text-white shrink-0 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner shrink-0">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">
                  {t.modalTitle}
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-0.5">
                  {t.modalSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Language Switcher Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-100 flex items-center space-x-1">
              <span>🌐</span>
              <span>भाषा (Language):</span>
            </span>

            <div className="inline-flex bg-black/20 p-1 rounded-xl border border-white/10">
              {(
                [
                  { id: "marathi", label: "मराठी", flag: "🇮🇳" },
                  { id: "english", label: "English", flag: "🇬🇧" },
                  { id: "hindi", label: "हिंदी", flag: "🇮🇳" }
                ] as const
              ).map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguage(lang.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer ${
                    language === lang.id
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-xs">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Tabs (New Query vs My Queries) */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 px-4 sm:px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("new");
              setSubmittedQuery(null);
            }}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "new"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{t.tabNew}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              loadHistory();
            }}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === "history"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.tabHistory}</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === "new" ? (
            submittedQuery ? (
              /* Success Screen */
              <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900">
                    {t.successTitle}
                  </h4>
                  <p className="text-xs text-gray-600 max-w-md mx-auto">
                    {t.successDesc}
                  </p>
                </div>

                <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center max-w-xs w-full">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    {t.trackingIdLabel}
                  </span>
                  <span className="text-base font-black font-mono text-emerald-700">
                    {submittedQuery.id}
                  </span>
                  <span className="block text-[11px] text-gray-500 mt-1">
                    {submittedQuery.category === "payment"
                      ? "💳 " + t.catPaymentTitle
                      : submittedQuery.category === "technical"
                      ? "⚙️ " + t.catTechnicalTitle
                      : "📝 " + t.catGeneralTitle}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left text-xs text-emerald-900 max-w-md mx-auto space-y-1">
                  <p className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.noMailTitle}</span>
                  </p>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {t.noMailDesc}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedQuery(null);
                      setActiveTab("history");
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    {t.viewHistoryBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {t.closeBtn}
                  </button>
                </div>
              </div>
            ) : (
              /* Query Form */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Category Selection */}
                <div>
                  <label className="block text-xs font-black text-gray-900 mb-2">
                    {t.catLabel}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Payment Category */}
                    <button
                      type="button"
                      onClick={() => setCategory("payment")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        category === "payment"
                          ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                          <CreditCard className="w-4 h-4" />
                        </div>
                        {category === "payment" && (
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs font-black text-gray-900">
                          {t.catPaymentTitle}
                        </h5>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                          {t.catPaymentSub}
                        </p>
                      </div>
                    </button>

                    {/* Technical Category */}
                    <button
                      type="button"
                      onClick={() => setCategory("technical")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        category === "technical"
                          ? "bg-indigo-50/90 border-indigo-400 ring-2 ring-indigo-400/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                          <Wrench className="w-4 h-4" />
                        </div>
                        {category === "technical" && (
                          <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs font-black text-gray-900">
                          {t.catTechnicalTitle}
                        </h5>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                          {t.catTechnicalSub}
                        </p>
                      </div>
                    </button>

                    {/* General Category */}
                    <button
                      type="button"
                      onClick={() => setCategory("general")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        category === "general"
                          ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                          <FileQuestion className="w-4 h-4" />
                        </div>
                        {category === "general" && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <h5 className="text-xs font-black text-gray-900">
                          {t.catGeneralTitle}
                        </h5>
                        <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">
                          {t.catGeneralSub}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Quick Issue Chips */}
                <div>
                  <span className="block text-[11px] font-extrabold text-gray-600 mb-1.5">
                    {t.quickChipsLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(category === "payment"
                      ? t.paymentChips
                      : category === "technical"
                      ? t.technicalChips
                      : t.generalChips
                    ).map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectChip(chip)}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-xl border transition-all text-left cursor-pointer ${
                          subject === chip
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Farmer details badge & contact phone */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                      {t.farmerLabel}
                    </span>
                    <span className="text-xs font-black text-gray-900">
                      {farmerName} ({farmerId})
                    </span>
                  </div>

                  <div className="w-full sm:w-auto">
                    <label className="text-[10px] font-bold text-gray-600 block mb-0.5">
                      {t.phoneLabel}
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.phonePlaceholder}
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl font-mono text-gray-800 w-full sm:w-44 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    {t.subjectLabel}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.subjectPlaceholder}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* 5. Detailed Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1">
                    {t.descLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.descPlaceholder}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                  />
                </div>

                {/* 6. Direct without email Reassurance Box */}
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-extrabold block text-emerald-900">
                      ⚡ {t.noMailTitle}
                    </span>
                    <span className="text-emerald-800 font-medium">
                      {t.noMailDesc}
                    </span>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </button>
              </form>
            )
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-gray-500">
                  {historyList.length} {language === "marathi" ? "तक्रारी सापडल्या" : "Queries Found"}
                </span>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="text-xs text-emerald-700 font-bold flex items-center space-x-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} />
                  <span>{t.historyRefresh}</span>
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                  <p className="text-xs">Loading...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs font-medium text-gray-500">{t.emptyHistory}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold mt-1 cursor-pointer"
                  >
                    + {t.tabNew}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white border border-gray-200 rounded-2xl space-y-2.5 shadow-2xs hover:border-gray-300 transition-all"
                    >
                      {/* Query Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-black text-gray-900">
                            #{item.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              item.category === "payment"
                                ? "bg-amber-100 text-amber-800"
                                : item.category === "technical"
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {item.category === "payment"
                              ? "💳 Payment"
                              : item.category === "technical"
                              ? "⚙️ Technical"
                              : "📝 General"}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-xl border flex items-center space-x-1 ${
                              item.status === "resolved"
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                : item.status === "in_progress"
                                ? "bg-blue-50 border-blue-300 text-blue-800"
                                : "bg-amber-50 border-amber-300 text-amber-900"
                            }`}
                          >
                            {item.status === "resolved" ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{t.statusResolved}</span>
                              </>
                            ) : item.status === "in_progress" ? (
                              <>
                                <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                                <span>{t.statusInProgress}</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>{t.statusPending}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Subject & Description */}
                      <div>
                        <h6 className="text-xs font-extrabold text-gray-900">
                          {item.subject}
                        </h6>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Admin Note if available */}
                      {item.adminNotes ? (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                            💬 {t.adminReplyLabel}
                          </span>
                          <p className="text-xs text-emerald-950 font-medium">
                            {item.adminNotes}
                          </p>
                          {item.resolvedAt && (
                            <span className="text-[10px] text-emerald-700 block mt-1">
                              {t.resolvedOn}{" "}
                              {new Date(item.resolvedAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-400 italic">
                          ⏳ {t.noAdminReply}
                        </div>
                      )}

                      {/* Timestamp footer */}
                      <div className="text-[10px] text-gray-400 pt-1">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
