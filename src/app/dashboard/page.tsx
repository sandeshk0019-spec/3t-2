"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Milk,
  Receipt,
  Building,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sliders,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ChevronDown,
  BarChart3,
  CreditCard,
  Settings as SettingsIcon,
  GitBranch,
  FileSpreadsheet,
  Megaphone,
  ArrowUpRight,
  MapPin,
  QrCode,
  X,
  Mail,
  Phone,
  RefreshCw,
  UserCheck,
  User,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RotateCcw,
  Check,
  ShieldCheck,
  Info,
} from "lucide-react";
import { BroadcastTab } from "./BroadcastTab";

import {
  mockFarmers as initialFarmers,
  mockCollections as initialCollections,
  mockPayments as initialPayments,
  mockBranches as initialBranches,
  mockCollectionCalendar,
  defaultFormulaConfig,
  calculateRate,
  getLocalDateString,
  getAutoShift,
  formatToIndiaTime,
  Farmer,
  CollectionItem,
  PaymentItem,
  Branch,
  FormulaConfig,
  parseDateTimeToEpoch,
  getCollectionShift,
  isEveningShiftOpen,
  maskAadhaar,
  maskBankAccount,
  maskIfsc
} from "../data";

export default function Dashboard() {
  const router = useRouter();

  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "farmers" | "collections" | "payments" | "branches" | "analytics" | "reports" | "settings" | "broadcast"
  >("overview");

  // Enterprise Authentication & Session State
  const [userSession, setUserSession] = useState<{ email: string; name: string; role: string } | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "staff">("admin");
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginPasswordInput, setLoginPasswordInput] = useState("");
  const [showPasswordToggle, setShowPasswordToggle] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        setSyncNotice("⚡ Reconnected: Auto-synced all local records with Cloud Database");
        setTimeout(() => setSyncNotice(null), 4000);
      };
      const handleOffline = () => {
        setIsOnline(false);
        setSyncNotice("📡 Offline Mode: Saving milk collections securely to Local Disk");
        setTimeout(() => setSyncNotice(null), 5000);
      };
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const executeLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUserSession(null);
    setShowLogoutConfirmModal(false);
    setIsLoggingOut(false);
    router.push("/");
  };

  // Check active session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUserSession(data.user);
          const isAdm = data.user.role === "SUPER_ADMIN";
          setUserRole(isAdm ? "admin" : "staff");
          if (!isAdm) setActiveTab("collections");
          setIsAuthModalOpen(false);
        } else {
          // Not authenticated — redirect to login immediately
          router.replace("/login?redirect=/dashboard");
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        router.replace("/login?redirect=/dashboard");
      });
  }, []);

  const handleEnterpriseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmailInput, password: loginPasswordInput })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setAuthError(data.error || "Invalid email or password.");
        setIsAuthenticating(false);
        return;
      }

      setUserSession(data.user);
      const isAdm = data.user.role === "SUPER_ADMIN";
      setUserRole(isAdm ? "admin" : "staff");
      if (!isAdm) setActiveTab("collections");
      setIsAuthModalOpen(false);
      setLoginPasswordInput("");
      setIsAuthenticating(false);
    } catch {
      setAuthError("Authentication service error. Please try again.");
      setIsAuthenticating(false);
    }
  };

  // Core application states
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(defaultFormulaConfig);
  const [draftFormulaConfig, setDraftFormulaConfig] = useState<FormulaConfig>(defaultFormulaConfig);
  const [confirmPricingModal, setConfirmPricingModal] = useState<FormulaConfig | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [pricingSuccessMsg, setPricingSuccessMsg] = useState("");
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);

  const [isLoaded, setIsLoaded] = useState(false);

  const handleSavePricing = async (configToSave?: FormulaConfig) => {
    const target = configToSave || draftFormulaConfig;
    setIsSavingPricing(true);
    setPricingSuccessMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target)
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFormulaConfig(json.data);
        setDraftFormulaConfig(json.data);
        setConfirmPricingModal(null);
        triggerRealtimeBroadcast();
        setPricingSuccessMsg("✓ Pricing formula updated & synced across all terminals!");
        setTimeout(() => setPricingSuccessMsg(""), 4000);
      } else {
        alert(json.error || "Failed to save pricing configuration.");
      }
    } catch {
      alert("Failed to communicate with pricing server.");
    } finally {
      setIsSavingPricing(false);
    }
  };

  // Helper for safe JSON fetching (prevents 'Unexpected token <' SyntaxError on HTML/404/500 responses)
  const safeJsonFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await res.json();
        return json;
      }
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status} ${res.statusText}` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  const triggerRealtimeBroadcast = () => {
    try {
      if (typeof window !== "undefined") {
        const channel = new BroadcastChannel("3t_realtime_sync");
        channel.postMessage({ type: "DATA_UPDATED", time: Date.now() });
        channel.close();
        localStorage.setItem("3t_last_sync", Date.now().toString());
      }
    } catch {}
  };

  // Load from server-side persistent database API & Listen for Real-Time Sync
  useEffect(() => {
    async function loadData() {
      try {
        const json = await safeJsonFetch("/api/data", { cache: "no-store" });
        if (json.success && json.data) {
          if (json.data.formulaConfig) {
            setFormulaConfig(json.data.formulaConfig);
            setDraftFormulaConfig(prev => {
              // Sync draft if it matches initial default
              if (prev.basePrice === defaultFormulaConfig.basePrice && 
                  prev.fatFactor === defaultFormulaConfig.fatFactor && 
                  prev.snfFactor === defaultFormulaConfig.snfFactor) {
                return json.data.formulaConfig;
              }
              return prev;
            });
          }
          if (json.data.farmers) setFarmers(json.data.farmers);
          if (json.data.collections) {
            setCollections(prev => {
              const serverIds = new Set(json.data.collections.map((c: any) => c.id));
              const localOnly = prev.filter(c => !serverIds.has(c.id));
              return [...localOnly, ...json.data.collections];
            });
          }
          if (json.data.payments) {
            setPayments(prev => {
              const serverIds = new Set(json.data.payments.map((p: any) => p.id));
              const localOnly = prev.filter(p => !serverIds.has(p.id));
              return [...localOnly, ...json.data.payments];
            });
          }
          if (json.data.branches) setBranches(json.data.branches);
        }
      } catch (error) {
        console.error("Failed to load persistent database state", error);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();

    // 1. Instant Multi-Tab Sync via BroadcastChannel (0ms delay)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => {
          loadData();
        };
      }
    } catch {}

    // 2. Storage Event Listener for multi-window sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "3t_last_sync") loadData();
    };
    window.addEventListener("storage", handleStorage);

    // 3. Periodic Cross-Device Cloud Sync Poll (every 8 seconds)
    const pollInterval = setInterval(() => {
      loadData();
    }, 8000);

    // 4. Instant Cloud Sync on Tab Focus / Visibility Change
    const handleFocus = () => loadData();
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadData();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // KYC Registration State Variables
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [kycName, setKycName] = useState("");
  const [kycVillage, setKycVillage] = useState("Sangamner");
  const [kycPhone, setKycPhone] = useState("+91 ");
  const [kycAnimals, setKycAnimals] = useState("5");
  const [kycAadhaar, setKycAadhaar] = useState("");
  const [kycBankNo, setKycBankNo] = useState("");
  const [kycIfsc, setKycIfsc] = useState("");
  const [kycUpi, setKycUpi] = useState("");
  const [kycBranchId, setKycBranchId] = useState("B-01");
  const [kycError, setKycError] = useState("");
  const [isRegisteringKyc, setIsRegisteringKyc] = useState(false);

  // 📲 Hackathon SMS OTP Verification Modal States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [pendingKycData, setPendingKycData] = useState<any>(null);

  const handleRegisterFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    setKycError("");

    if (!kycName.trim()) {
      setKycError("Please enter farmer's full name.");
      return;
    }
    if (!/^\d{12}$/.test(kycAadhaar)) {
      setKycError("Aadhaar Number must be exactly 12 digits.");
      return;
    }
    if (!kycBankNo.trim() || kycBankNo.length < 8) {
      setKycError("Please enter a valid bank account number.");
      return;
    }
    if (!kycIfsc.trim() || kycIfsc.length !== 11) {
      setKycError("IFSC Code must be exactly 11 characters.");
      return;
    }
    if (!kycUpi.trim() || !kycUpi.includes("@")) {
      setKycError("Please enter a valid UPI ID (e.g. name@upi).");
      return;
    }

    // Generate random 4-digit SMS OTP for demo
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setInputOtp("");
    setOtpError("");
    setPendingKycData({
      name: kycName,
      village: kycVillage,
      phone: kycPhone,
      animals: kycAnimals,
      branchId: kycBranchId,
      aadhaar: kycAadhaar,
      bankAccount: kycBankNo,
      ifsc: kycIfsc,
      upiId: kycUpi,
      phoneVerified: true
    });
    setIsOtpModalOpen(true);
  };

  const handleVerifyOtpAndSave = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (inputOtp.trim() !== generatedOtp) {
      setOtpError("Invalid OTP code. Please enter the 4-digit code shown in the SMS toast.");
      return;
    }

    setIsRegisteringKyc(true);

    safeJsonFetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pendingKycData)
    })
      .then(json => {
        if (json.success && json.data) {
          setFarmers(prev => [json.data, ...prev]);
          setIsOtpModalOpen(false);
          setIsKycOpen(false);
          setPendingKycData(null);
          // Reset Form fields
          setKycName("");
          setKycPhone("+91 ");
          setKycAnimals("5");
          setKycAadhaar("");
          setKycBankNo("");
          setKycIfsc("");
          setKycUpi("");
        } else {
          setOtpError(json.error || "Failed to save farmer to persistent database.");
        }
      })
      .catch(() => {
        setOtpError("Network or server error while connecting to persistent database.");
      })
      .finally(() => {
        setIsRegisteringKyc(false);
      });
  };

  // Selected entities for drawers/modals
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [printedBillPayment, setPrintedBillPayment] = useState<PaymentItem | null>(null);
  const [receiptPeriod, setReceiptPeriod] = useState<"single" | "8days" | "15days" | "month">("single");

  // Generate real scannable QR Data URL when selectedFarmer changes
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [customDomain, setCustomDomain] = useState<string>("");

  useEffect(() => {
    if (selectedFarmer) {
      let targetUrl = "";
      if (customDomain.trim()) {
        const cleanDomain = customDomain.trim().replace(/^https?:\/\//, "");
        targetUrl = `https://${cleanDomain}/farmer/${selectedFarmer.id}`;
      } else {
        const protocol = window.location.protocol;
        const host = window.location.host;
        targetUrl = `${protocol}//${host}/farmer/${selectedFarmer.id}`;
      }

      QRCode.toDataURL(targetUrl, { width: 256, margin: 1, color: { dark: "#000000", light: "#FFFFFF" } })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error("Failed to generate QR Code Data URL", err));
    } else {
      setQrDataUrl(null);
    }
  }, [selectedFarmer, customDomain]);

  // Edit Farmer Profile state with 2FA Mobile OTP Shield
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [editStep, setEditStep] = useState<"form" | "otp">("form");
  const [editOtp, setEditOtp] = useState("");
  const [editMaskedPhone, setEditMaskedPhone] = useState("");
  const [demoBankOtp, setDemoBankOtp] = useState("");
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editVillage, setEditVillage] = useState("");
  const [editAnimals, setEditAnimals] = useState("5");
  const [editUpi, setEditUpi] = useState("");
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editBankAccount, setEditBankAccount] = useState("");
  const [editIfsc, setEditIfsc] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isVerifyingBankOtp, setIsVerifyingBankOtp] = useState(false);

  const openEditFarmer = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setEditStep("form");
    setEditOtp("");
    setEditMaskedPhone("");
    setDemoBankOtp("");
    setEditName(farmer.name);
    setEditPhone(farmer.phone);
    setEditVillage(farmer.village);
    setEditAnimals(String(farmer.animals || 5));
    setEditUpi(farmer.upiId || "");
    setEditAadhaar("");
    setEditBankAccount("");
    setEditIfsc("");
    setEditError("");
  };

  const handleUpdateFarmerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer) return;
    setEditError("");

    if (!editPhone.trim() || editPhone.trim().length < 10) {
      setEditError("Please enter a valid 10-digit mobile phone number.");
      return;
    }
    if (!editUpi.trim() || !editUpi.includes("@")) {
      setEditError("Please enter a valid UPI ID (e.g. name@upi).");
      return;
    }

    // Check if operator entered new sensitive banking or KYC details
    const isBankingChanged = !!editBankAccount.trim() || !!editIfsc.trim() || !!editAadhaar.trim() || (editUpi.trim() && editUpi.trim() !== (editingFarmer.upiId || ""));

    if (isBankingChanged) {
      // 🛡️ Trigger Farmer Mobile OTP Verification Shield
      setIsSavingEdit(true);
      try {
        const res = await fetch("/api/auth/bank-update-otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farmerId: editingFarmer.id,
            newBankAccount: editBankAccount,
            newIfsc: editIfsc,
            newUpi: editUpi,
            newAadhaar: editAadhaar
          })
        });
        const json = await res.json();
        if (json.success) {
          setEditMaskedPhone(json.maskedPhone || editingFarmer.phone);
          if (json._demo_otp) setDemoBankOtp(json._demo_otp);
          setEditStep("otp");
          setEditOtp("");
          setEditError("");
        } else {
          setEditError(json.error || "Failed to initiate farmer security verification.");
        }
      } catch {
        setEditError("Network error while connecting to OTP security server.");
      } finally {
        setIsSavingEdit(false);
      }
      return;
    }

    // Non-sensitive update (village / animal count)
    setIsSavingEdit(true);
    safeJsonFetch("/api/farmers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingFarmer.id,
        name: editName,
        phone: editPhone,
        village: editVillage,
        animals: Number(editAnimals) || 1,
        upiId: editUpi
      })
    })
      .then(json => {
        if (json.success && json.data) {
          setFarmers(prev => prev.map(f => f.id === editingFarmer.id ? { ...f, ...json.data } : f));
          setEditingFarmer(null);
          triggerRealtimeBroadcast();
        } else {
          setEditError(json.error || "Failed to update farmer profile.");
        }
      })
      .catch(() => {
        setEditError("Server or network error while saving profile updates.");
      })
      .finally(() => {
        setIsSavingEdit(false);
      });
  };

  const handleVerifyBankOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarmer) return;
    if (!editOtp.trim() || editOtp.trim().length < 4) {
      setEditError("Please enter the 6-digit OTP provided by the farmer.");
      return;
    }

    setIsVerifyingBankOtp(true);
    setEditError("");

    try {
      const res = await fetch("/api/auth/bank-update-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerId: editingFarmer.id,
          otp: editOtp.trim(),
          updates: {
            name: editName,
            phone: editPhone,
            village: editVillage,
            animals: Number(editAnimals) || 1,
            upiId: editUpi,
            bankAccount: editBankAccount,
            ifsc: editIfsc,
            aadhaar: editAadhaar
          }
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setFarmers(prev => prev.map(f => f.id === editingFarmer.id ? { ...f, ...json.data } : f));
        setEditingFarmer(null);
        setEditStep("form");
        triggerRealtimeBroadcast();
      } else {
        setEditError(json.error || "Invalid OTP code. Please ask the farmer to confirm.");
      }
    } catch {
      setEditError("Network error while verifying OTP.");
    } finally {
      setIsVerifyingBankOtp(false);
    }
  };

  const handleDeleteFarmer = (farmerId: string, farmerName: string) => {
    if (!window.confirm(`Remove ${farmerName} (${farmerId}) from active farmers?\n\n✓ Farmer will be removed from the UI immediately\n✓ Their milk & payment history is kept for 15 days (dispute window)\n✓ ID ${farmerId} is permanently retired — no new farmer will get this number\n✓ After 15 days, all their history is automatically purged\n\nProceed?`)) {
      return;
    }

    safeJsonFetch(`/api/farmers?id=${farmerId}`, { method: "DELETE" })
      .then(json => {
        if (json.success) {
          setFarmers(prev => prev.filter(f => f.id !== farmerId));
          if (selectedFarmer?.id === farmerId) setSelectedFarmer(null);
          if (editingFarmer?.id === farmerId) setEditingFarmer(null);
          try {
            if (typeof window !== "undefined") {
              localStorage.setItem("3t_last_sync", Date.now().toString());
            }
          } catch {}
        } else {
          alert(json.error || "Failed to delete farmer.");
        }
      })
      .catch(() => {
        alert("Server error while deleting farmer.");
      });
  };

  // Search & Category Filter queries for Payment Pipeline
  const [farmerSearch, setFarmerSearch] = useState("");
  const [collectionSearch, setCollectionSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentCategoryFilter, setPaymentCategoryFilter] = useState<"all" | "success" | "morning" | "evening">("all");
  const [processingRazorpayId, setProcessingRazorpayId] = useState<string | null>(null);

  // ── 10-Day Billing Cycle & Calendar Navigation State for Automated Settlement Feed ──
  const [tenDayYear, setTenDayYear] = useState<number>(() => {
    try {
      const today = getLocalDateString();
      return parseInt(today.split("-")[0], 10) || 2026;
    } catch {
      return 2026;
    }
  });

  const [tenDayMonth, setTenDayMonth] = useState<number>(() => {
    try {
      const today = getLocalDateString();
      return parseInt(today.split("-")[1], 10) || 9;
    } catch {
      return 9;
    }
  });

  const [tenDayPeriod, setTenDayPeriod] = useState<1 | 2 | 3 | "all">(() => {
    try {
      const today = getLocalDateString();
      const day = parseInt(today.split("-")[2], 10) || 1;
      if (day <= 10) return 1;
      if (day <= 20) return 2;
      return 3;
    } catch {
      return 1;
    }
  });

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);
  const [isCalendarModeActive, setIsCalendarModeActive] = useState<boolean>(true);

  const handleRazorpayPayment = async (payItem: any) => {
    try {
      setProcessingRazorpayId(payItem.id);
      const orderRes = await safeJsonFetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payItem.id,
          amount: payItem.amount,
          farmerName: payItem.farmerName
        })
      });

      if (!orderRes.success) {
        alert(orderRes.error || "Failed to initialize Razorpay checkout");
        setProcessingRazorpayId(null);
        return;
      }

      const settlePaymentOnServer = async (paymentDetails: any) => {
        const settleRes = await safeJsonFetch("/api/payments/razorpay", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: payItem.id,
            razorpayOrderId: paymentDetails.razorpay_order_id || orderRes.orderId,
            razorpayPaymentId: paymentDetails.razorpay_payment_id || `pay_${Date.now()}`,
            razorpaySignature: paymentDetails.razorpay_signature || "simulated_sig"
          })
        });

        setProcessingRazorpayId(null);
        if (settleRes.success) {
          setPayments(prev =>
            prev.map(p =>
              p.id === payItem.id
                ? { ...p, status: "Success", timeline: settleRes.timeline || p.timeline }
                : p
            )
          );
          if (selectedPayment && selectedPayment.id === payItem.id) {
            setSelectedPayment((prev: any) => prev ? { ...prev, status: "Success", timeline: settleRes.timeline || prev.timeline } : null);
          }
          alert(`✅ Razorpay Instant Settlement Complete!\n\nUTR: ${settleRes.utr}\nFarmer: ${payItem.farmerName}\nAmount: ₹${payItem.amount}`);
        } else {
          alert(settleRes.error || "Payment verification failed.");
        }
      };

      // If Razorpay JS SDK loaded in browser
      if (typeof window !== "undefined" && (window as any).Razorpay && orderRes.mode === "live_sandbox") {
        const options = {
          key: orderRes.keyId,
          amount: orderRes.amount,
          currency: orderRes.currency,
          name: "3T Dairy Payment Network",
          description: `Instant Payout to ${payItem.farmerName} (${payItem.id})`,
          order_id: orderRes.orderId,
          handler: function (response: any) {
            settlePaymentOnServer(response);
          },
          prefill: {
            name: payItem.farmerName,
            email: "farmer@3tdairy.com"
          },
          theme: { color: "#0F8A5F" },
          modal: {
            ondismiss: function () {
              setProcessingRazorpayId(null);
            }
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Instant simulated settlement for smooth zero-config hackathon demo
        await settlePaymentOnServer({
          razorpay_order_id: orderRes.orderId,
          razorpay_payment_id: `pay_rzp_${Math.floor(10000000 + Math.random() * 90000000)}`
        });
      }
    } catch (err: any) {
      setProcessingRazorpayId(null);
      alert("Razorpay checkout error: " + (err.message || "Failed"));
    }
  };

  // Collection logger state
  const [newFarmerId, setNewFarmerId] = useState("F-101");
  const [collectionFarmerSearch, setCollectionFarmerSearch] = useState("");
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("12.0");
  const [newFat, setNewFat] = useState("4.2");
  const [newSnf, setNewSnf] = useState("8.5");
  const [newTime, setNewTime] = useState<"Morning" | "Evening">(getAutoShift);
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  const handleSelectFarmer = (farmerId: string) => {
    setNewFarmerId(farmerId);
    const f = enrichedFarmers.find(ef => ef.id === farmerId);
    if (f) {
      if (f.avgFat && f.avgFat > 0) setNewFat(String(f.avgFat));
      if (f.avgSnf && f.avgSnf > 0) setNewSnf(String(f.avgSnf));
    }
    setIsFarmerDropdownOpen(false);
    setCollectionFarmerSearch("");
  };

  // Smart shift auto-selector: Automatically select the open shift for this farmer
  useEffect(() => {
    if (!newFarmerId) return;
    const localDate = getLocalDateString();
    const utcDate = new Date().toISOString().split("T")[0];
    const morn = collections.some(
      c => c.farmerId?.toUpperCase() === newFarmerId.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c) === "Morning"
    );
    const even = collections.some(
      c => c.farmerId?.toUpperCase() === newFarmerId.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c) === "Evening"
    );
    if (morn && !even) {
      setNewTime("Evening");
    } else if (even && !morn) {
      setNewTime("Morning");
    } else {
      setNewTime(getAutoShift());
    }
  }, [newFarmerId, collections]);

  // Report filters
  const [reportBranch, setReportBranch] = useState("All");
  const [reportDate, setReportDate] = useState("2026-07-11");
  const [reportFormat, setReportFormat] = useState<"excel" | "csv" | "pdf">("excel");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReportText, setGeneratedReportText] = useState<string | null>(null);

  // Preserve historical transaction rates and totals (Historical Financial Lock)
  const currentCollections = useMemo(() => {
    return collections
      .filter((c) => {
        if (!c.id) return false;
        const idUpper = c.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
        if (c.time === 'NOTIF' || c.time === 'CONFIG' || c.time === 'DELNOTIF') return false;
        return true;
      })
      .map((c) => {
        // If collection record has stored historical rate and total, freeze them permanently!
        const lockedRate = (c.rate && c.rate > 0) ? c.rate : calculateRate(c.fat, c.snf, formulaConfig);
        const lockedTotal = (c.total && c.total > 0) ? c.total : Math.round(c.weight * lockedRate * 100) / 100;
        return {
          ...c,
          rate: lockedRate,
          total: lockedTotal
        };
      })
      .sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '');
        if (dateComp !== 0) return dateComp;
        const timeDiff = parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time);
        if (timeDiff !== 0) return timeDiff;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [collections, formulaConfig]);

  const currentPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (!p.id) return false;
        const idUpper = p.id.toUpperCase();
        if (idUpper.startsWith('NOTIF-') || idUpper.startsWith('CONFIG-') || idUpper.startsWith('DELNOTIF-') || idUpper.startsWith('FARMER-')) return false;
        if (p.time === 'NOTIF' || p.time === 'CONFIG' || p.time === 'DELNOTIF') return false;
        return true;
      })
      .map((p) => {
        // Preserve historical settled payment amounts permanently
        const match = currentCollections.find((c) => c.farmerId === p.farmerId && c.date === p.date);
        const lockedAmount = (p.amount && p.amount > 0) ? p.amount : (match ? match.total : p.amount);
        return {
          ...p,
          amount: lockedAmount
        };
      })
      .sort((a, b) => {
        const dateComp = (b.date || '').localeCompare(a.date || '');
        if (dateComp !== 0) return dateComp;
        const timeDiff = parseDateTimeToEpoch(b.date, b.time) - parseDateTimeToEpoch(a.date, a.time);
        if (timeDiff !== 0) return timeDiff;
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [payments, currentCollections]);

  // Month Names Array
  const monthNames = useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  // List of all dates in the current 10-day billing cycle / period
  const periodDates = useMemo(() => {
    const daysInMonth = new Date(tenDayYear, tenDayMonth, 0).getDate();
    const startDay = tenDayPeriod === 1 ? 1 : tenDayPeriod === 2 ? 11 : tenDayPeriod === 3 ? 21 : 1;
    const endDay = tenDayPeriod === 1 ? 10 : tenDayPeriod === 2 ? 20 : tenDayPeriod === 3 ? daysInMonth : daysInMonth;
    const list: string[] = [];
    const yStr = String(tenDayYear);
    const mStr = String(tenDayMonth).padStart(2, "0");
    for (let d = startDay; d <= endDay; d++) {
      list.push(`${yStr}-${mStr}-${String(d).padStart(2, "0")}`);
    }
    return list;
  }, [tenDayYear, tenDayMonth, tenDayPeriod]);

  // Period Label description
  const periodLabel = useMemo(() => {
    const daysInMonth = new Date(tenDayYear, tenDayMonth, 0).getDate();
    const mName = monthNames[tenDayMonth - 1] || "Month";
    if (tenDayPeriod === 1) return `1st – 10th ${mName} ${tenDayYear} (Cycle 1)`;
    if (tenDayPeriod === 2) return `11th – 20th ${mName} ${tenDayYear} (Cycle 2)`;
    if (tenDayPeriod === 3) return `21st – ${daysInMonth}th ${mName} ${tenDayYear} (Cycle 3)`;
    return `Full Month: ${mName} ${tenDayYear}`;
  }, [tenDayYear, tenDayMonth, tenDayPeriod, monthNames]);

  // Period Navigation handlers
  const handlePrevPeriod = () => {
    setSelectedCalendarDay(null);
    if (tenDayPeriod === "all") {
      if (tenDayMonth === 1) {
        setTenDayMonth(12);
        setTenDayYear(prev => prev - 1);
      } else {
        setTenDayMonth(prev => prev - 1);
      }
      return;
    }
    if (tenDayPeriod === 1) {
      setTenDayPeriod(3);
      if (tenDayMonth === 1) {
        setTenDayMonth(12);
        setTenDayYear(prev => prev - 1);
      } else {
        setTenDayMonth(prev => prev - 1);
      }
    } else if (tenDayPeriod === 2) {
      setTenDayPeriod(1);
    } else {
      setTenDayPeriod(2);
    }
  };

  const handleNextPeriod = () => {
    setSelectedCalendarDay(null);
    if (tenDayPeriod === "all") {
      if (tenDayMonth === 12) {
        setTenDayMonth(1);
        setTenDayYear(prev => prev + 1);
      } else {
        setTenDayMonth(prev => prev + 1);
      }
      return;
    }
    if (tenDayPeriod === 1) {
      setTenDayPeriod(2);
    } else if (tenDayPeriod === 2) {
      setTenDayPeriod(3);
    } else {
      setTenDayPeriod(1);
      if (tenDayMonth === 12) {
        setTenDayMonth(1);
        setTenDayYear(prev => prev + 1);
      } else {
        setTenDayMonth(prev => prev + 1);
      }
    }
  };

  const handleJumpToToday = () => {
    const today = getLocalDateString();
    const parts = today.split("-").map(n => parseInt(n, 10));
    const y = parts[0] || 2026;
    const m = parts[1] || 9;
    const d = parts[2] || 4;
    setTenDayYear(y);
    setTenDayMonth(m);
    if (d <= 10) setTenDayPeriod(1);
    else if (d <= 20) setTenDayPeriod(2);
    else setTenDayPeriod(3);
    setSelectedCalendarDay(today);
    setIsCalendarModeActive(true);
  };

  const handleCustomDateChange = (dateVal: string) => {
    if (!dateVal) {
      setSelectedCalendarDay(null);
      return;
    }
    const [y, m, d] = dateVal.split("-").map(n => parseInt(n, 10));
    if (y && m && d) {
      setTenDayYear(y);
      setTenDayMonth(m);
      if (d <= 10) setTenDayPeriod(1);
      else if (d <= 20) setTenDayPeriod(2);
      else setTenDayPeriod(3);
      setSelectedCalendarDay(dateVal);
      setIsCalendarModeActive(true);
    }
  };

  // Day Stats Map for each day in periodDates
  const dayStatsMap = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number; volume: number }> = {};
    periodDates.forEach(d => {
      map[d] = { count: 0, totalAmount: 0, volume: 0 };
    });
    currentPayments.forEach(p => {
      if (map[p.date]) {
        map[p.date].count += 1;
        map[p.date].totalAmount += (p.amount || 0);
        const matchCol = currentCollections.find(c => c.farmerId === p.farmerId && c.date === p.date);
        const vol = matchCol ? matchCol.weight : (p.amount > 0 ? (p.amount / 37.3) : 0);
        map[p.date].volume += vol;
      }
    });
    return map;
  }, [periodDates, currentPayments, currentCollections]);

  // Overall 10-Day Period Stats
  const periodSummaryStats = useMemo(() => {
    const periodPayments = currentPayments.filter(p => {
      if (selectedCalendarDay) return p.date === selectedCalendarDay;
      return periodDates.includes(p.date);
    });
    let totalAmount = 0;
    let totalVolume = 0;
    const farmerSet = new Set<string>();

    periodPayments.forEach(p => {
      totalAmount += (p.amount || 0);
      const matchCol = currentCollections.find(c => c.farmerId === p.farmerId && c.date === p.date);
      const vol = matchCol ? matchCol.weight : (p.amount > 0 ? (p.amount / 37.3) : 0);
      totalVolume += vol;
      if (p.farmerId) farmerSet.add(p.farmerId);
    });

    return {
      totalAmount,
      totalVolume,
      count: periodPayments.length,
      farmersCount: farmerSet.size
    };
  }, [currentPayments, currentCollections, periodDates, selectedCalendarDay]);

  // Filtered & Enriched Payment Pipeline
  const filteredPaymentPipeline = useMemo(() => {
    return currentPayments.filter((p) => {
      const query = paymentSearch.toLowerCase().trim();
      const farmer = farmers.find((f) => f.id === p.farmerId);
      const farmerPhone = farmer ? farmer.phone : "";
      const farmerUpi = farmer ? farmer.upiId : "";

      const matchesQuery =
        !query ||
        p.id.toLowerCase().includes(query) ||
        p.farmerName.toLowerCase().includes(query) ||
        p.date.toLowerCase().includes(query) ||
        p.time.toLowerCase().includes(query) ||
        farmerPhone.toLowerCase().includes(query) ||
        farmerUpi.toLowerCase().includes(query);

      let matchesCategory = true;
      if (paymentCategoryFilter === "success") {
        matchesCategory = p.status === "Success";
      } else if (paymentCategoryFilter === "morning") {
        matchesCategory = p.time.toLowerCase().includes("morning") || p.time.toLowerCase().includes("am");
      } else if (paymentCategoryFilter === "evening") {
        matchesCategory = p.time.toLowerCase().includes("evening") || p.time.toLowerCase().includes("pm");
      }

      let matchesDate = true;
      if (isCalendarModeActive) {
        if (selectedCalendarDay) {
          matchesDate = p.date === selectedCalendarDay;
        } else if (periodDates.length > 0) {
          matchesDate = periodDates.includes(p.date);
        }
      }

      return matchesQuery && matchesCategory && matchesDate;
    });
  }, [currentPayments, farmers, paymentSearch, paymentCategoryFilter, isCalendarModeActive, selectedCalendarDay, periodDates]);

  // Daily / Shift-wise Disbursement Trends for Analytics Chart
  const disbursementTrends = useMemo(() => {
    const map: { [date: string]: { date: string; displayDate: string; amount: number; volume: number; count: number } } = {};

    (currentCollections || []).forEach((c) => {
      const d = (c.date || "2026-08-01").split("T")[0];
      if (!map[d]) {
        let displayDate = d;
        try {
          const parts = d.split("-");
          if (parts.length === 3) {
            const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
        } catch {}
        map[d] = { date: d, displayDate, amount: 0, volume: 0, count: 0 };
      }
      const amt = Number(c.total) > 0 ? Number(c.total) : ((Number(c.weight) || 0) * (Number(c.rate) || 55.1));
      map[d].amount += Math.round(amt * 100) / 100;
      map[d].volume += Number(c.weight) || 0;
      map[d].count += 1;
    });

    const list = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    if (list.length >= 2) {
      return list.slice(-8); // Show last 8 active collection days
    }

    return [
      { date: "2026-08-25", displayDate: "Aug 25", amount: 18450, volume: 380.5, count: 32 },
      { date: "2026-08-26", displayDate: "Aug 26", amount: 22100, volume: 440.0, count: 38 },
      { date: "2026-08-27", displayDate: "Aug 27", amount: 26800, volume: 535.2, count: 44 },
      { date: "2026-08-28", displayDate: "Aug 28", amount: 29400, volume: 590.0, count: 49 },
      { date: "2026-08-29", displayDate: "Aug 29", amount: 34200, volume: 685.4, count: 56 },
      { date: "2026-08-30", displayDate: "Aug 30", amount: 38900, volume: 780.0, count: 62 },
      { date: "2026-08-31", displayDate: "Aug 31", amount: 44500, volume: 890.2, count: 71 },
      { date: "2026-09-01", displayDate: "Sep 01", amount: 49200, volume: 985.0, count: 78 }
    ];
  }, [currentCollections]);

  // Timeframe filter state ("today" | "yesterday" | "7days" | "month" | "custom")
  const [metricTimeframe, setMetricTimeframe] = useState<"today" | "yesterday" | "7days" | "month" | "custom">("month");
  const [customStartDate, setCustomStartDate] = useState<string>("2026-08-01");
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);
  const d7Str = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  }, []);
  const firstOfMonthStr = useMemo(() => todayStr.slice(0, 8) + "01", [todayStr]);

  // Filtered collections based on selected date timeframe
  const filteredCollections = useMemo(() => {
    if (metricTimeframe === "today") {
      return currentCollections.filter(c => c.date === todayStr);
    } else if (metricTimeframe === "yesterday") {
      return currentCollections.filter(c => c.date === yesterdayStr);
    } else if (metricTimeframe === "7days") {
      return currentCollections.filter(c => c.date >= d7Str && c.date <= todayStr);
    } else if (metricTimeframe === "custom") {
      const start = customStartDate || todayStr;
      const end = customEndDate || todayStr;
      return currentCollections.filter(c => c.date >= start && c.date <= end);
    } else {
      // Month - Return all recorded 30-day historical collections
      return currentCollections;
    }
  }, [currentCollections, metricTimeframe, todayStr, yesterdayStr, d7Str, customStartDate, customEndDate]);

  // Filtered payments based on selected date timeframe
  const filteredPayments = useMemo(() => {
    if (metricTimeframe === "today") {
      return currentPayments.filter(p => p.date === todayStr);
    } else if (metricTimeframe === "yesterday") {
      return currentPayments.filter(p => p.date === yesterdayStr);
    } else if (metricTimeframe === "7days") {
      return currentPayments.filter(p => p.date >= d7Str && p.date <= todayStr);
    } else if (metricTimeframe === "custom") {
      const start = customStartDate || todayStr;
      const end = customEndDate || todayStr;
      return currentPayments.filter(p => p.date >= start && p.date <= end);
    } else {
      // Month - Return all recorded 30-day historical payments
      return currentPayments;
    }
  }, [currentPayments, metricTimeframe, todayStr, yesterdayStr, d7Str, customStartDate, customEndDate]);

  // Active farmers in selected date timeframe
  const activeFarmersInTimeframe = useMemo(() => {
    return new Set(filteredCollections.map(c => c.farmerId)).size;
  }, [filteredCollections]);

  // Aggregate metrics for selected timeframe
  const totalMilkVolumeFiltered = useMemo(() => {
    return filteredCollections.reduce((sum, c) => sum + c.weight, 0);
  }, [filteredCollections]);

  const totalPaymentsAmountFiltered = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (p.status === "Success" ? p.amount : 0), 0);
  }, [filteredPayments]);

  const avgFatFiltered = useMemo(() => {
    if (filteredCollections.length === 0) return 0;
    return Math.round((filteredCollections.reduce((sum, c) => sum + c.fat, 0) / filteredCollections.length) * 10) / 10;
  }, [filteredCollections]);

  const avgSnfFiltered = useMemo(() => {
    if (filteredCollections.length === 0) return 0;
    return Math.round((filteredCollections.reduce((sum, c) => sum + c.snf, 0) / filteredCollections.length) * 10) / 10;
  }, [filteredCollections]);

  // Dynamically compute monthly earnings per farmer from live collections
  const farmerEarningsMap = useMemo(() => {
    const map: Record<string, number> = {};
    currentCollections.forEach((c) => {
      map[c.farmerId] = Math.round(((map[c.farmerId] || 0) + c.total) * 100) / 100;
    });
    return map;
  }, [currentCollections]);

  // Farmers enriched with live monthly earnings
  const enrichedFarmers = useMemo(() => {
    return farmers.map((f) => ({
      ...f,
      monthlyEarnings: farmerEarningsMap[f.id] ?? f.monthlyEarnings
    }));
  }, [farmers, farmerEarningsMap]);

  // Farmers filtered for the Collection Logger dropdown
  const filteredCollectionFarmers = useMemo(() => {
    const q = collectionFarmerSearch.toLowerCase().trim();
    if (!q) return enrichedFarmers;
    return enrichedFarmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        (f.phone && f.phone.includes(q)) ||
        (f.village && f.village.toLowerCase().includes(q))
    );
  }, [enrichedFarmers, collectionFarmerSearch]);

  const [fraudModalData, setFraudModalData] = useState<{ farmerName: string; farmerId: string; shift: string; existingLog: any } | null>(null);

  // Verification & Confirmation Modal State for Payment Dispatch
  const [dispatchConfirmation, setDispatchConfirmation] = useState<{
    farmer: Farmer;
    weight: number;
    fat: number;
    snf: number;
    rate: number;
    totalPayout: number;
    shift: string;
    date: string;
    allowOverride?: boolean;
  } | null>(null);

  // Handling new milk collection submission -> Opens verification and confirmation step
  const handleAddCollection = (e?: React.FormEvent, allowOverride = false) => {
    if (e) e.preventDefault();
    const farmer = farmers.find((f) => f.id === newFarmerId);
    if (!farmer) {
      alert("Please select a registered farmer first.");
      return;
    }

    // ── Instant Anti-Fraud Shift Lock Check ──
    const localDate = getLocalDateString();
    const utcDate = new Date().toISOString().split("T")[0];

    const existingShiftLog = collections.find(
      c => c.farmerId?.toUpperCase() === farmer.id?.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c).toLowerCase() === newTime.toLowerCase()
    );

    if (existingShiftLog && !allowOverride) {
      setFraudModalData({
        farmerName: farmer.name,
        farmerId: farmer.id,
        shift: newTime,
        existingLog: existingShiftLog
      });
      return;
    }

    const weightNum = parseFloat(newWeight);
    const fatNum = parseFloat(newFat);
    const snfNum = parseFloat(newSnf);

    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Please enter a valid milk weight in liters.");
      return;
    }
    if (isNaN(fatNum) || fatNum <= 0 || isNaN(snfNum) || snfNum <= 0) {
      alert("Please enter valid FAT % and SNF % values.");
      return;
    }

    const calculatedRate = calculateRate(fatNum, snfNum, formulaConfig);
    const totalPayout = Math.round(weightNum * calculatedRate * 100) / 100;

    // Open verification dialog before executing payout
    setDispatchConfirmation({
      farmer,
      weight: weightNum,
      fat: fatNum,
      snf: snfNum,
      rate: calculatedRate,
      totalPayout,
      shift: newTime,
      date: localDate,
      allowOverride
    });
  };

  // Execute payout dispatch after confirmation in modal
  const executeConfirmDispatch = () => {
    if (!dispatchConfirmation) return;
    const { farmer, weight: weightNum, fat: fatNum, snf: snfNum, shift, date: localDate, allowOverride } = dispatchConfirmation;
    setDispatchConfirmation(null);
    setIsSubmittingCollection(true);

    safeJsonFetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        farmerId: farmer.id,
        farmerName: farmer.name,
        village: farmer.village,
        phone: farmer.phone,
        weight: String(weightNum),
        fat: String(fatNum),
        snf: String(snfNum),
        time: shift,
        date: localDate,
        branchId: farmer.branchId,
        allowOverride: allowOverride || false
      })
    })
      .then(json => {
        if (json.success && json.data) {
          setCollections(prev => [json.data.collection, ...prev]);
          setPayments(prev => [json.data.payment, ...prev]);
          if (json.data.farmer) {
            setFarmers(prev => prev.map(f => f.id === json.data.farmer.id ? json.data.farmer : f));
          }
          setNewWeight("12.0");
          setNewFat("4.2");
          setNewSnf("8.5");
          triggerRealtimeBroadcast();

          // ⚡ Instant Trigger: Launch Razorpay Checkout Modal immediately (<100ms)!
          if (json.data.payment) {
            handleRazorpayPayment(json.data.payment);
          }
        } else if (json.isDuplicateFraud) {
          setFraudModalData({
            farmerName: farmer.name,
            farmerId: farmer.id,
            shift: shift,
            existingLog: json.existingLog || { weight: String(weightNum), time: shift, date: localDate }
          });
        } else {
          alert(json.error || "Failed to log collection.");
        }
      })
      .catch(err => {
        alert(err.message || "Server error while saving collection.");
      })
      .finally(() => {
        setIsSubmittingCollection(false);
      });
  };

  // Trigger client-side file download for generated report
  const triggerReportDownload = (formatToDownload?: "excel" | "csv" | "pdf") => {
    const fmt = formatToDownload || reportFormat;
    
    // Filter matching collections
    const matchingCols = currentCollections.filter(c => {
      const dateMatch = !reportDate || c.date === reportDate;
      const branchMatch = reportBranch === "All" || c.branchId === reportBranch || c.village === reportBranch;
      return dateMatch && branchMatch;
    });

    const cleanDate = reportDate || new Date().toISOString().split("T")[0];
    const cleanBranch = (reportBranch === "All" ? "All_Hubs" : reportBranch).replace(/\s+/g, "_");

    if (fmt === "csv" || fmt === "excel") {
      const headers = ["Collection ID", "Date", "Time/Shift", "Farmer ID", "Farmer Name", "Village", "Volume (L)", "FAT (%)", "SNF (%)", "Rate (INR/L)", "Total Payout (INR)", "Status", "Branch ID"];
      const rows = matchingCols.map(c => [
        c.id,
        c.date,
        c.time,
        c.farmerId,
        `"${(c.farmerName || '').replace(/"/g, '""')}"`,
        `"${(c.village || '').replace(/"/g, '""')}"`,
        c.weight.toFixed(1),
        c.fat.toFixed(1),
        c.snf.toFixed(1),
        c.rate.toFixed(2),
        c.total.toFixed(2),
        c.status,
        c.branchId || "B-01"
      ]);

      const totalVol = matchingCols.reduce((sum, c) => sum + c.weight, 0);
      const totalAmt = matchingCols.reduce((sum, c) => sum + c.total, 0);
      rows.push(["TOTAL", cleanDate, "-", "-", "-", "-", totalVol.toFixed(1), "-", "-", "-", totalAmt.toFixed(2), "SETTLED", cleanBranch]);

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
      const mimeType = fmt === "excel" ? "application/vnd.ms-excel;charset=utf-8;" : "text/csv;charset=utf-8;";
      const ext = fmt === "excel" ? "xls" : "csv";
      const blob = new Blob(["\uFEFF" + csvContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `3T_Delivery_Report_${cleanBranch}_${cleanDate}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // PDF Printable Voucher
      const totalVol = matchingCols.reduce((sum, c) => sum + c.weight, 0);
      const totalAmt = matchingCols.reduce((sum, c) => sum + c.total, 0);
      const avgFatVal = matchingCols.length ? (matchingCols.reduce((s, c) => s + c.fat, 0) / matchingCols.length).toFixed(1) : "0.0";
      const avgSnfVal = matchingCols.length ? (matchingCols.reduce((s, c) => s + c.snf, 0) / matchingCols.length).toFixed(1) : "0.0";

      const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>3T Daily Settlement Report - ${cleanDate}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #111; margin: 0; }
    .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 20px; font-weight: 900; margin: 0; color: #0b6b49; }
    .subtitle { font-size: 11px; font-weight: 600; color: #555; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 11px; border: 1px solid #e2e8f0; }
    .meta-box strong { display: block; font-size: 13px; color: #0f172a; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 800; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
    td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .total-row { font-weight: 900; background: #f8fafc; border-top: 2px solid #000; }
    .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print { body { padding: 0; } button { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">3T DAIRY PAYMENT NETWORK</h1>
      <p class="subtitle">Official Daily Intake &amp; UPI Settlement Statement</p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: 800; color: #0b6b49;">RBI UPI SETTLED (100% VERIFIED)</div>
      <div style="font-size: 10px; color: #64748b;">Date: ${cleanDate} | Center: ${reportBranch}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box"><span>Total Volume</span><strong>${totalVol.toFixed(1)} Liters</strong></div>
    <div class="meta-box"><span>Total Payout</span><strong>₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
    <div class="meta-box"><span>Avg Quality</span><strong>FAT ${avgFatVal}% · SNF ${avgSnfVal}%</strong></div>
    <div class="meta-box"><span>Deliveries Logged</span><strong>${matchingCols.length} Records</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Farmer Name</th>
        <th>Date &amp; Time</th>
        <th class="text-right">Volume</th>
        <th class="text-center">FAT%</th>
        <th class="text-center">SNF%</th>
        <th class="text-right">Rate</th>
        <th class="text-right">Total Payout</th>
        <th class="text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${matchingCols.map(c => `
        <tr>
          <td style="font-family: monospace; font-weight: bold;">${c.id}</td>
          <td><strong>${c.farmerName}</strong></td>
          <td>${c.date} <span style="color:#64748b; font-size: 10px;">${c.time}</span></td>
          <td class="text-right" style="font-weight: bold;">${c.weight} L</td>
          <td class="text-center">${c.fat}%</td>
          <td class="text-center">${c.snf}%</td>
          <td class="text-right">₹${c.rate.toFixed(2)}</td>
          <td class="text-right" style="font-weight: 900; color: #0b6b49;">₹${c.total.toFixed(2)}</td>
          <td class="text-center" style="font-size: 9px; font-weight: bold; color: #047857;">SUCCESS</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="3">TOTAL SUMMARY</td>
        <td class="text-right">${totalVol.toFixed(1)} L</td>
        <td colspan="3"></td>
        <td class="text-right">₹${totalAmt.toFixed(2)}</td>
        <td class="text-center">SETTLED</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    © ${new Date().getFullYear()} 3T Dairy Payment Network · Milk Now. Money Now. · Generated At: ${new Date().toLocaleString('en-IN')}
  </div>
</body>
</html>`;

      const printWin = window.open("", "_blank");
      if (printWin) {
        printWin.document.write(printHtml);
        printWin.document.close();
        setTimeout(() => {
          printWin.print();
        }, 250);
      }
    }
  };

  // Generate Report function
  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingReport(true);
    setTimeout(() => {
      const matchingCols = currentCollections.filter(c => {
        const dateMatch = !reportDate || c.date === reportDate;
        const branchMatch = reportBranch === "All" || c.branchId === reportBranch || c.village === reportBranch;
        return dateMatch && branchMatch;
      });

      const totalVol = matchingCols.reduce((sum, c) => sum + c.weight, 0);
      const totalAmt = matchingCols.reduce((sum, c) => sum + c.total, 0);
      const avgFatVal = matchingCols.length ? (matchingCols.reduce((s, c) => s + c.fat, 0) / matchingCols.length).toFixed(1) : "0.0";
      const avgSnfVal = matchingCols.length ? (matchingCols.reduce((s, c) => s + c.snf, 0) / matchingCols.length).toFixed(1) : "0.0";

      const summaryText = `3T SYSTEM REPORT SUMMARY
Date: ${reportDate || "All Time"}
Filter Branch: ${reportBranch}
Format: ${reportFormat.toUpperCase()}
-----------------------------------------
Total Collection Volume: ${totalVol.toFixed(2)} Liters (${matchingCols.length} Deliveries)
Total Payments Settled: ₹${totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
Average FAT: ${avgFatVal}%
Average SNF: ${avgSnfVal}%
Payment Success Rate: 100%
UTR Settlement Gateway Status: ONLINE
-----------------------------------------
✅ Report file compiled and automatically downloaded to your device.`;

      setGeneratedReportText(summaryText);
      setIsGeneratingReport(false);
      triggerReportDownload();
    }, 600);
  };

  // Filter lists
  const filteredFarmers = enrichedFarmers.filter(
    (f) =>
      f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.village.toLowerCase().includes(farmerSearch.toLowerCase()) ||
      f.id.toLowerCase().includes(farmerSearch.toLowerCase())
  );

  // Show a full-screen loader until auth check completes — prevents dashboard flash
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center space-y-4 font-sans">
        <img src="/3t-logo.png" alt="3T Logo" className="h-10 w-auto max-w-[140px] object-contain drop-shadow-md animate-pulse" />
        <div className="flex space-x-1.5">
          {[0, 150, 300].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <p className="text-xs font-semibold text-text-muted">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] font-sans text-text-main selection:bg-primary-light selection:text-primary">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-border-light flex flex-col shrink-0">
        {/* Sidebar Header */}
        <div className="h-20 border-b border-border-light flex items-center px-6 space-x-3">
          <img src="/3t-logo.png" alt="3T Logo" className="h-9 w-auto max-w-[120px] object-contain drop-shadow-xs" />
          <div>
            <span className="font-bold text-xl tracking-tight text-text-main">3T</span>
            <span className="text-[10px] block text-text-muted font-bold tracking-widest uppercase -mt-0.5">Time To Time</span>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {[
            { id: "overview", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
            { id: "collections", label: "Milk Collections", icon: Milk, adminOnly: false },
            { id: "farmers", label: "Farmers Directory", icon: Users, adminOnly: false },
            { id: "payments", label: "Payment Pipeline", icon: CreditCard, adminOnly: true },
            { id: "branches", label: "Collection Center", icon: GitBranch, adminOnly: true },
            { id: "analytics", label: "Analytics Hub", icon: BarChart3, adminOnly: true },
            { id: "reports", label: "Exports & Reports", icon: FileSpreadsheet, adminOnly: true },
            { id: "broadcast", label: "Farmer Messages", icon: Megaphone, adminOnly: true },
            { id: "settings", label: "Pricing settings", icon: SettingsIcon, adminOnly: true }
          ]
            .filter((item) => userRole === "admin" || !item.adminOnly)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as "overview" | "farmers" | "collections" | "payments" | "branches" | "analytics" | "reports" | "settings" | "broadcast");
                    setSelectedFarmer(null);
                    setSelectedPayment(null);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-primary-light text-primary"
                      : "text-text-muted hover:text-text-main hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted group-hover:text-text-main"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>

        {/* Sidebar Footer — Owner Profile */}
        <div className="p-4 border-t border-border-light bg-gray-50 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            {userRole === "admin" ? "SK" : "OP"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-gray-900 truncate">
              {userRole === "admin" ? "Sandesh Kadam" : (userSession?.name || "Center Operator")}
            </span>
            <span className="block text-[10px] font-semibold text-emerald-800 tracking-tight">
              {userRole === "admin" ? "Owner & Administrator" : "Staff Operator"}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Header */}
        <header className="h-20 bg-white border-b border-border-light flex items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold capitalize text-text-main">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs font-medium text-text-muted">
              Live settlement system metrics for {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-Sync & Network Indicator Pill */}
            <div
              className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                isOnline
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
              title={isOnline ? "Cloud Connected: All milk collections auto-sync in real time" : "Offline Mode: Milk records are saved locally to hard disk"}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 ring-2 ring-emerald-300" : "bg-amber-500 ring-2 ring-amber-300 animate-ping"}`} />
              <span>{isOnline ? "Cloud Synced (Auto)" : "Offline (Saving Locally)"}</span>
            </div>

            <button 
              onClick={() => setShowLogoutConfirmModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all flex items-center space-x-1.5 border border-rose-200 shadow-2xs"
              title="Sign Out of Account & Return to Public Site"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Log Out</span>
            </button>
            
            <button 
              onClick={() => setActiveTab("collections")}
              className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-[#0b6b49] transition-all flex items-center space-x-1.5 shadow-premium-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Milk Delivery</span>
            </button>
          </div>
        </header>

        {/* Real-time Auto-Sync Notification Toast */}
        <AnimatePresence>
          {syncNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-8 mt-4 p-3.5 rounded-2xl bg-emerald-900 text-white text-xs font-bold flex items-center justify-between shadow-lg border border-emerald-700"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">🤖</span>
                <span>{syncNotice}</span>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-800 px-2 py-0.5 rounded-full border border-emerald-600">
                100% Automatic
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Content Panels */}
        <main className="p-8 flex-1">
          
          {/* Staff Access Lock Screen on Restricted Tabs */}
          {userRole === "staff" && activeTab !== "collections" && activeTab !== "farmers" && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center text-2xl shadow-sm">
                🔒
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-text-main">Admin Dashboard Restricted</h3>
                <p className="text-xs text-text-muted font-medium">
                  Branch Staff accounts do not have permission to view Hub Administration metrics or Settings.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("collections")}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-[#0b6b49] transition-all"
              >
                Go to Milk Collection Terminal
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. OVERVIEW TAB */}
          {/* ============================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* Metric Timeframe Toggle Header */}
              <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-border-light shadow-premium-sm">
                <div>
                  <h2 className="text-sm font-extrabold text-text-main flex items-center space-x-2">
                    <span>Performance Summary & Metrics</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                      Date-Wise Filtered
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted font-medium">Real-time metrics calculated dynamically for your selected date / period</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Hover Dropdown Selector Pill */}
                  <div className="relative group inline-block">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text-main font-extrabold text-xs rounded-xl border border-border-light flex items-center space-x-2 transition-all shadow-2xs"
                    >
                      <span>
                        {metricTimeframe === "today" && "📅 Today"}
                        {metricTimeframe === "yesterday" && "🗓️ Yesterday"}
                        {metricTimeframe === "7days" && "🗓️ Last 7 Days"}
                        {metricTimeframe === "month" && "📆 This Month"}
                        {metricTimeframe === "custom" && "🔍 Custom Date Range"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:rotate-180 transition-transform" />
                    </button>

                    {/* Hover Menu */}
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border-light rounded-xl shadow-premium-lg p-1.5 hidden group-hover:block z-40 space-y-1">
                      {[
                        { id: "today", label: "📅 Today" },
                        { id: "yesterday", label: "🗓️ Yesterday" },
                        { id: "7days", label: "🗓️ Last 7 Days" },
                        { id: "month", label: "📆 This Month" },
                        { id: "custom", label: "🔍 Custom Date Range" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setMetricTimeframe(tab.id as any)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                            metricTimeframe === tab.id
                              ? "bg-primary/10 text-primary font-black"
                              : "text-text-muted hover:text-text-main hover:bg-gray-50"
                          }`}
                        >
                          <span>{tab.label}</span>
                          {metricTimeframe === tab.id && <span className="text-primary text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Range Inputs */}
                  {metricTimeframe === "custom" && (
                    <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-xl border border-border-light text-xs font-bold">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-text-muted uppercase">From:</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-border-light rounded-lg text-xs font-mono text-text-main"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-text-muted uppercase">To:</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-border-light rounded-lg text-xs font-mono text-text-main"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 ${userRole === "admin" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"} gap-6`}>
                {!isLoaded ? (
                  // Loading skeletons while data fetches from API
                  Array.from({ length: userRole === "admin" ? 4 : 3 }).map((_, idx) => (
                    <div key={idx} className="p-6 bg-white rounded-2xl border border-border-light shadow-premium-sm flex items-start justify-between animate-pulse">
                      <div className="space-y-3 flex-1">
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-7 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-100 ml-4">
                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))
                ) : (
                [
                  {
                    id: "milk_vol",
                    title: "Total Milk Collected",
                    value: `${totalMilkVolumeFiltered.toFixed(1)} L`,
                    change: `${filteredCollections.length} deliveries logged`,
                    icon: Milk,
                    color: "text-primary",
                    bg: "bg-primary-light"
                  },
                  ...(userRole === "admin"
                    ? [
                        {
                          id: "payments_settled",
                          title: "Total Payments Settled",
                          value: `₹${totalPaymentsAmountFiltered.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          change: `${filteredPayments.filter(p => p.status === "Success").length} of ${filteredPayments.length} settled`,
                          icon: DollarSign,
                          color: "text-green-600",
                          bg: "bg-green-50"
                        }
                      ]
                    : []),
                  {
                    id: "avg_fat",
                    title: "Average Milk FAT",
                    value: avgFatFiltered > 0 ? `${avgFatFiltered}%` : "—",
                    change: avgSnfFiltered > 0 ? `Avg SNF: ${avgSnfFiltered}%` : "No data",
                    icon: Sliders,
                    color: "text-accent",
                    bg: "bg-amber-50"
                  },
                  {
                    id: "reg_farmers",
                    title: "Registered Farmers",
                    value: `${userRole === "admin" ? enrichedFarmers.length : enrichedFarmers.filter(f => f.branchId === "B-01").length}`,
                    change: `${activeFarmersInTimeframe} active with deliveries`,
                    icon: Users,
                    color: "text-blue-600",
                    bg: "bg-blue-50"
                  }
                ].map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="p-6 bg-white rounded-2xl border border-border-light shadow-premium-sm flex items-start justify-between">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider block">{stat.title}</span>
                        <span className="text-2xl font-extrabold text-text-main block">{stat.value}</span>
                        <span className="text-xs text-primary font-bold">{stat.change}</span>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  );
                })
                )}
              </div>

              {/* Main Graphs Panel */}
              <div className="grid lg:grid-cols-12 gap-8">
                
                {/* Area Volume Chart */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-text-main">Daily Milk Volume Trend</h3>
                      <p className="text-xs text-text-muted font-medium">Actual volumetric logs from your recorded deliveries</p>
                    </div>
                    <span className="text-xs font-bold text-primary flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{currentCollections.length > 0 ? `${currentCollections.length} deliveries` : "No deliveries yet"}</span>
                    </span>
                  </div>
                  {(() => {
                    // Build real daily aggregates from actual collections
                    const dailyMap: Record<string, number> = {};
                    currentCollections.forEach((c) => {
                      dailyMap[c.date] = Math.round(((dailyMap[c.date] || 0) + c.weight) * 100) / 100;
                    });
                    const sortedDates = Object.keys(dailyMap).sort();
                    const chartData = sortedDates.map((d) => ({
                      date: d.slice(5), // show MM-DD
                      vol: dailyMap[d]
                    }));
                    if (!isLoaded) {
                      return (
                        <div className="h-[280px] flex flex-col items-center justify-center space-y-3">
                          <div className="w-full h-full animate-pulse bg-gray-100 rounded-xl flex items-end px-4 pb-4 gap-2">
                            {[40,70,55,85,60,90,75,50,80,65,95,70].map((h, i) => (
                              <div key={i} className="flex-1 bg-gray-200 rounded" style={{height: `${h}%`}}></div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    if (chartData.length === 0) {
                      return (
                        <div className="h-[280px] flex flex-col items-center justify-center text-text-muted space-y-2">
                          <Milk className="w-10 h-10 opacity-20" />
                          <p className="text-xs font-bold">No delivery data yet.</p>
                          <p className="text-[10px]">Log a milk collection to see the trend chart.</p>
                        </div>
                      );
                    }
                    return (
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0F8A5F" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#0F8A5F" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis dataKey="date" tickLine={false} style={{ fontSize: "10px", fontWeight: 600, fill: "#707070" }} />
                            <YAxis tickLine={false} style={{ fontSize: "10px", fontWeight: 600, fill: "#707070" }} />
                            <Tooltip formatter={(v: any) => [`${v} L`, "Volume"]} />
                            <Area type="monotone" dataKey="vol" stroke="#0F8A5F" strokeWidth={2.5} fillOpacity={1} fill="url(#volGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </div>

                {/* Heatmap Widget - Real Date-wise Data */}
                {(() => {
                  // Build last 28 days date list using local timezone YYYY-MM-DD
                  const last28: { dateStr: string; label: string }[] = [];
                  for (let i = 27; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    const yr = d.getFullYear();
                    const mo = String(d.getMonth() + 1).padStart(2, "0");
                    const dy = String(d.getDate()).padStart(2, "0");
                    const dateStr = `${yr}-${mo}-${dy}`;
                    const label = `${d.getDate()}/${d.getMonth() + 1}`;
                    last28.push({ dateStr, label });
                  }
                  // Count deliveries per date from real collections
                  const deliveryCountMap: Record<string, number> = {};
                  const deliveryVolMap: Record<string, number> = {};
                  currentCollections.forEach((c) => {
                    const cDate = c.date.split("T")[0];
                    deliveryCountMap[cDate] = (deliveryCountMap[cDate] || 0) + 1;
                    deliveryVolMap[cDate] = Math.round(((deliveryVolMap[cDate] || 0) + c.weight) * 10) / 10;
                  });
                  const maxVol = Math.max(1, ...Object.values(deliveryVolMap));
                  // Count days that have at least 1 delivery
                  const activeDays = last28.filter(d => (deliveryVolMap[d.dateStr] || 0) > 0).length;
                  const completionPct = Math.round((activeDays / 28) * 100);

                  const getIntensityClassByVol = (vol: number) => {
                    if (vol === 0) return "bg-gray-100";
                    const ratio = vol / maxVol;
                    if (ratio <= 0.25) return "bg-emerald-100";
                    if (ratio <= 0.5) return "bg-emerald-300";
                    if (ratio <= 0.75) return "bg-[#46B36A]";
                    return "bg-primary";
                  };

                  return (
                    <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-text-main">Collection Grid</h3>
                        <p className="text-xs text-text-muted font-medium">Last 28 days — milk volume intensity (Liters)</p>
                      </div>

                      <div className="py-4">
                        <div className="grid grid-cols-7 gap-2">
                          {last28.map(({ dateStr, label }) => {
                            const count = deliveryCountMap[dateStr] || 0;
                            const vol = deliveryVolMap[dateStr] || 0;
                            return (
                              <div
                                key={dateStr}
                                className={`w-full aspect-square rounded-md ${getIntensityClassByVol(vol)} hover:scale-110 transition-transform cursor-pointer relative group`}
                              >
                                <span className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-text-main text-white text-[9px] font-bold rounded whitespace-nowrap z-50 shadow-md">
                                  {label}{vol > 0 ? `: ${vol} L (${count} deliveries)` : ": No delivery"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted font-bold mt-3">
                          <span>No delivery</span>
                          <div className="flex space-x-1 items-center">
                            <div className="w-2.5 h-2.5 rounded bg-gray-100" />
                            <div className="w-2.5 h-2.5 rounded bg-emerald-100" />
                            <div className="w-2.5 h-2.5 rounded bg-[#46B36A]" />
                            <div className="w-2.5 h-2.5 rounded bg-primary" />
                          </div>
                          <span>High volume</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border-light space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-text-muted">
                          <span>Active collection days</span>
                          <span className="text-primary font-bold">{activeDays} / 28 days</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-muted font-semibold">{completionPct}% days with recorded collections</p>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Recent Transactions Table (Admin Only) */}
              {userRole === "admin" && (
                <div className="bg-white rounded-2xl border border-border-light shadow-premium-sm overflow-hidden">
                <div className="p-6 border-b border-border-light flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Recent Automated Payments</h3>
                    <p className="text-xs text-text-muted font-medium">Real-time settlements triggered directly to farmer accounts</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("payments")}
                    className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
                  >
                    <span>View all banking logs</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-extrabold uppercase text-text-muted tracking-wider border-b border-border-light">
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Farmer</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4 text-right">Settled Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">API Verify</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light text-xs font-semibold text-text-muted">
                      {currentPayments.slice(0, 4).map((pay) => (
                        <tr key={pay.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-text-main">{pay.id}</td>
                          <td className="px-6 py-4 text-text-main font-bold">{pay.farmerName}</td>
                          <td className="px-6 py-4">{pay.date} | {formatToIndiaTime(pay.time)}</td>
                          <td className="px-6 py-4 text-right text-text-main font-extrabold">₹{pay.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Success</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => setSelectedPayment(pay)}
                              className="px-3 py-1 rounded bg-gray-100 hover:bg-primary-light hover:text-primary transition-colors text-[10px] font-bold"
                            >
                              Trace Log
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

            </div>
          )}

          {/* ============================================================== */}
          {/* 2. FARMERS DIRECTORY & MASTER FINANCIAL LEDGER TAB */}
          {/* ============================================================== */}
          {activeTab === "farmers" && (
            <div className="space-y-6">
              
              {userRole === "staff" && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200 flex items-center justify-center text-amber-900 font-bold shrink-0">
                      🔒
                    </div>
                    <div>
                      <span className="font-extrabold block text-amber-950">Staff Account Restrictions Active</span>
                      <span>Sensitive Master Financial Ledgers, Bank Accounts, and Aadhaar IDs are hidden from Staff accounts. Log in as Master Admin (Owner) to unlock full access.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmailInput("3t@adminsecure@3t.com");
                      setIsAuthModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition-all shrink-0 shadow-sm"
                  >
                    🔑 Log In as Master Admin
                  </button>
                </div>
              )}
              
              {/* Search & Export Header */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-border-light shadow-premium-sm gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search farmers by name, phone, UPI, Aadhaar, or ID..."
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light text-xs font-semibold focus:outline-none focus:border-primary transition-colors bg-[#FAFAFA]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {userRole === "admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        const headers = ["Farmer ID", "Farmer Name", "Phone", "Village", "Aadhaar", "Bank Account", "IFSC", "UPI ID", "Milk Volume (L)", "Total Payout (₹)", "Status"];
                        const rows = enrichedFarmers.map(f => {
                          const farmerVol = currentCollections.filter(c => c.farmerId === f.id).reduce((sum, c) => sum + c.weight, 0);
                          const farmerEarnings = farmerEarningsMap[f.id] ?? f.monthlyEarnings;
                          const status = farmerEarnings > 0 ? "SETTLED (Instant UPI)" : "NO DELIVERIES";
                          return [
                            f.id,
                            `"${f.name}"`,
                            `"${f.phone}"`,
                            `"${f.village}"`,
                            `"${f.aadhaar}"`,
                            `"${f.bankAccount}"`,
                            `"${f.ifsc}"`,
                            `"${f.upiId}"`,
                            farmerVol.toFixed(2),
                            farmerEarnings.toFixed(2),
                            `"${status}"`
                          ].join(",");
                        });

                        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `3T_Master_Farmer_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                      title="Export all farmers and financial ledgers to CSV"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Export CSV</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsKycOpen(true)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-[#0b6b49] transition-all flex items-center justify-center space-x-1.5 shadow-premium-sm shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Farmer</span>
                  </button>
                </div>
              </div>

              {/* Farmers Master Catalog & Ledger */}
              <div className="bg-white rounded-2xl border border-border-light shadow-premium-sm overflow-hidden">
                {/* ── MOBILE FARMER CARDS (Phones < md) ── */}
                <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
                  {filteredFarmers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 font-bold text-xs bg-gray-50 rounded-xl">
                      No matching farmers found.
                    </div>
                  ) : (
                    filteredFarmers.map((farmer) => {
                      const matchingCols = currentCollections.filter(c => c.farmerId?.toUpperCase() === farmer.id.toUpperCase());
                      const deliveriesCount = matchingCols.length;
                      const calculatedVol = matchingCols.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
                      const calculatedEarnings = matchingCols.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
                      const farmerVol = deliveriesCount > 0 ? calculatedVol : (farmer.milkHistory && farmer.milkHistory.length > 0 ? farmer.milkHistory.reduce((s, h) => s + (Number(h.volume) || 0), 0) : 0);
                      const displayEarnings = deliveriesCount > 0 ? calculatedEarnings : (farmerVol > 0 ? farmer.monthlyEarnings : 0);
                      const hasEarnings = displayEarnings > 0;

                      return (
                        <div key={farmer.id} className="bg-[#FAFDFB] border border-emerald-100/80 rounded-2xl p-4 shadow-2xs space-y-3 hover:border-emerald-300 transition-all">
                          {/* Top Row: Farmer Profile & Payout Status */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-3">
                              <span className="bg-emerald-100 text-emerald-900 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                                {farmer.id}
                              </span>
                              <div>
                                <h4 className="text-gray-900 font-extrabold text-sm leading-tight">{farmer.name}</h4>
                                <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-medium mt-0.5">
                                  <span>{farmer.village}</span>
                                  <span>·</span>
                                  <span>{farmer.animals} Cattle</span>
                                </div>
                              </div>
                            </div>
                            {hasEarnings ? (
                              <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300 shrink-0">
                                CREDITED
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                                No Milk
                              </span>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-gray-100 text-xs">
                            <span className="text-[11px] text-gray-500 font-mono flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span>{farmer.phone}</span>
                            </span>
                            {farmer.phone && (
                              <a
                                href={`tel:${farmer.phone}`}
                                className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
                              >
                                📞 Call
                              </a>
                            )}
                          </div>

                          {/* Middle Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-gray-100 text-center">
                            <div className="p-1.5 bg-gray-50/60 rounded-lg">
                              <span className="text-[9px] font-bold uppercase text-gray-400 block">Milk Volume</span>
                              <span className="font-black text-xs text-gray-900 block mt-0.5">{farmerVol.toFixed(1)} L</span>
                              <span className="text-[9px] text-gray-500 font-medium block">{deliveriesCount} deliveries</span>
                            </div>
                            <div className="p-1.5 bg-gray-50/60 rounded-lg">
                              <span className="text-[9px] font-bold uppercase text-gray-400 block">Total Settled</span>
                              <span className="font-mono font-black text-xs text-emerald-700 block mt-0.5">
                                ₹{displayEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] text-emerald-800 font-medium block">Instant UPI</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 text-xs font-bold">
                            <a
                              href={`/farmer/${farmer.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-center text-[11px] shadow-2xs transition-all"
                            >
                              📲 Passbook
                            </a>
                            {userRole === "admin" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditFarmer(farmer)}
                                  className="py-1.5 px-2.5 bg-gray-900 hover:bg-black text-white rounded-lg text-[11px] shadow-2xs transition-all"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedFarmer(farmer)}
                                  className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 rounded-lg text-[11px] transition-all"
                                >
                                  Inspect
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                                  className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] transition-all"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ── DESKTOP TABLE VIEW (Screens >= md) ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 text-[11px] font-bold uppercase text-gray-700 tracking-wider border-b border-gray-200">
                        <th className="px-5 py-3.5">Farmer Profile</th>
                        <th className="px-5 py-3.5">Village / Animals</th>
                        {userRole === "admin" && <th className="px-5 py-3.5">Settlement Method</th>}
                        <th className="px-5 py-3.5 text-center">Milk Volume</th>
                        {userRole === "admin" && <th className="px-5 py-3.5 text-right">Total Settled</th>}
                        <th className="px-5 py-3.5 text-center">Payout Status</th>
                        {userRole === "admin" && <th className="px-5 py-3.5 text-center">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-xs font-semibold">
                      {filteredFarmers.map((farmer) => {
                        const matchingCols = currentCollections.filter(c => c.farmerId?.toUpperCase() === farmer.id.toUpperCase());
                        const deliveriesCount = matchingCols.length;
                        const calculatedVol = matchingCols.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
                        const calculatedEarnings = matchingCols.reduce((sum, c) => sum + (Number(c.total) || 0), 0);

                        // Strict Synchronization: volume & earnings always match actual logged deliveries
                        const farmerVol = deliveriesCount > 0 ? calculatedVol : (farmer.milkHistory && farmer.milkHistory.length > 0 ? farmer.milkHistory.reduce((s, h) => s + (Number(h.volume) || 0), 0) : 0);
                        const displayEarnings = deliveriesCount > 0 ? calculatedEarnings : (farmerVol > 0 ? farmer.monthlyEarnings : 0);
                        const hasEarnings = displayEarnings > 0;

                        return (
                          <tr key={farmer.id} className="hover:bg-gray-50 transition-colors">
                            {/* 1. Farmer Profile */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center space-x-3">
                                <span className="bg-gray-100 text-gray-800 font-mono font-bold text-xs px-2.5 py-1 rounded border border-gray-300 shrink-0">
                                  {farmer.id}
                                </span>
                                <div>
                                  <span className="text-gray-900 font-extrabold text-sm block">{farmer.name}</span>
                                  <span className="text-xs text-gray-500 font-mono font-medium block">{farmer.phone}</span>
                                </div>
                              </div>
                            </td>

                            {/* 2. Village / Animals */}
                            <td className="px-5 py-3.5">
                              <span className="text-gray-900 font-bold block">{farmer.village}</span>
                              <span className="text-xs font-semibold text-gray-500 block mt-0.5">{farmer.animals} Cattle</span>
                            </td>

                            {/* 3. Settlement Method (Admin Only) */}
                            {userRole === "admin" && (
                              <td className="px-5 py-3.5">
                                <span className="inline-block text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 px-2.5 py-1 rounded-md">
                                  Bank & UPI Linked
                                </span>
                              </td>
                            )}

                            {/* 4. Milk Volume */}
                            <td className="px-5 py-3.5 text-center">
                              <span className="text-gray-900 font-extrabold text-sm block">
                                {farmerVol.toFixed(1)} L
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                                {deliveriesCount} {deliveriesCount === 1 ? "delivery" : "deliveries"}
                              </span>
                            </td>

                            {/* 5. Total Settled (Admin Only) */}
                            {userRole === "admin" && (
                              <td className="px-5 py-3.5 text-right">
                                <span className="text-gray-900 font-mono font-black text-sm block">
                                  ₹{displayEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                                  {deliveriesCount > 0
                                    ? `FAT: ${(matchingCols.reduce((sum, c) => sum + (Number(c.fat) || 0), 0) / deliveriesCount).toFixed(1)}% · SNF: ${(matchingCols.reduce((sum, c) => sum + (Number(c.snf) || 0), 0) / deliveriesCount).toFixed(1)}%`
                                    : "No deliveries yet"}
                                </span>
                              </td>
                            )}

                            {/* 6. Payout Status */}
                            <td className="px-5 py-3.5 text-center">
                              {hasEarnings ? (
                                <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
                                  CREDITED (UPI)
                                </span>
                              ) : (
                                <span className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                  No Deliveries Yet
                                </span>
                              )}
                            </td>

                            {/* 7. Actions (Admin Only) */}
                            {userRole === "admin" && (
                              <td className="px-5 py-3.5 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <a
                                    href={`/farmer/${farmer.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-all text-xs font-bold shadow-2xs"
                                    title="Open Farmer Live Digital Passbook"
                                  >
                                    Passbook
                                  </a>

                                  <button
                                    onClick={() => openEditFarmer(farmer)}
                                    className="px-3 py-1.5 rounded-lg bg-black hover:bg-gray-800 text-white transition-all text-xs font-bold shadow-2xs"
                                    title="Edit Farmer Phone, Name, UPI ID or Bank Account Details"
                                  >
                                    Edit Profile
                                  </button>

                                  <button
                                    onClick={() => setSelectedFarmer(farmer)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 transition-all text-xs font-bold shadow-2xs"
                                  >
                                    Inspect
                                  </button>

                                  <button
                                    onClick={() => handleDeleteFarmer(farmer.id, farmer.name)}
                                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-xs font-bold shadow-2xs"
                                    title="Delete Farmer Profile Permanently"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FARMER DETAIL DRAWER (ANIMATED) */}
              <AnimatePresence>
                {selectedFarmer && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedFarmer(null)}
                      className="fixed inset-0 bg-black z-40"
                    />
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white z-50 shadow-premium-lg border-l border-border-light flex flex-col"
                    >
                      {/* Drawer Header */}
                      <div className="p-6 border-b border-border-light flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {selectedFarmer.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-text-main">{selectedFarmer.name}</h3>
                            <span className="text-[10px] font-bold text-text-muted font-mono">{selectedFarmer.id}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFarmer(null)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-text-muted"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Drawer Scrollable Body */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Profile Info Cards */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-xl border border-border-light text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Village</span>
                            <span className="block font-bold text-sm text-text-main mt-1">{selectedFarmer.village}</span>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-border-light text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Contact</span>
                            <span className="block font-bold text-sm text-text-main mt-1">{selectedFarmer.phone}</span>
                          </div>
                        </div>

                        {/* QR Profile Card */}
                        <div className="p-5 bg-white border border-gray-200 rounded-2xl flex items-center justify-between shadow-sm">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">QR Profile Identifier</span>
                            <span className="text-xs text-text-main font-bold block">Scan on Weighing Terminal</span>
                            <div className="inline-flex items-center space-x-1 text-xs text-primary font-bold pt-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Card Linked</span>
                            </div>
                          </div>
                          <div className="p-2 border border-gray-200 rounded-xl bg-white shadow-2xs shrink-0">
                            {qrDataUrl ? (
                              <img src={qrDataUrl} alt={`QR for ${selectedFarmer.name}`} className="w-20 h-20 rounded object-contain" />
                            ) : (
                              <QrCode className="w-20 h-20 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Aggregate Metrics</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-primary-light/50 rounded-xl border border-primary/10 text-center">
                              <span className="text-[10px] font-bold text-text-muted block">Livestock</span>
                              <span className="text-lg font-extrabold text-primary block mt-0.5">{selectedFarmer.animals}</span>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                              <span className="text-[10px] font-bold text-text-muted block">Avg FAT</span>
                              <span className="text-lg font-extrabold text-accent block mt-0.5">{selectedFarmer.avgFat}%</span>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-center">
                              <span className="text-[10px] font-bold text-text-muted block">Avg SNF</span>
                              <span className="text-lg font-extrabold text-green-600 block mt-0.5">{selectedFarmer.avgSnf}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Milk History */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Recent Collections</h4>
                          <div className="border border-border-light rounded-xl overflow-hidden bg-white">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="bg-gray-50 text-[10px] font-extrabold text-text-muted border-b border-border-light uppercase">
                                  <th className="px-4 py-2.5">Date</th>
                                  <th className="px-4 py-2.5">Weight</th>
                                  <th className="px-4 py-2.5">FAT/SNF</th>
                                  <th className="px-4 py-2.5 text-right">Payout</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-light font-semibold text-text-muted">
                                {selectedFarmer.milkHistory.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2">{item.date}</td>
                                    <td className="px-4 py-2 text-text-main font-bold">{item.volume} L</td>
                                    <td className="px-4 py-2">{item.fat}% / {item.snf}%</td>
                                    <td className="px-4 py-2 text-right text-text-main font-bold">₹{item.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* ============================================================== */}
          {/* 3. MILK COLLECTIONS TAB */}
          {/* ============================================================== */}
          {activeTab === "collections" && (
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Collection Form Logger */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm h-fit">
                <div className="flex items-center space-x-2 text-primary font-bold mb-4">
                  <Milk className="w-5 h-5" />
                  <h3 className="text-base font-extrabold text-text-main">Log New Collection</h3>
                </div>

                <form onSubmit={handleAddCollection} className="space-y-5">
                  
                  {/* Select Farmer with Live Search Combobox */}
                  <div className="space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main flex items-center space-x-1">
                        <span>Search &amp; Select Farmer</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsKycOpen(true)}
                        className="text-[10px] text-primary font-bold hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ New KYC</span>
                      </button>
                    </div>

                    {/* Instant Search Combobox Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search name, ID (e.g. F-102), phone..."
                        value={collectionFarmerSearch}
                        onFocus={() => setIsFarmerDropdownOpen(true)}
                        onClick={() => setIsFarmerDropdownOpen(true)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCollectionFarmerSearch(val);
                          setIsFarmerDropdownOpen(true);
                          const q = val.toLowerCase().trim();
                          if (q) {
                            const exact = enrichedFarmers.find(
                              f => f.id.toLowerCase() === q || f.name.toLowerCase() === q || (f.phone && f.phone.includes(q))
                            );
                            if (exact) {
                              setNewFarmerId(exact.id);
                              if (exact.avgFat) setNewFat(String(exact.avgFat));
                              if (exact.avgSnf) setNewSnf(String(exact.avgSnf));
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (filteredCollectionFarmers.length > 0) {
                              handleSelectFarmer(filteredCollectionFarmers[0].id);
                            }
                          } else if (e.key === "Escape") {
                            setIsFarmerDropdownOpen(false);
                          }
                        }}
                        className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-border-light text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-[#FAFAFA]"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        {collectionFarmerSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setCollectionFarmerSearch("");
                              setIsFarmerDropdownOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 text-xs font-bold p-1 rounded-md"
                            title="Clear search"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsFarmerDropdownOpen(prev => !prev)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Toggle farmer list"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFarmerDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Floating Dropdown Results Menu */}
                    <AnimatePresence>
                      {isFarmerDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-20" 
                            onClick={() => setIsFarmerDropdownOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 z-30 max-h-56 overflow-y-auto divide-y divide-gray-100"
                          >
                            {filteredCollectionFarmers.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-500 font-medium">
                                No farmers found matching &quot;{collectionFarmerSearch}&quot;
                              </div>
                            ) : (
                              filteredCollectionFarmers.map((f) => {
                                const isSelected = f.id === newFarmerId;
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => handleSelectFarmer(f.id)}
                                    className={`w-full text-left p-2.5 px-3 flex items-center justify-between hover:bg-emerald-50/80 transition-colors ${
                                      isSelected ? "bg-emerald-50 border-l-4 border-emerald-600 font-bold" : ""
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2.5">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                                        isSelected ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"
                                      }`}>
                                        {f.id}
                                      </span>
                                      <div>
                                        <div className="text-xs font-bold text-gray-900 flex items-center space-x-1">
                                          <span>{f.name}</span>
                                          {isSelected && <span className="text-emerald-600 text-[10px]">✓ Selected</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium">
                                          {f.village} • 📞 {f.phone}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right text-[10px] text-gray-500">
                                      <span className="block font-bold text-gray-700">{f.animals || 5} Cattle</span>
                                      <span>Avg {f.avgFat || 4.2}% / {f.avgSnf || 8.5}%</span>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    {/* Active Selected Farmer Confirmation Chip */}
                    {(() => {
                      const selected = enrichedFarmers.find(f => f.id === newFarmerId);
                      if (!selected) {
                        return (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center justify-between">
                            <span>⚠️ Please select a registered farmer above</span>
                            <button
                              type="button"
                              onClick={() => setIsFarmerDropdownOpen(true)}
                              className="text-[10px] font-black underline"
                            >
                              Choose Farmer
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-black text-white font-mono bg-emerald-700 px-2 py-0.5 rounded text-[10px]">
                              {selected.id}
                            </span>
                            <div>
                              <span className="font-extrabold text-gray-900 block text-xs">{selected.name}</span>
                              <span className="text-[10px] text-gray-600 font-medium">{selected.village} • 📞 {selected.phone}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsFarmerDropdownOpen(true);
                              setCollectionFarmerSearch("");
                            }}
                            className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-lg transition-colors flex items-center space-x-1"
                          >
                            <span>Change</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Weight Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main">Weight (Liters)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="100"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA]"
                    />
                  </div>

                  {/* Shift Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main block">Shift Time</label>
                      {newFarmerId && (() => {
                        const localDate = getLocalDateString();
                        const utcDate = new Date().toISOString().split("T")[0];
                        const morningDone = collections.some(c => c.farmerId?.toUpperCase() === newFarmerId?.toUpperCase() && (c.date === localDate || c.date === utcDate) && getCollectionShift(c) === "Morning");
                        const eveningDone = collections.some(c => c.farmerId?.toUpperCase() === newFarmerId?.toUpperCase() && (c.date === localDate || c.date === utcDate) && getCollectionShift(c) === "Evening");
                        return (
                          <span className="text-[9px] font-bold text-text-muted">
                            {morningDone && eveningDone 
                              ? "Both Shifts Complete" 
                              : morningDone 
                                ? "Morning Logged · Evening Open" 
                                : eveningDone 
                                  ? "Evening Logged · Morning Open" 
                                  : "Both Shifts Open"}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {["Morning", "Evening"].map((s) => {
                        const localDate = getLocalDateString();
                        const utcDate = new Date().toISOString().split("T")[0];
                        const isDone = collections.some(c => c.farmerId?.toUpperCase() === newFarmerId?.toUpperCase() && (c.date === localDate || c.date === utcDate) && getCollectionShift(c).toLowerCase() === s.toLowerCase());
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setNewTime(s as "Morning" | "Evening")}
                            className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-1 ${
                              newTime === s
                                ? "bg-primary border-primary text-white"
                                : "border-border-light text-text-muted hover:bg-gray-50"
                            }`}
                          >
                            <span>{s} Shift</span>
                            {isDone && (
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ml-1 ${newTime === s ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                                ✓ Logged
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chemical Metrics inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-main">FAT %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="2.5"
                        max="12"
                        value={newFat}
                        onChange={(e) => setNewFat(e.target.value)}
                        className="w-full p-3 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-main">SNF %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="5"
                        max="12"
                        value={newSnf}
                        onChange={(e) => setNewSnf(e.target.value)}
                        className="w-full p-3 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA]"
                      />
                    </div>
                  </div>

                  {/* Calculation summary */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-border-light space-y-2 text-xs font-semibold text-text-muted">
                    <div className="flex justify-between">
                      <span>Rate / Liter:</span>
                      <span className="text-text-main font-bold">₹{calculateRate(parseFloat(newFat) || 0, parseFloat(newSnf) || 0, formulaConfig).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-border-light">
                      <span className="font-bold text-text-main">Calculated Total:</span>
                      <span className="font-extrabold text-primary">₹{( (parseFloat(newWeight) || 0) * calculateRate(parseFloat(newFat) || 0, parseFloat(newSnf) || 0, formulaConfig) ).toFixed(2)}</span>
                    </div>
                  </div>

                  {farmers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold space-y-2">
                      <p>⚠️ No farmers registered in database yet. Please register a farmer first to dispatch payouts.</p>
                      <button
                        type="button"
                        onClick={() => setIsKycOpen(true)}
                        className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-sm"
                      >
                        + New Farmer KYC Registration
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmittingCollection || !farmers.some(f => f.id === newFarmerId)}
                      className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-[#0b6b49] transition-all flex items-center justify-center space-x-2 text-xs shadow-premium-sm disabled:opacity-50"
                    >
                      {isSubmittingCollection ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending UPI Settlement...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Dispatch Payment</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </form>
              </div>

              {/* Collections History log */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Delivery Ledger</h3>
                    <p className="text-xs text-text-muted font-medium">Recent milk intake deliveries (newest first)</p>
                  </div>
                  <div className="relative max-w-xs">
                    <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search deliveries..."
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-border-light text-xs font-semibold focus:outline-none focus:border-primary transition-colors bg-[#FAFAFA]"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-border-light rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-extrabold uppercase text-text-muted border-b border-border-light">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Farmer</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Weight</th>
                        <th className="px-4 py-3">FAT/SNF</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-light font-semibold text-text-muted">
                      {currentCollections
                        .filter(c => {
                          const q = collectionSearch.toLowerCase().trim();
                          if (!q) return true;
                          return (
                            c.farmerName?.toLowerCase().includes(q) ||
                            c.farmerId?.toLowerCase().includes(q) ||
                            c.id?.toLowerCase().includes(q) ||
                            c.village?.toLowerCase().includes(q)
                          );
                        })
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-mono text-text-main font-bold">{item.id}</td>
                            <td className="px-4 py-3 text-text-main font-bold">{item.farmerName}</td>
                            <td className="px-4 py-3">
                              <span className="block font-bold text-gray-900">{item.date}</span>
                              <span className="text-[11px] text-gray-600 font-medium block mt-0.5">{formatToIndiaTime(item.time)}</span>
                            </td>
                            <td className="px-4 py-3 text-text-main font-bold">{item.weight} L</td>
                            <td className="px-4 py-3">{item.fat}% / {item.snf}%</td>
                            <td className="px-4 py-3 text-right text-text-main font-extrabold">₹{item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* 4. PAYMENT PIPELINE TIMELINE TAB */}
          {/* ============================================================== */}
          {activeTab === "payments" && (
            <div className="space-y-6">

              {/* Payment Pipeline Toolbar: Search, Categories & Export */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between bg-white p-4 rounded-2xl border border-border-light shadow-premium-sm gap-4">
                
                {/* Search Input */}
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by Payment ID, Farmer, Phone, UPI, or Date..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light text-xs font-semibold focus:outline-none focus:border-primary transition-colors bg-[#FAFAFA]"
                  />
                  {paymentSearch && (
                    <button
                      onClick={() => setPaymentSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories & CSV Export */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-border-light text-xs font-bold shrink-0">
                    {[
                      { id: "all", label: "All Payouts" },
                      { id: "success", label: "✅ Completed" },
                      { id: "morning", label: "🌅 Morning" },
                      { id: "evening", label: "🌆 Evening" }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPaymentCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-lg transition-all text-xs ${
                          paymentCategoryFilter === cat.id
                            ? "bg-white text-primary shadow-sm font-extrabold"
                            : "text-text-muted hover:text-text-main font-semibold"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const headers = ["Payment Txn ID", "Farmer ID", "Farmer Name", "Phone", "Milk Volume (L)", "FAT %", "SNF %", "Rate (₹/L)", "Amount Settled (₹)", "Date", "Shift/Time", "Status", "UPI ID", "UTR Reference"];
                      const rows = filteredPaymentPipeline.map(pay => {
                        const matchCol = currentCollections.find(c => c.farmerId === pay.farmerId && c.date === pay.date);
                        const farmer = farmers.find(f => f.id === pay.farmerId || f.name === pay.farmerName);
                        const vol = matchCol ? matchCol.weight : (pay.amount > 0 ? (pay.amount / 37.3) : 0);
                        const fat = matchCol ? matchCol.fat : 4.2;
                        const snf = matchCol ? matchCol.snf : 8.5;
                        const rate = matchCol ? matchCol.rate : (vol > 0 ? pay.amount / vol : 37.3);
                        const phone = farmer ? farmer.phone : "N/A";
                        const upi = farmer ? farmer.upiId : "name@upi";
                        const utr = pay.timeline.find(t => t.description.includes("UTR:"))?.description.split("UTR: ")[1] || "TXN32299915";
                        return [
                          pay.id,
                          pay.farmerId || "F-101",
                          `"${pay.farmerName}"`,
                          `"${phone}"`,
                          vol.toFixed(2),
                          fat.toFixed(1),
                          snf.toFixed(1),
                          rate.toFixed(2),
                          pay.amount.toFixed(2),
                          `"${pay.date}"`,
                          `"${pay.time}"`,
                          `"${pay.status}"`,
                          `"${upi}"`,
                          `"${utr}"`
                        ].join(",");
                      });

                      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `3T_Payment_Settlements_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span>Export Payments Excel CSV</span>
                  </button>
                </div>

              </div>

              {/* 10-Day Cycle Calendar & Settlement Navigator Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-premium-sm p-5 space-y-4">
                
                {/* Calendar Navigation Bar */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shadow-sm">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          10-Day Cycle Calendar
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">10 Days in One Page</span>
                      </div>
                      <h3 className="text-base font-black text-gray-900 mt-0.5">
                        {periodLabel}
                      </h3>
                    </div>
                  </div>

                  {/* Navigation Controls: Prev, Month/Year, Next, Period Pills, Jump to Today */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    
                    {/* Prev / Next 10-Day buttons */}
                    <div className="inline-flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1 space-x-1">
                      <button
                        type="button"
                        onClick={handlePrevPeriod}
                        className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-sm"
                        title="Previous 10-Day Period"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold font-mono px-2 text-gray-800">
                        {monthNames[tenDayMonth - 1]} {tenDayYear}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextPeriod}
                        className="p-1.5 rounded-lg hover:bg-white text-gray-700 hover:text-gray-900 transition-colors shadow-sm"
                        title="Next 10-Day Period"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick 10-Day Period Pills */}
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { setTenDayPeriod(1); setSelectedCalendarDay(null); setIsCalendarModeActive(true); }}
                        className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                          isCalendarModeActive && tenDayPeriod === 1
                            ? "bg-primary text-white shadow-sm font-extrabold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        1–10 (P1)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTenDayPeriod(2); setSelectedCalendarDay(null); setIsCalendarModeActive(true); }}
                        className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                          isCalendarModeActive && tenDayPeriod === 2
                            ? "bg-primary text-white shadow-sm font-extrabold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        11–20 (P2)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setTenDayPeriod(3); setSelectedCalendarDay(null); setIsCalendarModeActive(true); }}
                        className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                          isCalendarModeActive && tenDayPeriod === 3
                            ? "bg-primary text-white shadow-sm font-extrabold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        21–End (P3)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsCalendarModeActive(!isCalendarModeActive); setSelectedCalendarDay(null); }}
                        className={`px-2.5 py-1 rounded-lg transition-all text-xs ${
                          !isCalendarModeActive
                            ? "bg-gray-800 text-white shadow-sm font-extrabold"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                        title="View All History without date constraint"
                      >
                        ♾️ All Days
                      </button>
                    </div>

                    {/* Jump to Today Button */}
                    <button
                      type="button"
                      onClick={handleJumpToToday}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-colors flex items-center space-x-1"
                      title="Jump to Today's Date & Cycle"
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Today</span>
                    </button>

                    {/* Direct Custom Date Picker Input */}
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedCalendarDay || ""}
                        onChange={(e) => handleCustomDateChange(e.target.value)}
                        className="py-1 px-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-all cursor-pointer"
                        title="Pick specific date"
                      />
                    </div>
                  </div>
                </div>

                {/* 10-Day Interactive Day Strip (Horizontal Day-by-Day Cards) */}
                {isCalendarModeActive && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
                      <span>Interactive 10-Day Strip (Click any day to filter, or click All 10 Days):</span>
                      {selectedCalendarDay && (
                        <button
                          type="button"
                          onClick={() => setSelectedCalendarDay(null)}
                          className="text-emerald-700 hover:underline flex items-center space-x-1 font-extrabold"
                        >
                          <span>Showing: {selectedCalendarDay}</span>
                          <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[10px]">✕ Reset to All 10 Days</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2 pt-1 overflow-x-auto">
                      {/* Card 0: All 10 Days button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDay(null)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          selectedCalendarDay === null
                            ? "bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500"
                            : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-black uppercase">
                          <span>All 10 Days</span>
                          {selectedCalendarDay === null && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs font-mono font-black block ${selectedCalendarDay === null ? "text-emerald-100" : "text-gray-900"}`}>
                            ₹{(periodSummaryStats.totalAmount >= 1000 ? (periodSummaryStats.totalAmount / 1000).toFixed(1) + 'k' : periodSummaryStats.totalAmount.toFixed(0))}
                          </span>
                          <span className={`text-[10px] font-semibold block ${selectedCalendarDay === null ? "text-emerald-200" : "text-gray-500"}`}>
                            {periodSummaryStats.count} Total Txns
                          </span>
                        </div>
                      </button>

                      {/* Cards 1..N: Individual Days in the 10-Day Period */}
                      {periodDates.map((dStr) => {
                        const dayNum = parseInt(dStr.split("-")[2], 10);
                        const dayName = new Date(dStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
                        const stat = dayStatsMap[dStr] || { count: 0, totalAmount: 0, volume: 0 };
                        const isToday = dStr === getLocalDateString();
                        const isSelected = selectedCalendarDay === dStr;

                        return (
                          <button
                            key={dStr}
                            type="button"
                            onClick={() => setSelectedCalendarDay(prev => prev === dStr ? null : dStr)}
                            className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between min-w-[85px] ${
                              isSelected
                                ? "bg-primary text-white border-primary shadow-md ring-2 ring-emerald-400"
                                : isToday
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300"
                                : "bg-white hover:bg-gray-50 text-gray-800 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-emerald-200" : "text-gray-500"}`}>
                                {dayName}
                              </span>
                              {isToday && (
                                <span className={`text-[9px] font-black px-1 py-0.2 rounded font-mono ${
                                  isSelected ? "bg-white text-emerald-800" : "bg-emerald-600 text-white"
                                }`}>
                                  TODAY
                                </span>
                              )}
                            </div>

                            <div className="mt-1">
                              <span className={`text-base font-black font-mono leading-none block ${
                                isSelected ? "text-white" : "text-gray-900"
                              }`}>
                                {dayNum}
                              </span>
                            </div>

                            <div className="mt-1 pt-1 border-t border-gray-100/60">
                              <span className={`text-[11px] font-mono font-black block leading-none ${
                                isSelected ? "text-emerald-100" : stat.totalAmount > 0 ? "text-emerald-700" : "text-gray-400"
                              }`}>
                                {stat.totalAmount > 0 ? `₹${stat.totalAmount >= 1000 ? (stat.totalAmount / 1000).toFixed(1) + 'k' : stat.totalAmount.toFixed(0)}` : "—"}
                              </span>
                              <span className={`text-[9px] font-semibold block mt-0.5 ${
                                isSelected ? "text-emerald-200" : "text-gray-400"
                              }`}>
                                {stat.count > 0 ? `${stat.count} txns` : "No logs"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 10-Day Summary Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-gray-500 block">
                      {selectedCalendarDay ? "Active Day" : "10-Day Period"}
                    </span>
                    <span className="text-sm font-black text-gray-900 block truncate">
                      {selectedCalendarDay ? selectedCalendarDay : `Cycle ${tenDayPeriod}: Days ${periodDates[0]?.split('-')[2] || '1'}–${periodDates[periodDates.length - 1]?.split('-')[2] || '10'}`}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">Total Milk Volume</span>
                    <span className="text-base font-black text-emerald-900 font-mono block">
                      {periodSummaryStats.totalVolume.toFixed(1)} <span className="text-xs font-semibold">Liters</span>
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-700 text-white rounded-xl shadow-sm">
                    <span className="text-[10px] font-extrabold uppercase text-emerald-200 block">Total Payout Settled</span>
                    <span className="text-base font-black text-white font-mono block">
                      ₹{periodSummaryStats.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                    <span className="text-[10px] font-extrabold uppercase text-gray-500 block">Activity & Farmers</span>
                    <span className="text-sm font-black text-gray-900 font-mono block">
                      {periodSummaryStats.count} Txns <span className="text-xs font-normal text-gray-500">({periodSummaryStats.farmersCount} Farmers)</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Main Full-Width Payment Settlement Ledger Table */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-gray-200 gap-2">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Automated Settlement Feed</h3>
                    <p className="text-xs text-gray-600 font-medium">
                      Showing {filteredPaymentPipeline.length} settlement transaction log entries {isCalendarModeActive ? `for ${selectedCalendarDay ? selectedCalendarDay : periodLabel}` : '(All History)'}
                    </p>
                  </div>
                  {isCalendarModeActive && (
                    <div className="flex items-center space-x-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold">
                      <span>📅 10-Day Filter Active:</span>
                      <span className="font-mono">{selectedCalendarDay || `Period ${tenDayPeriod}`}</span>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-gray-100 text-[11px] font-bold uppercase text-gray-800 tracking-wider border-b-2 border-gray-300">
                        <th className="px-6 py-3.5">Txn ID & Date</th>
                        <th className="px-6 py-3.5">Farmer Profile</th>
                        <th className="px-6 py-3.5 text-center">Milk Volume</th>
                        <th className="px-6 py-3.5">UPI / Account</th>
                        <th className="px-6 py-3.5 text-right">Amount Settled</th>
                        <th className="px-6 py-3.5 text-center">Status</th>
                        <th className="px-6 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                      {filteredPaymentPipeline.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-xs font-semibold">
                            {paymentSearch ? (
                              <span>No payment settlement logs match &quot;{paymentSearch}&quot; in this 10-day period.</span>
                            ) : (
                              <span>No payment settlement logs recorded for {selectedCalendarDay || periodLabel}.</span>
                            )}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => { setIsCalendarModeActive(false); setSelectedCalendarDay(null); setPaymentSearch(""); }}
                                className="text-emerald-700 hover:underline font-bold text-xs"
                              >
                                View All Payout History Across All Dates →
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPaymentPipeline.map((pay) => {
                          const farmer = farmers.find(f => f.id === pay.farmerId || f.name === pay.farmerName);
                          const matchCol = currentCollections.find(c => c.farmerId === pay.farmerId && c.date === pay.date);
                          const vol = matchCol ? matchCol.weight : (pay.amount > 0 ? (pay.amount / 37.3) : 0);
                          const fat = matchCol ? matchCol.fat : 4.2;
                          const snf = matchCol ? matchCol.snf : 8.5;
                          const upi = farmer ? farmer.upiId : "name@upi";
                          const phone = farmer ? farmer.phone : "";

                          return (
                            <tr key={pay.id} className="hover:bg-gray-50 transition-colors">
                              {/* 1. Txn ID & Date */}
                              <td className="px-6 py-3.5">
                                <span className="font-mono text-black font-bold text-xs block">{pay.id}</span>
                                <span className="text-[11px] text-gray-600 block">{pay.date} | {formatToIndiaTime(pay.time)}</span>
                              </td>

                              {/* 2. Farmer Profile */}
                              <td className="px-6 py-3.5">
                                <span className="text-black font-bold text-sm block">{pay.farmerName}</span>
                                {phone && <span className="text-[11px] text-gray-600 block">📞 {phone}</span>}
                              </td>

                              {/* 3. Milk Volume */}
                              <td className="px-6 py-3.5 text-center">
                                <span className="inline-block bg-gray-100 text-black font-bold text-xs px-2.5 py-0.5 rounded border border-gray-300">
                                  {vol.toFixed(1)} L
                                </span>
                                <span className="text-[10px] text-gray-600 font-medium block mt-0.5">
                                  FAT: {fat}% · SNF: {snf}%
                                </span>
                              </td>

                              {/* 4. UPI / Account */}
                              <td className="px-6 py-3.5">
                                <span className="inline-block text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  🛡️ Direct Bank / UPI
                                </span>
                              </td>

                              {/* 5. Amount Settled */}
                              <td className="px-6 py-3.5 text-right">
                                <span className="text-black font-black text-sm font-mono inline-block">
                                  ₹{pay.amount.toFixed(2)}
                                </span>
                              </td>

                              {/* 6. Status */}
                              <td className="px-6 py-3.5 text-center">
                                <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                                  SUCCESS
                                </span>
                              </td>

                              {/* 7. Actions */}
                              <td className="px-6 py-3.5 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => setPrintedBillPayment(pay)}
                                    className="px-3 py-1 rounded bg-black hover:bg-gray-800 text-white text-xs font-bold transition-colors"
                                    title="Generate Official Slip / Receipt"
                                  >
                                    Receipt Bill
                                  </button>

                                  <button
                                    onClick={() => setSelectedPayment(pay)}
                                    className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-black text-xs font-semibold transition-colors"
                                    title="Inspect Gateway Trace Log"
                                  >
                                    Trace Log
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 10-Day Cycle Page Navigation Footer */}
                {isCalendarModeActive && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-gray-200 text-xs text-gray-600 font-bold gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">10-Day Cycle Page:</span>
                      <span className="bg-gray-100 text-gray-900 px-2.5 py-1 rounded-lg border border-gray-200 font-mono">
                        {periodLabel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handlePrevPeriod}
                        className="px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs transition-colors flex items-center space-x-1"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous 10 Days</span>
                      </button>

                      <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => { setTenDayPeriod(1); setSelectedCalendarDay(null); }}
                          className={`px-2 py-1 rounded ${tenDayPeriod === 1 ? 'bg-emerald-700 text-white' : 'text-gray-700'}`}
                        >
                          P1 (1–10)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTenDayPeriod(2); setSelectedCalendarDay(null); }}
                          className={`px-2 py-1 rounded ${tenDayPeriod === 2 ? 'bg-emerald-700 text-white' : 'text-gray-700'}`}
                        >
                          P2 (11–20)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTenDayPeriod(3); setSelectedCalendarDay(null); }}
                          className={`px-2 py-1 rounded ${tenDayPeriod === 3 ? 'bg-emerald-700 text-white' : 'text-gray-700'}`}
                        >
                          P3 (21–End)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextPeriod}
                        className="px-3 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold text-xs transition-colors flex items-center space-x-1"
                      >
                        <span>Next 10 Days</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. COLLECTION CENTERS (BRANCHES) TAB */}
          {/* ============================================================== */}
          {activeTab === "branches" && (
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Left Branches list */}
              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6 h-fit">
                {branches.map((b) => (
                  <div key={b.id} className="p-6 bg-white rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between space-y-4 hover:border-primary transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-text-muted font-mono">{b.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          b.status === "Active" ? "bg-primary-light text-primary" : "bg-amber-100 text-amber-700"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-base text-text-main">{b.name}</h4>
                      <p className="text-xs text-text-muted font-medium mt-1">Manager: {b.manager}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-light gap-2">
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-text-muted">
                        <div>
                          <span className="text-[9px] block text-text-muted font-medium uppercase tracking-wider">Capacity</span>
                          <span className="text-text-main font-bold text-[11px]">{b.capacity.toLocaleString()} L</span>
                        </div>
                        <div>
                          <span className="text-[9px] block text-text-muted font-medium uppercase tracking-wider">Today</span>
                          <span className="text-primary font-bold text-[11px]">{b.todayCollection.toFixed(1)} L</span>
                        </div>
                      </div>
                      <Link
                        href={`/branch/${b.id}`}
                        target="_blank"
                        className="px-3 py-2 bg-primary hover:bg-[#0b6b49] text-white rounded-lg font-bold text-[10px] flex items-center space-x-1 shadow-sm shrink-0 transition-all"
                      >
                        <span>Terminal</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right SVGs/Mock Map visualizer */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-main">Geographic Hub Map</h3>
                  <p className="text-xs text-text-muted font-medium">Regional coverage nodes (Anand District Hub)</p>
                </div>

                <div className="relative w-full aspect-square border border-border-light rounded-xl bg-gray-50 flex items-center justify-center my-6 overflow-hidden">
                  
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid-bg opacity-10" />

                  {/* SVG Nodes */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    {/* Mock region routes */}
                    <path d="M 25 30 L 35 40 L 45 55 L 55 70" fill="none" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2 2" />
                    <path d="M 65 45 L 45 55" fill="none" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="2 2" />
                    
                    {branches.map((b) => (
                      <g key={b.id}>
                        {b.status === "Active" && (
                          <circle cx={b.x} cy={b.y} r="3" fill="#0F8A5F" opacity="0.3" className="animate-ping" style={{ transformOrigin: `${b.x}px ${b.y}px` }} />
                        )}
                        <circle
                          cx={b.x}
                          cy={b.y}
                          r="2"
                          fill={b.status === "Active" ? "#0F8A5F" : "#F6B73C"}
                          className="cursor-pointer"
                        />
                        <text x={b.x + 3} y={b.y + 1} fontSize="3" fontWeight="bold" fill="#1A1A1A">{b.name.split(" ")[0]}</text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="pt-4 border-t border-border-light flex items-center justify-between text-xs font-semibold text-text-muted">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Total Regional centers:</span>
                  </span>
                  <span className="text-text-main font-bold">{branches.length} Hubs</span>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* 6. ANALYTICS HUB TAB */}
          {/* ============================================================== */}
          {activeTab === "analytics" && (
            <div className="space-y-8">
              
              {/* Daily / Monthly charts */}
              <div className="grid md:grid-cols-2 gap-8">
                
                {/* Volume bar chart */}
                <div className="bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-text-main">Branch Wise Milk Collected</h3>
                    <p className="text-xs text-text-muted font-medium">Capacity vs actual daily volume loaded</p>
                  </div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branches} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis dataKey="name" tickLine={false} style={{ fontSize: "9px", fontWeight: 600, fill: "#707070" }} />
                        <YAxis tickLine={false} style={{ fontSize: "10px", fontWeight: 600, fill: "#707070" }} />
                        <Tooltip />
                        <Bar dataKey="todayCollection" fill="#0F8A5F" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="capacity" fill="#E7F6F0" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Growth line chart */}
                <div className="bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-text-main">Disbursements Dispatched</h3>
                      <p className="text-xs text-text-muted font-medium">Daily cumulative UPI payout outflow to farmers</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-primary bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm">
                        Total: ₹{disbursementTrends.reduce((sum, d) => sum + d.amount, 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="h-[280px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height={280} minWidth={100}>
                      <AreaChart data={disbursementTrends} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                        <defs>
                          <linearGradient id="moneyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0F8A5F" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#0F8A5F" stopOpacity={0.03}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                        <XAxis 
                          dataKey="displayDate" 
                          tickLine={false} 
                          axisLine={{ stroke: "#E5E7EB" }}
                          style={{ fontSize: "11px", fontWeight: 700, fill: "#4B5563" }} 
                        />
                        <YAxis 
                          tickLine={false} 
                          axisLine={{ stroke: "#E5E7EB" }}
                          style={{ fontSize: "10px", fontWeight: 600, fill: "#6B7280" }}
                          tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                        />
                        <Tooltip 
                          formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Total Disbursed"]}
                          labelFormatter={(label: any) => `Date: ${label}`}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontWeight: 700 }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#0F8A5F" 
                          strokeWidth={3} 
                          dot={{ r: 4, fill: "#0F8A5F", strokeWidth: 2, stroke: "#FFFFFF" }}
                          activeDot={{ r: 6, fill: "#0F8A5F" }}
                          fillOpacity={1} 
                          fill="url(#moneyGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Pie success charts */}
              <div className="bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                <div>
                  <h3 className="text-base font-bold text-text-main">Payment Success Statistics</h3>
                  <p className="text-xs text-text-muted font-medium">Distribution breakdown of instant settlements</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div className="h-[200px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Success", value: 99.8, color: "#0F8A5F" },
                            { name: "Bank Processing", value: 0.15, color: "#F6B73C" },
                            { name: "Failed", value: 0.05, color: "#EF4444" }
                          ]}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#0F8A5F" />
                          <Cell fill="#F6B73C" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="md:col-span-2 space-y-4 text-xs font-semibold text-text-muted">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-border-light">
                      <div className="flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-primary" />
                        <span className="text-text-main font-bold">Automatic Settlement Success</span>
                      </div>
                      <span className="text-primary font-extrabold">99.80%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-border-light">
                      <div className="flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-accent" />
                        <span className="text-text-main font-bold">API Bank Queued</span>
                      </div>
                      <span className="text-accent font-extrabold">0.15%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-border-light">
                      <div className="flex items-center space-x-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500" />
                        <span className="text-text-main font-bold">Settlement Rejections</span>
                      </div>
                      <span className="text-red-500 font-extrabold">0.05%</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* 7. EXPORTS & REPORTS TAB */}
          {/* ============================================================== */}
          {activeTab === "reports" && (
            <div className="max-w-3xl mx-auto space-y-8">
              
              <div className="bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm">
                <div className="flex items-center space-x-2 text-primary font-bold mb-4">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h3 className="text-base font-extrabold text-text-main">Export Custom Delivery Sheets</h3>
                </div>

                <form onSubmit={handleGenerateReport} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Branch Select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-main">Filter Center</label>
                      <select
                        value={reportBranch}
                        onChange={(e) => setReportBranch(e.target.value)}
                        className="w-full p-3 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA]"
                      >
                        <option value="All">All regional centers</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-main">Reporting Date</label>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main block">Export Layout Format</label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: "excel", label: "Excel (XLSX/CSV)" },
                        { id: "csv", label: "CSV Spreadsheet" },
                        { id: "pdf", label: "PDF / Text Voucher" }
                      ].map((fmt) => {
                        const isSelected = reportFormat === fmt.id;
                        return (
                          <button
                            key={fmt.id}
                            type="button"
                            onClick={() => setReportFormat(fmt.id as any)}
                            className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                              isSelected
                                ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm"
                                : "border-border-light text-text-muted hover:border-primary hover:text-primary bg-[#FAFAFA]"
                            }`}
                          >
                            {fmt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isGeneratingReport}
                    className="px-6 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-[#0b6b49] transition-all text-xs flex items-center space-x-2 shadow-premium-sm disabled:opacity-50"
                  >
                    {isGeneratingReport ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Compiling logs...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Generate &amp; Export Document</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Generated text report container */}
              <AnimatePresence>
                {generatedReportText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gray-50 border border-border-light rounded-2xl shadow-premium-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-border-light">
                      <span className="text-xs font-bold text-text-main">Generated Report Preview</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => triggerReportDownload()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download File Again</span>
                        </button>
                        <button 
                          onClick={() => setGeneratedReportText(null)}
                          className="text-text-muted hover:text-text-main text-xs font-bold px-2 py-1"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs font-mono text-text-main leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {generatedReportText}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* ============================================================== */}
          {/* 8. PRICING FORMULA SETTINGS TAB */}
          {/* ============================================================== */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6">
              
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border-light shadow-premium-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-border-light">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-primary-light text-primary rounded-xl">
                      <Sliders className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-text-main">Pricing Engine Configuration</h3>
                      <p className="text-xs font-semibold text-text-muted mt-0.5">
                        Configure the dynamic milk rate engine parameters. Rates update across all collection terminals in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Reset Defaults */}
                  <button
                    type="button"
                    onClick={() => {
                      const def = { basePrice: 15, fatFactor: 5.5, snfFactor: 2 };
                      setDraftFormulaConfig(def);
                      setConfirmPricingModal(def);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-border-light text-text-muted hover:text-text-main text-xs font-bold hover:bg-gray-50 transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Form Controls with Dual Number & Sliders */}
                <div className="space-y-6">
                  {/* 1. Base Price */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-border-light space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-text-main block">1. Base Milk Price (₹ / Liter)</label>
                        <span className="text-[10px] text-text-muted font-medium">Guaranteed baseline price paid for every liter of milk</span>
                      </div>
                      <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                        <span className="text-xs font-bold text-text-muted">₹</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={draftFormulaConfig.basePrice}
                          onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-24 p-1.5 text-right font-mono font-bold text-sm bg-white border border-border-light rounded-lg text-text-main focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      step="0.5"
                      value={draftFormulaConfig.basePrice}
                      onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* 2. FAT Multiplier */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-border-light space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-text-main block">2. FAT Multiplier Factor</label>
                        <span className="text-[10px] text-text-muted font-medium">Bonus rate added for each 1.0% of butterfat measured</span>
                      </div>
                      <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          value={draftFormulaConfig.fatFactor}
                          onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, fatFactor: parseFloat(e.target.value) || 0 }))}
                          className="w-24 p-1.5 text-right font-mono font-bold text-sm bg-white border border-border-light rounded-lg text-text-main focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs font-bold text-text-muted">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      step="0.1"
                      value={draftFormulaConfig.fatFactor}
                      onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, fatFactor: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* 3. SNF Multiplier */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-border-light space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-text-main block">3. SNF Multiplier Factor</label>
                        <span className="text-[10px] text-text-muted font-medium">Bonus rate added for each 1.0% of Solid-Not-Fat measured</span>
                      </div>
                      <div className="flex items-center space-x-1.5 self-start sm:self-auto">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="15"
                          value={draftFormulaConfig.snfFactor}
                          onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, snfFactor: parseFloat(e.target.value) || 0 }))}
                          className="w-24 p-1.5 text-right font-mono font-bold text-sm bg-white border border-border-light rounded-lg text-text-main focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs font-bold text-text-muted">x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.1"
                      value={draftFormulaConfig.snfFactor}
                      onChange={(e) => setDraftFormulaConfig(prev => ({ ...prev, snfFactor: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* Save Button & Feedback Alert */}
                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setConfirmPricingModal(draftFormulaConfig)}
                    disabled={isSavingPricing}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm shadow-premium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSavingPricing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>💾 Save Pricing Configuration</span>
                      </>
                    )}
                  </button>

                  {pricingSuccessMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center space-x-1.5"
                    >
                      <span>{pricingSuccessMsg}</span>
                    </motion.div>
                  )}
                </div>

                {/* Live Formula Preview Card */}
                <div className="mt-8 p-5 bg-primary-light/40 border border-primary/20 rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
                    Dynamic Pricing Formula Equation
                  </span>
                  <div className="text-base font-mono font-extrabold text-text-main mt-2 leading-relaxed">
                    Rate / L = ₹{draftFormulaConfig.basePrice.toFixed(2)} + (FAT % × {draftFormulaConfig.fatFactor}) + (SNF % × {draftFormulaConfig.snfFactor})
                  </div>
                  <p className="text-[11px] font-semibold text-text-muted mt-2">
                    Example: At 4.2% FAT & 8.5% SNF, the rate is ₹{(draftFormulaConfig.basePrice + 4.2 * draftFormulaConfig.fatFactor + 8.5 * draftFormulaConfig.snfFactor).toFixed(2)}/Liter.
                  </p>
                </div>
              </div>

              {/* Sub-hubs webhook setup */}
              <div className="bg-white p-6 rounded-2xl border border-border-light shadow-premium-sm flex flex-col space-y-4">
                <div className="flex items-center space-x-2 text-primary font-bold">
                  <Building className="w-5 h-5" />
                  <h3 className="text-sm font-extrabold text-text-main">API Integration Secret</h3>
                </div>
                <p className="text-xs text-text-muted font-medium">
                  Connect third-party smart scales to the 3T settlement gateway via secure webhook.
                </p>
                <div className="p-3 bg-gray-100 rounded-lg font-mono text-[10px] text-text-main border border-border-light select-all">
                  3t_settle_sec_prod_89182390_x29a1
                </div>
              </div>
            </div>
          )}

          {/* Farmer Messages & Broadcast Tab */}
          {activeTab === "broadcast" && <BroadcastTab />}

        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirmModal && (
          <React.Fragment key="modal-logout-confirm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingOut && setShowLogoutConfirmModal(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs transition-opacity"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed inset-0 m-auto max-w-[390px] h-fit bg-white z-50 p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xl flex flex-col"
            >
              {/* Top Row: Icon & Close */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100/80 shadow-xs">
                  <LogOut className="w-5 h-5 ml-0.5" />
                </div>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="font-bold text-base text-gray-900 tracking-tight">Sign out of 3T Dairy?</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to end your current session? You will need to sign in again to access the management portal.
                </p>
              </div>

              {/* Minimalist User Pill */}
              <div className="mt-4 p-3 bg-gray-50/80 border border-gray-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {userRole === "admin" ? "SK" : "OP"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {userRole === "admin" ? (userSession?.name || "Sandesh Kadam") : (userSession?.name || "Center Operator")}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">
                      {userSession?.email || "3t@adminlogin"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  {userRole === "admin" ? "Owner" : "Staff"}
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutConfirmModal(false)}
                  className="w-full py-2.5 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={executeLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center space-x-1.5 disabled:opacity-60"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <span>Sign Out</span>
                  )}
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Verify & Dispatch Payment Confirmation Modal */}
      <AnimatePresence>
        {dispatchConfirmation && (
          <React.Fragment key="modal-dispatch-confirm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDispatchConfirmation(null)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto max-w-lg h-fit max-h-[92vh] overflow-y-auto bg-white z-50 p-6 sm:p-7 rounded-3xl border border-border-light shadow-2xl flex flex-col space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-border-light">
                <div className="flex items-center space-x-3 text-primary">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Step 2: Farmer Name Verification
                    </span>
                    <h4 className="font-black text-lg text-text-main mt-0.5">Confirm Farmer &amp; Payout</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchConfirmation(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Farmer Name Confirmation Hero Card */}
              <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-400/60 p-4 sm:p-5 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                    {dispatchConfirmation.farmer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded">
                        {dispatchConfirmation.farmer.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded uppercase">
                        {dispatchConfirmation.shift} Shift
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mt-1 truncate">
                      {dispatchConfirmation.farmer.name}
                    </h3>
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">
                      📍 {dispatchConfirmation.farmer.village} • 📞 <span className="font-mono">{dispatchConfirmation.farmer.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Verbal Confirmation Question Box */}
                <div className="bg-white/90 border border-emerald-300/80 rounded-xl p-3 text-xs text-gray-800 shadow-sm space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wide">
                    <span>⚠️</span>
                    <span>Intake Counter Confirmation Check:</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    Please confirm directly with the farmer standing at the milk scale:
                    <br />
                    <span className="text-emerald-950 font-black text-sm block mt-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      &quot;Are you <span className="underline decoration-emerald-600 decoration-2">{dispatchConfirmation.farmer.name}</span>?&quot;
                    </span>
                  </p>
                </div>

                {dispatchConfirmation.farmer.upiId && (
                  <div className="text-[11px] text-emerald-900 font-mono font-bold bg-white/70 p-2 rounded-lg border border-emerald-200/60 flex items-center justify-between">
                    <span>💳 Payout Destination:</span>
                    <span className="truncate max-w-[200px]">{dispatchConfirmation.farmer.upiId}</span>
                  </div>
                )}
              </div>

              {/* Delivery & Rate Breakdown Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Weight</span>
                  <span className="text-base font-black text-gray-900 font-mono">{dispatchConfirmation.weight.toFixed(1)} L</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Quality</span>
                  <span className="text-sm font-extrabold text-gray-900">{dispatchConfirmation.fat.toFixed(1)}% / {dispatchConfirmation.snf.toFixed(1)}%</span>
                  <span className="text-[9px] text-gray-400 font-semibold block">FAT / SNF</span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl">
                  <span className="text-[10px] text-gray-500 font-bold block uppercase">Rate / L</span>
                  <span className="text-base font-black text-emerald-700 font-mono">₹{dispatchConfirmation.rate.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Payout Callout */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 rounded-2xl text-white shadow-lg space-y-1">
                <div className="flex items-center justify-between text-[11px] text-emerald-100 font-bold">
                  <span>TOTAL PAYABLE TO {dispatchConfirmation.farmer.name.toUpperCase()}</span>
                  <span>⚡ Instant UPI Settlement</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-black font-mono">₹{dispatchConfirmation.totalPayout.toFixed(2)}</span>
                  <span className="text-xs text-emerald-200 font-semibold font-mono">
                    ({dispatchConfirmation.weight.toFixed(1)} L × ₹{dispatchConfirmation.rate.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setDispatchConfirmation(null)}
                  className="py-3 px-4 rounded-xl border-2 border-gray-300 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <X className="w-4 h-4 text-rose-500" />
                  <span>No, Wrong Farmer (Cancel)</span>
                </button>
                <button
                  type="button"
                  onClick={executeConfirmDispatch}
                  disabled={isSubmittingCollection}
                  className="py-3 px-4 rounded-xl bg-primary hover:bg-[#0b6b49] text-white font-black text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {isSubmittingCollection ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Payout...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Yes, Dispatch ₹{dispatchConfirmation.totalPayout.toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Confirmation Popup Modal for Pricing Engine Configuration */}
      <AnimatePresence>
        {confirmPricingModal && (
          <React.Fragment key="modal-confirm-pricing">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmPricingModal(null)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="fixed inset-0 m-auto max-w-md sm:max-w-lg h-fit bg-white z-50 p-6 sm:p-7 rounded-3xl border border-border-light shadow-2xl flex flex-col space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-light">
                <div className="flex items-center space-x-3 text-primary">
                  <div className="p-2.5 bg-primary-light rounded-xl">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-text-main">Save New Milk Pricing?</h4>
                    <p className="text-[11px] font-semibold text-text-muted">Do you want to save and apply this price formula across all collection centers?</p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfirmPricingModal(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-text-muted hover:text-text-main transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Comparison Summary */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-border-light space-y-3 text-xs font-semibold">
                <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-border-light text-[11px] font-extrabold text-text-muted uppercase tracking-wider">
                  <span className="text-left">Parameter</span>
                  <span>Current</span>
                  <span className="text-primary">New Proposed</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <span className="text-left font-bold text-text-main">Base Price</span>
                  <span className="text-text-muted font-mono">₹{formulaConfig.basePrice.toFixed(2)}/L</span>
                  <span className="text-primary font-bold font-mono bg-primary-light/60 py-1 rounded-lg">₹{confirmPricingModal.basePrice.toFixed(2)}/L</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <span className="text-left font-bold text-text-main">FAT Factor</span>
                  <span className="text-text-muted font-mono">{formulaConfig.fatFactor}x</span>
                  <span className="text-primary font-bold font-mono bg-primary-light/60 py-1 rounded-lg">{confirmPricingModal.fatFactor}x</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center items-center">
                  <span className="text-left font-bold text-text-main">SNF Factor</span>
                  <span className="text-text-muted font-mono">{formulaConfig.snfFactor}x</span>
                  <span className="text-primary font-bold font-mono bg-primary-light/60 py-1 rounded-lg">{confirmPricingModal.snfFactor}x</span>
                </div>
              </div>

              {/* Quality Sample Rate Impact */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
                <div>
                  <span className="block font-bold">Standard Cow Milk (4.2% FAT / 8.5% SNF)</span>
                  <span className="text-[11px] text-emerald-700">Rate will change from ₹{(formulaConfig.basePrice + 4.2 * formulaConfig.fatFactor + 8.5 * formulaConfig.snfFactor).toFixed(2)}/L</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-800 font-mono block">
                    ➔ ₹{(confirmPricingModal.basePrice + 4.2 * confirmPricingModal.fatFactor + 8.5 * confirmPricingModal.snfFactor).toFixed(2)}/L
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setConfirmPricingModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-border-light text-text-muted hover:text-text-main font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel / Keep Current
                </button>
                <button
                  type="button"
                  disabled={isSavingPricing}
                  onClick={() => handleSavePricing(confirmPricingModal)}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-extrabold text-xs shadow-premium transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSavingPricing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Price...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>✓ Yes, Save & Apply Price</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Payment Trace Modal (Global Overlay) */}
      <AnimatePresence>
        {selectedPayment && (
          <React.Fragment key="modal-selected-payment">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPayment(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-6 rounded-2xl border border-border-light shadow-premium-lg flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-light">
                <div className="flex items-center space-x-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <h4 className="font-extrabold text-sm text-text-main">Transaction Settlement Trace</h4>
                </div>
                <button 
                  onClick={() => setSelectedPayment(null)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <span className="text-text-muted">Farmer:</span>
                  <span className="text-text-main font-bold text-right">{selectedPayment.farmerName}</span>
                  <span className="text-text-muted">Payout:</span>
                  <span className="text-primary font-extrabold text-right">₹{selectedPayment.amount.toFixed(2)}</span>
                  <span className="text-text-muted">Bank Status:</span>
                  <span className="text-primary font-bold text-right">SETTLED</span>
                </div>

                <div className="pt-4 border-t border-border-light space-y-4 pl-4 relative border-l-2 border-primary-light">
                  {selectedPayment.timeline.map((step, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-primary flex items-center justify-center text-white border-2 border-white shadow-sm" />
                      <div className="flex justify-between font-bold text-text-main">
                        <span>{step.label}</span>
                        <span className="text-[9px] text-text-muted font-medium">{step.time}</span>
                      </div>
                      <p className="text-[9px] text-text-muted font-semibold leading-relaxed mt-0.5">{step.description}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-gray-100 flex flex-col space-y-2">
                  {selectedPayment.status === "Success" ? (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-300 flex items-center justify-center space-x-2">
                      <span>✅</span>
                      <span>Payment Settled & Verified (Double-Payout Blocked)</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRazorpayPayment(selectedPayment)}
                      disabled={processingRazorpayId === selectedPayment.id}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 border border-emerald-700 disabled:opacity-50"
                    >
                      <span>💳</span>
                      <span>{processingRazorpayId === selectedPayment.id ? "Processing Razorpay..." : "Re-try Razorpay Instant Payout"}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}

        {/* Anti-Fraud Collusion Lock Modal Overlay */}
        {fraudModalData && (
          <React.Fragment key="modal-fraud-lock">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setFraudModalData(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-[#FAFAFA] z-50 p-6 rounded-2xl border-2 border-red-500 shadow-2xl flex flex-col space-y-4 font-sans"
            >
              <div className="flex items-center space-x-3 text-red-600 pb-3 border-b border-red-100">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-black text-xl shrink-0">
                  🚨
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-red-700">ANTI-FRAUD COLLUSION LOCK</h4>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Duplicate Shift Payout Blocked</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 font-medium leading-relaxed">
                  Farmer <span className="font-bold underline">{fraudModalData.farmerName} ({fraudModalData.farmerId})</span> has <strong>ALREADY</strong> delivered milk and received payout for today&apos;s <strong>{fraudModalData.shift} Shift</strong>.
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Log ID:</span>
                    <span className="font-bold text-gray-800">{fraudModalData.existingLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Volume Logged:</span>
                    <span className="font-bold text-gray-800">{fraudModalData.existingLog.weight} Liters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shift Time:</span>
                    <span className="font-bold text-gray-800">{fraudModalData.existingLog.time} ({fraudModalData.existingLog.date})</span>
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                  🛡️ <strong>Rule Enforcement:</strong> Multiple logs in the same shift are locked to prevent operator-farmer collusion and double payment fraud.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFraudModalData(null)}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-all"
                >
                  Enforce Lock
                </button>
                <a
                  href="mailto:dairy3t@gmail.com?subject=3T%20Anti-Fraud%20Lock%20Inquiry"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact 3T</span>
                </a>
              </div>
            </motion.div>
          </React.Fragment>
        )}

        {/* KYC Registration Modal */}
        {isKycOpen && (
          <React.Fragment key="modal-kyc-registration">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsKycOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg h-fit bg-white z-50 p-6 rounded-2xl border border-border-light shadow-premium-lg flex flex-col space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-light">
                <div className="flex items-center space-x-2 text-primary">
                  <Users className="w-5 h-5" />
                  <h4 className="font-extrabold text-sm text-text-main">New Farmer KYC Registration</h4>
                </div>
                <button
                  onClick={() => setIsKycOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {kycError && (
                <div className="p-3 bg-red-50 text-red-500 rounded-xl border border-red-200 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{kycError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterFarmer} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Dattatray Patil"
                      value={kycName}
                      onChange={(e) => setKycName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Phone Number</label>
                    <input
                      type="text"
                      value={kycPhone}
                      onChange={(e) => setKycPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-main">Animals Owned</label>
                  <input
                    type="number"
                    min="1"
                    value={kycAnimals}
                    onChange={(e) => setKycAnimals(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-main">Aadhaar Card Number (12 Digits)</label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="12-digit Aadhaar UID"
                    value={kycAadhaar}
                    onChange={(e) => setKycAadhaar(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                    required
                  />
                </div>

                <div className="border-t border-border-light pt-4 space-y-4">
                  <h5 className="font-bold text-xs text-primary uppercase tracking-wider">Bank Settlement Details</h5>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Account Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 30281982739"
                        value={kycBankNo}
                        onChange={(e) => setKycBankNo(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        required
                      />
                    </div>

                    {/* IFSC Code */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">IFSC Code</label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0001234"
                        value={kycIfsc}
                        onChange={(e) => setKycIfsc(e.target.value.toUpperCase())}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        required
                      />
                    </div>
                  </div>

                  {/* UPI ID */}
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">UPI ID (for Instant Payments)</label>
                    <input
                      type="text"
                      placeholder="e.g. name@upi"
                      value={kycUpi}
                      onChange={(e) => setKycUpi(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-border-light">
                  <button
                    type="button"
                    onClick={() => setIsKycOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-border-light text-text-muted font-bold hover:bg-gray-50 text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegisteringKyc}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-[#0b6b49] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isRegisteringKyc ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying KYC...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Registration & Send OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </React.Fragment>
        )}

        {/* Hackathon SMS OTP Verification Modal */}
        {isOtpModalOpen && (
          <React.Fragment key="modal-sms-otp">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOtpModalOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-6 rounded-2xl border-2 border-emerald-500 shadow-2xl flex flex-col space-y-4 font-sans"
            >
              <div className="flex items-center space-x-3 text-emerald-700 pb-3 border-b border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-black text-xl shrink-0">
                  📲
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">SMS OTP Verification</h4>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Mobile Number Authorization</p>
                </div>
              </div>

              <form onSubmit={handleVerifyOtpAndSave} className="space-y-4 text-xs">
                {/* Simulated SMS Toast Notice */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>📲 SMS Gateway Broadcast:</span>
                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[9px]">LIVE DEMO</span>
                  </div>
                  <p className="text-[11px] font-mono">
                    Verification code for <strong>{pendingKycData?.phone}</strong>: <span className="text-emerald-700 font-extrabold text-sm underline">{generatedOtp}</span>
                  </p>
                </div>

                {otpError && (
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-200">
                    {otpError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-800">Enter 4-Digit Verification OTP</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit code (e.g. 8492)"
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-3 rounded-xl border-2 border-emerald-300 font-mono font-extrabold text-center text-lg bg-[#FAFAFA] tracking-widest focus:border-emerald-600 outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOtpModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRegisteringKyc}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    {isRegisteringKyc ? "Verifying..." : "Verify OTP & Complete KYC"}
                  </button>
                </div>
              </form>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Enterprise Authentication Gateway Modal */}
      {isAuthModalOpen && (
        <>
          <div
            onClick={() => {
              if (userSession) setIsAuthModalOpen(false);
            }}
            className="fixed inset-0 bg-black/80 z-50 transition-opacity backdrop-blur-md"
          />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-8 rounded-3xl border border-border-light shadow-2xl flex flex-col space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-light">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-primary font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-text-main">3T Security Gateway</h4>
                  <p className="text-xs text-text-muted font-medium">Enterprise Single Sign-On Portal</p>
                </div>
              </div>
              {userSession && (
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full text-text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {authError && (
              <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-semibold flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleEnterpriseLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-main">Email or Username</label>
                <input
                  type="text"
                  placeholder="name@organization.com"
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-primary transition-all"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-main">Password</label>
                  <a href="/login" className="text-xs font-bold text-primary hover:underline">
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPasswordToggle ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={loginPasswordInput}
                    onChange={(e) => setLoginPasswordInput(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-3.5 rounded-xl border border-border-light text-xs font-semibold bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-primary transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
                  >
                    {showPasswordToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 rounded-xl bg-primary text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#0b6b49] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isAuthenticating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Secure Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Official 3T Farmer Milk Receipt Bill Modal */}
      <AnimatePresence>
        {printedBillPayment && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setPrintedBillPayment(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg h-fit bg-white z-50 p-6 rounded-2xl border border-border-light shadow-premium-lg flex flex-col space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Receipt Header (Modal Header) */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 no-print">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-black text-sm">
                    3T
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-black uppercase tracking-wide">Official Dairy Settlement Slip</h3>
                    <p className="text-[10px] text-gray-700 font-bold">Village Milk Collection Center B-01</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPrintedBillPayment(null);
                    setReceiptPeriod("single");
                  }}
                  className="p-1 hover:bg-gray-100 rounded text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Period Selector Bar (Screen Only) */}
              <div className="p-1 bg-gray-100 rounded-lg border border-black text-xs font-bold flex items-center justify-between no-print">
                {[
                  { id: "single", label: "Single Slip" },
                  { id: "8days", label: "8 Days" },
                  { id: "15days", label: "15 Days" },
                  { id: "month", label: "30 Days (Monthly)" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setReceiptPeriod(tab.id as any)}
                    className={`flex-1 py-1 rounded text-[11px] transition-all ${
                      receiptPeriod === tab.id
                        ? "bg-black text-white shadow-sm font-extrabold"
                        : "text-gray-700 hover:text-black font-semibold"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Printable Official Monochromatic Paper Receipt Container */}
              {(() => {
                const pay = printedBillPayment;
                const farmer = farmers.find(f => f.id.toUpperCase() === (pay.farmerId || "").toUpperCase() || f.name.toLowerCase() === (pay.farmerName || "").toLowerCase());
                const farmerId = pay.farmerId || farmer?.id || "F-101";

                let daysCount = 1;
                if (receiptPeriod === "8days") daysCount = 8;
                if (receiptPeriod === "15days") daysCount = 15;
                if (receiptPeriod === "month") daysCount = 30;

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - (daysCount - 1));
                const cutoffStr = cutoffDate.toISOString().split("T")[0];

                // Smart match: exact shift total match first, then date match
                const matchCol = currentCollections.find(c => 
                  c.farmerId?.toUpperCase() === farmerId.toUpperCase() && 
                  c.date === pay.date && 
                  Math.abs(c.total - pay.amount) < 1
                ) || currentCollections.find(c => 
                  c.farmerId?.toUpperCase() === farmerId.toUpperCase() && 
                  c.date === pay.date
                );
                
                const farmerPeriodCollections = receiptPeriod === "single"
                  ? (matchCol ? [matchCol] : [])
                  : currentCollections.filter(c => c.farmerId?.toUpperCase() === farmerId.toUpperCase() && c.date >= cutoffStr);

                const currentUnitRate = formulaConfig.basePrice + 4.2 * formulaConfig.fatFactor + 8.5 * formulaConfig.snfFactor;
                const totalPeriodVol = receiptPeriod === "single" 
                  ? (matchCol ? matchCol.weight : (pay.amount > 0 ? (pay.amount / (currentUnitRate > 0 ? currentUnitRate : 37.3)) : 0))
                  : farmerPeriodCollections.reduce((sum, c) => sum + c.weight, 0);

                const totalPeriodPayout = receiptPeriod === "single"
                  ? pay.amount
                  : farmerPeriodCollections.reduce((sum, c) => sum + c.total, 0);

                const avgPeriodFat = farmerPeriodCollections.length > 0 
                  ? (farmerPeriodCollections.reduce((sum, c) => sum + c.fat, 0) / farmerPeriodCollections.length) 
                  : (matchCol ? matchCol.fat : (farmer?.avgFat || 0));

                const avgPeriodSnf = farmerPeriodCollections.length > 0 
                  ? (farmerPeriodCollections.reduce((sum, c) => sum + c.snf, 0) / farmerPeriodCollections.length) 
                  : (matchCol ? matchCol.snf : (farmer?.avgSnf || 0));

                const utr = pay.timeline?.find(t => t.description.includes("UTR:"))?.description.split("UTR: ")[1] || "TXN32299915";

                return (
                  <div className="space-y-3 bg-white text-black font-sans border-2 border-black p-4 rounded-none shadow-none text-xs">
                    
                    {/* Official Receipt Header */}
                    <div className="text-center border-b-2 border-black pb-2 space-y-0.5">
                      <h2 className="text-sm font-black tracking-wider uppercase text-black">3T VILLAGE MILK PRODUCERS CO-OPERATIVE</h2>
                      <p className="text-[10px] font-bold text-black uppercase">Center B-01 · Official Milk Settlement Slip</p>
                      <p className="text-[9px] font-mono text-black">Generated: {new Date().toISOString().split("T")[0]} | UTR: {utr}</p>
                    </div>

                    {/* Farmer Details Box */}
                    <div className="border border-black p-2 bg-gray-50/50 text-[10px] grid grid-cols-2 gap-x-4 gap-y-1 text-black font-semibold">
                      <div><span className="font-bold">Farmer Name:</span> <span className="font-black text-xs">{pay.farmerName}</span></div>
                      <div><span className="font-bold">Farmer ID:</span> <span className="font-mono font-black">{farmerId}</span></div>
                      <div><span className="font-bold">Phone:</span> {farmer?.phone || "N/A"}</div>
                      <div><span className="font-bold">UPI ID:</span> {farmer?.upiId || "name@upi"}</div>
                      <div><span className="font-bold">Bank A/C:</span> {farmer?.bankAccount ? maskBankAccount(farmer.bankAccount) : "N/A"}</div>
                      <div><span className="font-bold">Period:</span> {receiptPeriod === "single" ? `Single (${pay.date})` : `${daysCount} Days (${cutoffStr} - ${new Date().toISOString().split("T")[0]})`}</div>
                    </div>

                    {/* Summary Header Box */}
                    <div className="border border-black p-2 bg-gray-100/90 grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-black">
                      <div>
                        <span className="block text-[8px] uppercase text-gray-700">Total Volume</span>
                        <span className="text-xs font-black">{totalPeriodVol.toFixed(1)} L</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-gray-700">Avg FAT %</span>
                        <span className="text-xs font-black">{avgPeriodFat.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-gray-700">Avg SNF %</span>
                        <span className="text-xs font-black">{avgPeriodSnf.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase text-gray-700">Total Settled</span>
                        <span className="text-xs font-black">₹{totalPeriodPayout.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Itemized Table (Ultra-Compact Single Page Entry Table) */}
                    {receiptPeriod !== "single" && (
                      <div className="border border-black overflow-hidden max-h-[220px] overflow-y-auto print:max-h-none">
                        <table className="w-full text-left text-[9px] border-collapse border-black">
                          <thead>
                            <tr className="bg-gray-200 text-black uppercase font-black border-b border-black text-[8px]">
                              <th className="p-1 border-r border-black">Date</th>
                              <th className="p-1 border-r border-black text-center">Shift</th>
                              <th className="p-1 border-r border-black text-right">Liters</th>
                              <th className="p-1 border-r border-black text-center">FAT%</th>
                              <th className="p-1 border-r border-black text-center">SNF%</th>
                              <th className="p-1 border-r border-black text-right">Rate/L</th>
                              <th className="p-1 text-right">Total (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-300 font-mono text-black">
                            {farmerPeriodCollections.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-2 text-center text-[9px] font-bold">
                                  No deliveries recorded in the last {daysCount} days.
                                </td>
                              </tr>
                            ) : (
                              farmerPeriodCollections.map((col) => (
                                <tr key={col.id} className="hover:bg-gray-100">
                                  <td className="p-0.5 px-1 border-r border-gray-300">{col.date}</td>
                                  <td className="p-0.5 px-1 border-r border-gray-300 text-center">{col.time}</td>
                                  <td className="p-0.5 px-1 border-r border-gray-300 text-right font-bold">{col.weight.toFixed(1)}</td>
                                  <td className="p-0.5 px-1 border-r border-gray-300 text-center">{col.fat.toFixed(1)}</td>
                                  <td className="p-0.5 px-1 border-r border-gray-300 text-center">{col.snf.toFixed(1)}</td>
                                  <td className="p-0.5 px-1 border-r border-gray-300 text-right">₹{col.rate.toFixed(1)}</td>
                                  <td className="p-0.5 px-1 text-right font-black">₹{col.total.toFixed(2)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Net Total Banner */}
                    <div className="p-2.5 border-2 border-black bg-gray-50 flex items-center justify-between text-black">
                      <div>
                        <span className="text-xs font-black block uppercase">
                          {receiptPeriod === "single" ? "Single Intake Total" : `Net ${daysCount}-Day Amount Settled`}
                        </span>
                        <span className="text-[9px] font-bold text-gray-700">Bank UPI Credited · UTR: {utr}</span>
                      </div>
                      <span className="text-xl font-black text-black font-mono">
                        ₹{totalPeriodPayout.toFixed(2)}
                      </span>
                    </div>

                    {/* Footer Stamp & Signature Box */}
                    <div className="pt-2 border-t border-black flex justify-between items-end text-[9px] font-bold text-black">
                      <div>
                        <p>Computer Generated Official Slip</p>
                        <p className="text-gray-600 font-normal">3T Instant Payment Gateway</p>
                      </div>
                      <div className="text-center border-t border-black pt-1 px-4">
                        <span>Center Manager Signature & Stamp</span>
                      </div>
                    </div>

                    {/* Action Buttons (Screen Only) */}
                    <div className="flex items-center space-x-3 pt-2 no-print">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex-1 py-2.5 rounded-lg bg-black hover:bg-gray-800 text-white font-extrabold text-xs transition-all flex items-center justify-center space-x-2 shadow-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>🖨️ Print Single-Page Receipt ({receiptPeriod === "single" ? "Single Slip" : `${daysCount}-Day Statement`})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPrintedBillPayment(null);
                          setReceiptPeriod("single");
                        }}
                        className="px-4 py-2.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-black font-bold text-xs transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Farmer Profile Modal */}
      <AnimatePresence>
        {editingFarmer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingFarmer(null)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-lg h-fit bg-white z-50 p-6 rounded-2xl border border-border-light shadow-premium-lg flex flex-col space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-light">
                <div className="flex items-center space-x-2 text-primary">
                  <Users className="w-5 h-5" />
                  <h4 className="font-extrabold text-sm text-text-main">
                    Edit Farmer Profile — <span className="font-mono text-primary">{editingFarmer.id}</span>
                  </h4>
                </div>
                <button
                  onClick={() => setEditingFarmer(null)}
                  className="p-1 hover:bg-gray-100 rounded text-text-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {editStep === "form" ? (
                <form onSubmit={handleUpdateFarmerProfile} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Full Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Phone Number (UPI Linked)</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        placeholder="e.g. +91 9822012345"
                        required
                      />
                    </div>

                    {/* Village */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Village / Location</label>
                      <input
                        type="text"
                        value={editVillage}
                        onChange={(e) => setEditVillage(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        required
                      />
                    </div>

                    {/* Animals */}
                    <div className="space-y-1">
                      <label className="font-bold text-text-main">Cows / Buffaloes</label>
                      <input
                        type="number"
                        value={editAnimals}
                        onChange={(e) => setEditAnimals(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                        min="1"
                        required
                      />
                    </div>

                    {/* UPI ID */}
                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-text-main">UPI VPA ID (For Instant Payouts)</label>
                      <input
                        type="text"
                        value={editUpi}
                        onChange={(e) => setEditUpi(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA] font-mono text-primary"
                        placeholder="e.g. farmer@upi"
                        required
                      />
                    </div>

                    {/* Security Badge: Current Linked KYC */}
                    <div className="col-span-2 p-3.5 bg-gray-50 border border-border-light rounded-2xl space-y-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-700">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Encrypted Banking & Aadhaar Profile (Protected)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                        <div className="p-2 bg-white rounded-xl border border-border-light">
                          <span className="text-[9px] font-bold text-gray-400 block uppercase font-sans">Aadhaar</span>
                          <span className="text-gray-800 font-bold">{maskAadhaar(editingFarmer.aadhaar)}</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-border-light">
                          <span className="text-[9px] font-bold text-gray-400 block uppercase font-sans">Bank A/C</span>
                          <span className="text-gray-800 font-bold">{maskBankAccount(editingFarmer.bankAccount)}</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-border-light">
                          <span className="text-[9px] font-bold text-gray-400 block uppercase font-sans">IFSC Code</span>
                          <span className="text-gray-800 font-bold">{maskIfsc(editingFarmer.ifsc)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Optional Overwrite Section */}
                    <div className="col-span-2 pt-1 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted block">
                          ✏️ Update Bank & KYC Details (Requires Farmer Mobile OTP)
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          🛡️ OTP Protected
                        </span>
                      </div>
                    </div>

                    {/* Update Bank Account */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="font-bold text-text-main">New Bank Account Number</label>
                      <input
                        type="text"
                        value={editBankAccount}
                        onChange={(e) => setEditBankAccount(e.target.value.replace(/\D/g, ""))}
                        placeholder="Leave empty to keep existing"
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA] font-mono"
                      />
                    </div>

                    {/* Update IFSC Code */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="font-bold text-text-main">New Bank IFSC Code</label>
                      <input
                        type="text"
                        value={editIfsc}
                        onChange={(e) => setEditIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA] font-mono uppercase"
                      />
                    </div>

                    {/* Update Aadhaar */}
                    <div className="space-y-1 col-span-2">
                      <label className="font-bold text-text-main">New 12-Digit Aadhaar Card Number</label>
                      <input
                        type="text"
                        value={editAadhaar}
                        onChange={(e) => setEditAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                        placeholder="Leave empty to keep existing"
                        className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA] font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-extrabold text-xs uppercase tracking-wider hover:bg-[#0b6b49] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-60"
                    >
                      {isSavingEdit ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Initiating Security OTP...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save &amp; Continue</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingFarmer(null)}
                      className="px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-main font-bold text-xs transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* ── STEP 2: FARMER 2FA MOBILE OTP AUTHORIZATION SCREEN ── */
                <form onSubmit={handleVerifyBankOtp} className="space-y-5 text-xs font-semibold">
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start space-x-3">
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl mt-0.5">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-extrabold text-sm text-emerald-900">Farmer Authorization Required</h5>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        A 6-digit security authorization code was sent to <strong className="font-black">{editingFarmer.name}</strong>&apos;s registered phone number (<span className="font-mono font-bold">{editMaskedPhone}</span>).
                      </p>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        🛡️ To prevent unauthorized bank modifications, ask the farmer to provide the 6-digit code.
                      </p>
                    </div>
                  </div>

                  {/* Changes Summary */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-border-light space-y-1.5 text-[11px]">
                    <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">Proposed Banking Changes:</span>
                    {editBankAccount && <div><span className="text-gray-600 font-bold">New Bank A/C:</span> <span className="font-mono font-bold text-primary">••••••••{editBankAccount.slice(-4)}</span></div>}
                    {editIfsc && <div><span className="text-gray-600 font-bold">New IFSC:</span> <span className="font-mono font-bold text-primary">{editIfsc}</span></div>}
                    {editAadhaar && <div><span className="text-gray-600 font-bold">New Aadhaar:</span> <span className="font-mono font-bold text-primary">XXXX-XXXX-{editAadhaar.slice(-4)}</span></div>}
                  </div>

                  {/* Demo OTP Banner for Demonstration & Evaluation */}
                  {demoBankOtp && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="text-amber-800 font-bold block text-[11px]">Demo Sandbox Authorization Code:</span>
                        <span className="text-amber-700 text-[10px] font-medium">Use this test code to complete verification:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditOtp(demoBankOtp)}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-mono font-black rounded-lg text-xs tracking-wider transition-all shadow-xs active:scale-95"
                      >
                        {demoBankOtp} (Auto-Fill)
                      </button>
                    </div>
                  )}

                  {/* OTP Input Box */}
                  <div className="space-y-2 text-center py-2">
                    <label className="font-extrabold text-xs text-text-main block">Enter 6-Digit Farmer Authorization OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editOtp}
                      onChange={(e) => setEditOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      autoFocus
                      className="w-48 mx-auto p-3 text-center font-mono font-black text-2xl tracking-[0.4em] rounded-2xl border-2 border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-100 bg-white"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={isVerifyingBankOtp || editOtp.length < 6}
                      className="flex-1 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {isVerifyingBankOtp ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying with Farmer Phone...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✓ Authorize &amp; Apply Bank Change</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStep("form")}
                      className="px-4 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-text-main font-bold text-xs transition-all"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
