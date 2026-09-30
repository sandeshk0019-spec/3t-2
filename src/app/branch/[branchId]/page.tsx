"use client";

import React, { useState, useEffect, useMemo, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Milk,
  Users,
  Search,
  Plus,
  ArrowLeft,
  Sliders,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Check,
  Smartphone,
  ExternalLink,
  Laptop,
  ChevronDown,
  Mail,
  UserCheck,
  User,
  Bluetooth,
  Tv,
  Monitor,
  Radio,
  Copy
} from "lucide-react";
import {
  defaultFormulaConfig,
  calculateRate,
  getLocalDateString,
  getAutoShift,
  formatToIndiaTime,
  mockFarmers,
  mockCollections,
  mockPayments,
  mockBranches,
  Farmer,
  CollectionItem,
  PaymentItem,
  Branch,
  FormulaConfig,
  getCollectionShift,
  isEveningShiftOpen
} from "../../data";
import {
  broadcastDualDisplayState,
  connectBluetoothDevice,
  isWebBluetoothSupported
} from "@/lib/dual-display";

interface PageProps {
  params: Promise<{ branchId: string }>;
}

export default function BranchTerminal({ params }: PageProps) {
  const { branchId } = use(params);

  // Core application states loaded from shared localStorage
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig>(defaultFormulaConfig);
  const [farmers, setFarmers] = useState<Farmer[]>(mockFarmers);
  const [collections, setCollections] = useState<CollectionItem[]>(mockCollections);
  const [payments, setPayments] = useState<PaymentItem[]>(mockPayments);
  const [branches, setBranches] = useState<Branch[]>(mockBranches);
  const [isLoaded, setIsLoaded] = useState(false);
  // Helper for safe JSON fetching (prevents 'Unexpected token <' SyntaxError on HTML/404/500 responses)
  const safeJsonFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType || !contentType.includes("application/json")) {
        return { success: false, error: `HTTP ${res.status} ${res.statusText}` };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    }
  };

  // Load & Real-Time Sync with Server Database API (BroadcastChannel + Storage Event + Polling)
  useEffect(() => {
    async function loadData() {
      try {
        const json = await safeJsonFetch("/api/data", { cache: "no-store" });
        if (json.success && json.data) {
          if (json.data.formulaConfig) setFormulaConfig(json.data.formulaConfig);
          if (json.data.farmers) setFarmers(json.data.farmers);
          if (json.data.collections) setCollections(json.data.collections);
          if (json.data.payments) setPayments(json.data.payments);
          if (json.data.branches) setBranches(json.data.branches);
        }
      } catch (error) {
        console.error("Failed to load branch database state", error);
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

    // 3. Heartbeat Auto-Sync interval (6-second fallback)
    const intervalId = setInterval(loadData, 6000);

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
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Find current branch information
  const currentBranch = useMemo(() => {
    return branches.find((b) => b.id === branchId) || {
      id: branchId,
      name: "Unknown Branch",
      manager: "N/A",
      capacity: 0,
      todayCollection: 0,
      payments: 0,
      status: "Active" as const
    };
  }, [branches, branchId]);

  // Farmers available for this branch (prioritizing this branch's farmers first)
  const branchFarmers = useMemo(() => {
    const direct = farmers.filter((f) => f.branchId === branchId);
    const others = farmers.filter((f) => f.branchId !== branchId);
    return [...direct, ...others];
  }, [farmers, branchId]);

  // Search filter
  const [farmerSearch, setFarmerSearch] = useState("");
  const [isFarmerDropdownOpen, setIsFarmerDropdownOpen] = useState(false);

  const filteredFarmers = useMemo(() => {
    const q = farmerSearch.toLowerCase().trim();
    if (!q) return branchFarmers;
    return branchFarmers.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        (f.village && f.village.toLowerCase().includes(q))
    );
  }, [branchFarmers, farmerSearch]);

  // Selection states
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [activeFarmer, setActiveFarmer] = useState<Farmer | null>(null);
  const [isFarmerDisplayOpen, setIsFarmerDisplayOpen] = useState(false);

  const handleSelectFarmer = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    const found = farmers.find((f) => f.id === farmerId);
    if (found) {
      setActiveFarmer(found);
      if (found.avgFat && found.avgFat > 0) setFat(String(found.avgFat));
      if (found.avgSnf && found.avgSnf > 0) setSnf(String(found.avgSnf));
    }
    setIsFarmerDropdownOpen(false);
    setFarmerSearch("");
  };

  // Automatically update active farmer profile when id changes
  useEffect(() => {
    const found = farmers.find((f) => f.id === selectedFarmerId);
    setActiveFarmer(found || null);
  }, [selectedFarmerId, farmers]);

  // Hardware Sensor Lock State (Anti-Fraud Scale & Analyzer Mode)
  const [isHardwareLocked, setIsHardwareLocked] = useState(true);
  const [isSimulatingSensor, setIsSimulatingSensor] = useState(false);

  const simulateHardwareReading = () => {
    setIsSimulatingSensor(true);
    setTimeout(() => {
      // Generate realistic scale reading
      const randomVol = (Math.floor(Math.random() * 80) + 80) / 10; // 8.0L to 16.0L
      const randomFat = (Math.floor(Math.random() * 15) + 38) / 10; // 3.8% to 5.2%
      const randomSnf = (Math.floor(Math.random() * 8) + 84) / 10;  // 8.4% to 9.1%
      setWeight(randomVol.toFixed(1));
      setFat(randomFat.toFixed(1));
      setSnf(randomSnf.toFixed(1));
      setIsSimulatingSensor(false);
    }, 600);
  };

  // Milk input states
  const [weight, setWeight] = useState("12.0");
  const [fat, setFat] = useState("4.2");
  const [snf, setSnf] = useState("8.5");
  const [time, setTime] = useState<"Morning" | "Evening">(getAutoShift);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fraudModalData, setFraudModalData] = useState<{
    farmerName: string;
    farmerId: string;
    shift: string;
    existingLog: any;
  } | null>(null);

  // Check if current active farmer has logged shifts today
  const isMorningLogged = useMemo(() => {
    if (!activeFarmer) return false;
    const localDate = getLocalDateString();
    const utcDate = new Date().toISOString().split("T")[0];
    return collections.some(
      c => c.farmerId?.toUpperCase() === activeFarmer.id.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c) === "Morning"
    );
  }, [collections, activeFarmer]);

  const isEveningLogged = useMemo(() => {
    if (!activeFarmer) return false;
    const localDate = getLocalDateString();
    const utcDate = new Date().toISOString().split("T")[0];
    return collections.some(
      c => c.farmerId?.toUpperCase() === activeFarmer.id.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c) === "Evening"
    );
  }, [collections, activeFarmer]);

  // Smart shift auto-selector: Automatically select the open shift for this farmer
  useEffect(() => {
    if (!activeFarmer) return;
    if (isMorningLogged && !isEveningLogged) {
      setTime("Evening");
    } else if (isEveningLogged && !isMorningLogged) {
      setTime("Morning");
    } else {
      setTime(getAutoShift());
    }
  }, [activeFarmer?.id, isMorningLogged, isEveningLogged]);

  // Dynamic calculations
  const liveRate = useMemo(() => {
    return calculateRate(parseFloat(fat) || 0, parseFloat(snf) || 0, formulaConfig);
  }, [fat, snf, formulaConfig]);

  const liveTotal = useMemo(() => {
    return Math.round((parseFloat(weight) || 0) * liveRate * 100) / 100;
  }, [weight, liveRate]);

  // Payment Gateway Modal & Receipt State
  const [paymentModalData, setPaymentModalData] = useState<{
    isOpen: boolean;
    step: "gateway" | "success";
    farmerName: string;
    phone: string;
    upiId: string;
    weight: string;
    fat: string;
    snf: string;
    rate: number;
    total: number;
    utr: string;
  } | null>(null);

  const sendWhatsAppReceipt = (data: {
    phone: string;
    farmerName: string;
    weight: string;
    fat: string;
    snf: string;
    rate: number;
    total: number;
    utr: string;
  }) => {
    const cleanPhone = data.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const message = `🥛 *3T Milk Settlement Receipt*\n\n` +
      `Dear *${data.farmerName}*,\n` +
      `Your milk delivery has been verified & settled!\n\n` +
      `• *Volume*: ${data.weight} Liters\n` +
      `• *Quality Specs*: FAT ${data.fat}%, SNF ${data.snf}%\n` +
      `• *Calculated Rate*: ₹${data.rate.toFixed(2)}/L\n` +
      `• *Amount Credited*: ₹${data.total.toFixed(2)}\n` +
      `• *Payment Mode*: Instant UPI (Bank Gateway)\n` +
      `• *Transaction UTR*: ${data.utr}\n\n` +
      `*Milk Now. Money Now.* - 3T Dairy Network`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, "_blank");
  };

  const [smsCopied, setSmsCopied] = useState(false);

  const sendSmsReceipt = (data: {
    phone: string;
    farmerName: string;
    weight: string;
    fat: string;
    snf: string;
    rate: number;
    total: number;
    utr: string;
  }) => {
    const cleanPhone = data.phone.replace(/[^0-9]/g, "");
    const smsText = `3T Alert: ₹${data.total.toFixed(2)} settled for ${data.weight}L milk (FAT ${data.fat}%, SNF ${data.snf}%). UTR: ${data.utr}. Thank you!`;
    const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.open(`sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`, "_blank");
    } else {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(smsText).then(() => {
          setSmsCopied(true);
          setTimeout(() => setSmsCopied(false), 3000);
        }).catch(() => {
          window.open(`sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`, "_blank");
        });
      } else {
        window.open(`sms:${cleanPhone}?body=${encodeURIComponent(smsText)}`, "_blank");
      }
    }
  };

  // Date timeframe filter for branch overview ("today" | "yesterday" | "7days" | "month")
  const [branchTimeframe, setBranchTimeframe] = useState<"today" | "yesterday" | "7days" | "month">("today");

  const branchCollectionsFiltered = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; })();
    const d7Str = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; })();
    const monthStr = todayStr.slice(0, 8) + "01";

    return collections.filter((c) => {
      if (c.branchId !== branchId) return false;
      if (branchTimeframe === "today") return c.date === todayStr;
      if (branchTimeframe === "yesterday") return c.date === yesterdayStr;
      if (branchTimeframe === "7days") return c.date >= d7Str && c.date <= todayStr;
      return c.date >= monthStr && c.date <= todayStr;
    });
  }, [collections, branchId, branchTimeframe]);

  const todayVolume = useMemo(() => {
    return branchCollectionsFiltered.reduce((sum, c) => sum + c.weight, 0);
  }, [branchCollectionsFiltered]);

  const todayAmount = useMemo(() => {
    return branchCollectionsFiltered.reduce((sum, c) => sum + c.total, 0);
  }, [branchCollectionsFiltered]);

  // Farmer-Facing Display & Bluetooth Modal State
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [bluetoothTab, setBluetoothTab] = useState<"dual_screen" | "bluetooth">("dual_screen");
  const [isBluetoothConnecting, setIsBluetoothConnecting] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);
  const [copiedDualScreenUrl, setCopiedDualScreenUrl] = useState(false);

  // Reactive Dual Display Broadcast Hook (0ms multi-screen sync)
  useEffect(() => {
    if (!isLoaded) return;
    broadcastDualDisplayState({
      branchId,
      branchName: currentBranch.name,
      status: isSubmitting ? "recorded" : (activeFarmer ? "weighing" : "standby"),
      farmer: activeFarmer ? {
        id: activeFarmer.id,
        name: activeFarmer.name,
        village: activeFarmer.village,
        phone: activeFarmer.phone,
        animals: activeFarmer.animals,
        monthlyEarnings: activeFarmer.monthlyEarnings
      } : null,
      measurement: {
        weight: parseFloat(weight) || 0,
        fat: parseFloat(fat) || 0,
        snf: parseFloat(snf) || 0,
        shift: time,
        ratePerLiter: liveRate,
        totalAmount: liveTotal,
        scaleConnected: isBluetoothConnected || !isHardwareLocked,
        scaleName: bluetoothDeviceName || "Bluetooth Optical Scale"
      },
      baseRates: {
        basePrice: formulaConfig.basePrice,
        fatFactor: formulaConfig.fatFactor,
        snfFactor: formulaConfig.snfFactor
      },
      timestamp: Date.now()
    });
  }, [
    isLoaded,
    branchId,
    currentBranch.name,
    activeFarmer,
    weight,
    fat,
    snf,
    time,
    liveRate,
    liveTotal,
    isSubmitting,
    isBluetoothConnected,
    isHardwareLocked,
    bluetoothDeviceName,
    formulaConfig
  ]);

  // Launch Secondary Customer Display Window
  const launchCustomerWindow = () => {
    const url = `/branch/${branchId}/display`;
    const features = `width=${typeof window !== "undefined" ? window.screen.availWidth || 1280 : 1280},height=${typeof window !== "undefined" ? window.screen.availHeight || 720 : 720},menubar=no,toolbar=no,location=no,status=no`;
    window.open(url, "3TDairyCustomerDisplay", features);
  };

  // Connect Web Bluetooth Scale
  const handleConnectBluetooth = async () => {
    setIsBluetoothConnecting(true);
    try {
      const res = await connectBluetoothDevice((streamWeight) => {
        setWeight(streamWeight.toFixed(1));
      });
      if (res) {
        setIsBluetoothConnected(true);
        setBluetoothDeviceName(res.name);
        setIsHardwareLocked(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to pair Bluetooth scale.");
    } finally {
      setIsBluetoothConnecting(false);
    }
  };

  // KYC modal states
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [kycName, setKycName] = useState("");
  const [kycVillage, setKycVillage] = useState(currentBranch.name.replace(" Central Hub", "").replace(" Main Center", "").replace(" Collection Hub", "").replace(" Rural Point", "").replace(" Station", "") + ", Maharashtra");
  const [kycPhone, setKycPhone] = useState("+91 ");
  const [kycAnimals, setKycAnimals] = useState("5");
  const [kycAadhaar, setKycAadhaar] = useState("");
  const [kycBankNo, setKycBankNo] = useState("");
  const [kycIfsc, setKycIfsc] = useState("");
  const [kycUpi, setKycUpi] = useState("");
  const [kycError, setKycError] = useState("");
  const [isRegisteringKyc, setIsRegisteringKyc] = useState(false);

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

    setIsRegisteringKyc(true);

    safeJsonFetch("/api/farmers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: kycName,
        village: kycVillage,
        phone: kycPhone,
        animals: kycAnimals,
        branchId: branchId,
        aadhaar: kycAadhaar,
        bankAccount: kycBankNo,
        ifsc: kycIfsc,
        upiId: kycUpi
      })
    })
      .then(json => {
        if (json.success && json.data) {
          setFarmers(prev => [json.data, ...prev]);
          setSelectedFarmerId(json.data.id);
          setIsKycOpen(false);
          setKycName("");
          setKycPhone("+91 ");
          setKycAnimals("5");
          setKycAadhaar("");
          setKycBankNo("");
          setKycIfsc("");
          setKycUpi("");
        } else {
          setKycError(json.error || "Failed to save farmer to persistent database.");
        }
      })
      .catch(() => {
        setKycError("Network or server error while connecting to database.");
      })
      .finally(() => {
        setIsRegisteringKyc(false);
      });
  };

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

  // Submit milk collection & trigger payment dispatch -> Opens verification dialog
  const handleLogCollection = (e?: React.FormEvent, allowOverride = false) => {
    if (e) e.preventDefault();
    if (!activeFarmer) {
      alert("Please choose a registered farmer first.");
      return;
    }

    // Instant Anti-Fraud Shift Lock Check
    const localDate = getLocalDateString();
    const utcDate = new Date().toISOString().split("T")[0];

    const existingShiftLog = collections.find(
      c => c.farmerId?.toUpperCase() === activeFarmer.id.toUpperCase() && 
           (c.date === localDate || c.date === utcDate) && 
           getCollectionShift(c).toLowerCase() === time.toLowerCase()
    );

    if (existingShiftLog && !allowOverride) {
      setFraudModalData({
        farmerName: activeFarmer.name,
        farmerId: activeFarmer.id,
        shift: time,
        existingLog: existingShiftLog
      });
      return;
    }

    const weightNum = parseFloat(weight);
    const fatNum = parseFloat(fat);
    const snfNum = parseFloat(snf);

    if (isNaN(weightNum) || weightNum <= 0) {
      alert("Please enter a valid weight in liters.");
      return;
    }
    if (isNaN(fatNum) || fatNum <= 0 || isNaN(snfNum) || snfNum <= 0) {
      alert("Please enter valid FAT % and SNF % values.");
      return;
    }

    // Open confirmation dialog before actual payout
    setDispatchConfirmation({
      farmer: activeFarmer,
      weight: weightNum,
      fat: fatNum,
      snf: snfNum,
      rate: liveRate,
      totalPayout: liveTotal,
      shift: time,
      date: localDate,
      allowOverride
    });
  };

  // Execute payout dispatch after confirmation in modal
  const executeConfirmDispatch = () => {
    if (!dispatchConfirmation) return;
    const { farmer, weight: weightNum, fat: fatNum, snf: snfNum, rate: rateVal, totalPayout: payoutVal, shift, date: localDate, allowOverride } = dispatchConfirmation;
    setDispatchConfirmation(null);
    setIsSubmitting(true);

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
        branchId: branchId,
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
          safeJsonFetch("/api/data").then(d => {
            if (d.success && d.data && d.data.branches) {
              setBranches(d.data.branches);
            }
          });
          const generatedUtr = json.data.payment?.timeline?.[3]?.description?.match(/TXN\d+/)?.[0] || `TXN${Math.floor(10000000 + Math.random() * 90000000)}`;
          
          setPaymentModalData({
            isOpen: true,
            step: "gateway",
            farmerName: farmer.name,
            phone: farmer.phone,
            upiId: farmer.upiId,
            weight: String(weightNum),
            fat: String(fatNum),
            snf: String(snfNum),
            rate: rateVal,
            total: payoutVal,
            utr: generatedUtr
          });

          // Transition to success modal step after simulated bank handshake
          setTimeout(() => {
            setPaymentModalData(prev => prev ? { ...prev, step: "success" } : null);
          }, 1400);

          setWeight("12.0");
          setFat("4.2");
          setSnf("8.5");
        } else if (json.isDuplicateFraud) {
          setFraudModalData({
            farmerName: farmer.name,
            farmerId: farmer.id,
            shift: shift,
            existingLog: json.existingLog || { weight: String(weightNum), time: shift, date: localDate }
          });
        } else {
          alert(json.error || "Failed to log collection to database.");
        }
      })
      .catch(() => {
        alert("Server error while connecting to database.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-text-muted">Loading Branch Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-text-main flex flex-col font-sans">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-border-light h-20 px-8 flex items-center justify-between shadow-premium-sm sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-text-muted hover:text-text-main"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-text-main flex items-center space-x-2">
              <span>{currentBranch.name}</span>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/10">
                Operator Terminal
              </span>
            </h1>
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Branch Manager: {currentBranch.manager} · ID: {currentBranch.id}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsBluetoothModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-border-light text-text-muted hover:text-text-main text-xs font-bold bg-white transition-all flex items-center space-x-2 shadow-premium-sm hover:border-primary group"
          >
            <Bluetooth className={`w-4 h-4 ${isBluetoothConnected ? "text-blue-500 animate-pulse" : "text-primary"}`} />
            <span>{isBluetoothConnected ? `Scale: ${bluetoothDeviceName}` : "Bluetooth & Dual Screen"}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </button>

          <button
            onClick={launchCustomerWindow}
            className="hidden sm:flex px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all items-center space-x-2 shadow-premium"
          >
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>Open 2nd Monitor</span>
          </button>
        </div>
      </header>

      {/* Grid Content */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Left Column - Metrics & Inputs */}
        <div className="lg:col-span-8 space-y-6">
          {/* Branch summary stats Header */}
          <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-border-light shadow-premium-sm">
            <span className="text-xs font-extrabold text-text-main flex items-center space-x-1.5">
              <span>Branch Activity Summary</span>
              <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Date-Wise</span>
            </span>

            <div className="relative group inline-block">
              <button
                type="button"
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-text-main font-extrabold text-xs rounded-xl border border-border-light flex items-center space-x-2 transition-all shadow-2xs"
              >
                <span>
                  {branchTimeframe === "today" && "📅 Today"}
                  {branchTimeframe === "yesterday" && "🗓️ Yesterday"}
                  {branchTimeframe === "7days" && "🗓️ Last 7 Days"}
                  {branchTimeframe === "month" && "📆 This Month"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:rotate-180 transition-transform" />
              </button>

              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-border-light rounded-xl shadow-premium-lg p-1.5 hidden group-hover:block z-40 space-y-1">
                {[
                  { id: "today", label: "📅 Today" },
                  { id: "yesterday", label: "🗓️ Yesterday" },
                  { id: "7days", label: "🗓️ Last 7 Days" },
                  { id: "month", label: "📆 This Month" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBranchTimeframe(tab.id as any)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                      branchTimeframe === tab.id
                        ? "bg-primary/10 text-primary font-black"
                        : "text-text-muted hover:text-text-main hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {branchTimeframe === tab.id && <span className="text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Period Milk</span>
              <span className="text-xl font-extrabold text-text-main mt-1 block">{todayVolume.toFixed(1)} L</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Period Outflow</span>
              <span className="text-xl font-extrabold text-text-main mt-1 block">₹{todayAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-border-light shadow-premium-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Farmers Served</span>
              <span className="text-xl font-extrabold text-text-main mt-1 block">{branchCollectionsFiltered.length} deliveries</span>
            </div>
          </div>

          {/* Setup / Weighing Form */}
          <div className="bg-white rounded-2xl border border-border-light shadow-premium-md p-6">
            <div className="border-b border-border-light pb-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-text-main flex items-center space-x-2">
                  <Milk className="w-4 h-4 text-primary" />
                  <span>Log New Milk Delivery & Pay</span>
                </h2>
                <span className="text-[10px] text-text-muted font-bold block mt-0.5">
                  Formula base: ₹{formulaConfig.basePrice}/L
                </span>
              </div>

              {/* Hardware Sensor Lock Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsHardwareLocked(!isHardwareLocked)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border ${
                    isHardwareLocked
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-gray-100 border-gray-300 text-text-muted hover:text-text-main"
                  }`}
                >
                  {isHardwareLocked ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>🔒 Hardware Locked (Anti-Fraud)</span>
                    </>
                  ) : (
                    <>
                      <span>✏️ Manual Input Demo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Anti-fraud sensor notice */}
            {isHardwareLocked && (
              <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🔌</span>
                  <span><strong>Scale & Analyzer Connected:</strong> Values are locked directly from hardware sensors to prevent staff over-reporting.</span>
                </div>
                <button
                  type="button"
                  onClick={simulateHardwareReading}
                  disabled={isSimulatingSensor}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-all shrink-0 ml-3 shadow-sm flex items-center space-x-1 disabled:opacity-50"
                >
                  {isSimulatingSensor ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reading Sensors...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Read Live Scale Sensor</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <form onSubmit={handleLogCollection} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Farmer Selection with Live Combobox */}
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
                      <span>New Farmer KYC</span>
                    </button>
                  </div>

                  {/* Search input with live dropdown trigger */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Type farmer name, ID (e.g. F-102), or phone..."
                      value={farmerSearch}
                      onFocus={() => setIsFarmerDropdownOpen(true)}
                      onClick={() => setIsFarmerDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFarmerSearch(val);
                        setIsFarmerDropdownOpen(true);
                        const q = val.toLowerCase().trim();
                        if (q) {
                          const exact = farmers.find(
                            f => f.id.toLowerCase() === q || f.name.toLowerCase() === q || f.phone.includes(q)
                          );
                          if (exact) {
                            setSelectedFarmerId(exact.id);
                            setActiveFarmer(exact);
                            if (exact.avgFat) setFat(String(exact.avgFat));
                            if (exact.avgSnf) setSnf(String(exact.avgSnf));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (filteredFarmers.length > 0) {
                            handleSelectFarmer(filteredFarmers[0].id);
                          }
                        } else if (e.key === "Escape") {
                          setIsFarmerDropdownOpen(false);
                        }
                      }}
                      className="w-full pl-9 pr-16 py-2.5 rounded-xl border border-border-light text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-[#FAFAFA]"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                      {farmerSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setFarmerSearch("");
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
                        title="Toggle list"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isFarmerDropdownOpen ? 'rotate-180' : ''}`} />
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
                          {filteredFarmers.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-500 font-medium">
                              No registered farmers found matching &quot;{farmerSearch}&quot;
                            </div>
                          ) : (
                            filteredFarmers.map((f) => {
                              const isSelected = f.id === selectedFarmerId;
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
                  {activeFarmer ? (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="font-black text-white font-mono bg-emerald-700 px-2 py-0.5 rounded text-[10px]">
                          {activeFarmer.id}
                        </span>
                        <div>
                          <span className="font-extrabold text-gray-900 block text-xs">{activeFarmer.name}</span>
                          <span className="text-[10px] text-gray-600 font-medium">{activeFarmer.village} • 📞 {activeFarmer.phone}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFarmerDropdownOpen(true);
                          setFarmerSearch("");
                        }}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <span>Change</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold flex items-center justify-between">
                      <span>⚠️ Please choose a farmer above to log milk</span>
                      <button
                        type="button"
                        onClick={() => setIsFarmerDropdownOpen(true)}
                        className="text-[10px] font-black underline"
                      >
                        Choose Farmer
                      </button>
                    </div>
                  )}
                </div>

                {/* Dispatch parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main">Weight (Liters)</label>
                      {isHardwareLocked && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">🔒 Scale Locked</span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      readOnly={isHardwareLocked}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                        isHardwareLocked 
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-bold cursor-not-allowed" 
                          : "bg-[#FAFAFA] border-border-light"
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-text-main">Shift Time</label>
                      {activeFarmer && (
                        <span className="text-[9px] font-bold text-text-muted">
                          {isMorningLogged && isEveningLogged 
                            ? "Both Shifts Complete" 
                            : isMorningLogged 
                              ? "Morning Logged · Evening Open" 
                              : isEveningLogged 
                                ? "Evening Logged · Morning Open" 
                                : "Both Shifts Open"}
                        </span>
                      )}
                    </div>
                    <div className="flex bg-gray-100 p-0.5 rounded-xl border border-border-light h-[42px] items-center">
                      <button
                        type="button"
                        onClick={() => setTime("Morning")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center space-x-1 ${
                          time === "Morning" ? "bg-white text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
                        }`}
                      >
                        <span>Morning</span>
                        {isMorningLogged && (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 ml-1">
                            ✓ Done
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTime("Evening")}
                        className={`flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center space-x-1 ${
                          time === "Evening" ? "bg-white text-text-main shadow-sm" : "text-text-muted hover:text-text-main"
                        }`}
                      >
                        <span>Evening</span>
                        {isEveningLogged && (
                          <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 ml-1">
                            ✓ Done
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chemical specs */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-border-light">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main">Milk FAT %</label>
                    {isHardwareLocked && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">🔒 Auto-Read</span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="15.0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    readOnly={isHardwareLocked}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      isHardwareLocked 
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-bold cursor-not-allowed" 
                        : "bg-[#FAFAFA] border-border-light"
                    }`}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-text-main">Milk SNF %</label>
                    {isHardwareLocked && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">🔒 Auto-Read</span>
                    )}
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="3.0"
                    max="15.0"
                    value={snf}
                    onChange={(e) => setSnf(e.target.value)}
                    readOnly={isHardwareLocked}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold ${
                      isHardwareLocked 
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 font-bold cursor-not-allowed" 
                        : "bg-[#FAFAFA] border-border-light"
                    }`}
                    required
                  />
                </div>

                <div className="col-span-2 md:col-span-1 bg-primary-light/50 p-4 rounded-xl border border-primary-light flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-primary block">Calculated Price per Liter</span>
                  <div className="flex items-baseline space-x-1 mt-1">
                    <span className="text-sm font-semibold text-primary">₹</span>
                    <span className="text-xl font-extrabold text-primary">{liveRate.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Calculation Preview and Dispatch */}
              {activeFarmer ? (
                <div className="bg-[#E7F6F0] p-4 rounded-xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-xs font-semibold">
                    <span className="text-text-muted block">Farmer Credit Wallet</span>
                    <span className="text-text-main font-bold">{activeFarmer.name} ({activeFarmer.upiId})</span>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-text-muted block">Total Settlement Outflow</span>
                      <span className="text-base font-extrabold text-primary">₹{liveTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-[#0b6b49] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center space-x-2 shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing UPI...</span>
                        </>
                      ) : (
                        <span>Verify & Dispatch Payout</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold block text-amber-900">⚠️ No Farmer Selected</span>
                    <span>Please select a registered farmer from the right directory or register a new farmer to verify & dispatch payouts.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsKycOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm shrink-0"
                  >
                    + Register New Farmer
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column - Directory and Recent Log */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active branch farmers list */}
          <div className="bg-white rounded-2xl border border-border-light shadow-premium-sm p-6 flex flex-col h-[320px]">
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border-light pb-3 mb-3">
              Registered Farmers ({branchFarmers.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {branchFarmers.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFarmerId(f.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    selectedFarmerId === f.id
                      ? "border-primary bg-primary-light/30"
                      : "border-border-light hover:border-gray-300 bg-white"
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold text-text-main">{f.name}</span>
                    <span className="block text-[10px] text-text-muted mt-0.5">{f.village} · ID: {f.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-primary">₹{f.monthlyEarnings.toLocaleString("en-IN")}</span>
                    <span className="block text-[9px] text-text-muted mt-0.5">{f.animals} Animals</span>
                  </div>
                </button>
              ))}
              {branchFarmers.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-8">
                  <Users className="w-8 h-8 opacity-20 mb-2" />
                  <span className="text-[10px] font-bold">No farmers registered in this branch yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Today's Transactions at this branch */}
          <div className="bg-white rounded-2xl border border-border-light shadow-premium-sm p-6 flex flex-col h-[320px]">
            <h3 className="text-xs font-bold text-text-main uppercase tracking-wider border-b border-border-light pb-3 mb-3">
              Filtered Period Logs ({branchCollectionsFiltered.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {branchCollectionsFiltered.map((c) => (
                <div key={c.id} className="p-3 rounded-xl border border-border-light flex items-center justify-between bg-white">
                  <div>
                    <span className="block text-xs font-bold text-text-main">{c.farmerName}</span>
                    <span className="block text-[10px] text-text-muted mt-0.5">{c.weight}L · FAT: {c.fat}% · SNF: {c.snf}%</span>
                  </div>
                  <div className="text-right flex flex-col items-end space-y-1">
                    <span className="block text-xs font-bold text-primary">₹{c.total.toFixed(2)}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200 font-bold inline-block">
                        SETTLED
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const farmer = farmers.find(f => f.id === c.farmerId);
                          sendWhatsAppReceipt({
                            phone: farmer?.phone || "+91 98250 14892",
                            farmerName: c.farmerName,
                            weight: c.weight.toString(),
                            fat: c.fat.toString(),
                            snf: c.snf.toString(),
                            rate: c.rate,
                            total: c.total,
                            utr: `TXN${c.id.replace(/[^0-9]/g, '') || Math.floor(10000000 + Math.random() * 90000000)}`
                          });
                        }}
                        className="text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-full transition-all flex items-center space-x-1"
                        title="Send WhatsApp Receipt to Farmer"
                      >
                        <span>💬 WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {branchCollectionsFiltered.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-8">
                  <Milk className="w-8 h-8 opacity-20 mb-2" />
                  <span className="text-[10px] font-bold">No deliveries logged for selected date period.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* KYC Registration Modal */}
      {isKycOpen && (
        <>
          <div
            onClick={() => setIsKycOpen(false)}
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
          />
          <div className="fixed inset-0 m-auto max-w-lg h-fit bg-white z-50 p-6 rounded-2xl border border-border-light shadow-premium-lg flex flex-col space-y-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-border-light">
              <div className="flex items-center space-x-2 text-primary">
                <Users className="w-5 h-5" />
                <h4 className="font-extrabold text-sm text-text-main">Register Farmer (KYC)</h4>
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
                <div className="space-y-1">
                  <label className="font-bold text-text-main">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Balasaheb Kadam"
                    value={kycName}
                    onChange={(e) => setKycName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                    required
                  />
                </div>
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
                  onChange={(e) => setKycAadhaar(e.target.value.replace(/\D/g, ""))}
                  className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                  required
                />
              </div>

              <div className="border-t border-border-light pt-4 space-y-4">
                <h5 className="font-bold text-xs text-primary uppercase tracking-wider">Bank Settlement Details</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-text-main">Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 30281982739"
                      value={kycBankNo}
                      onChange={(e) => setKycBankNo(e.target.value.replace(/\D/g, ""))}
                      className="w-full p-2.5 rounded-xl border border-border-light font-semibold bg-[#FAFAFA]"
                      required
                    />
                  </div>
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
                    <span>Submit Registration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Farmer-Facing Screen Display Modal */}
      {isFarmerDisplayOpen && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-border-light flex flex-col relative aspect-[16/9]">
            {/* Header */}
            <div className="bg-[#0F8A5F] text-white p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                <Milk className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">3T (Time To Time)</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                    {currentBranch.name} · Customer Display Unit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFarmerDisplayOpen(false)}
                className="p-2 hover:bg-black/10 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Display Body */}
            <div className="flex-1 p-8 flex flex-col justify-between bg-white text-text-main">
              {activeFarmer ? (
                <>
                  {/* Farmer Info Banner */}
                  <div className="border-b border-border-light pb-4 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Farmer Account Connected</span>
                      <h4 className="text-2xl font-extrabold text-[#0D0D0D]">{activeFarmer.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">Farmer ID</span>
                      <span className="text-lg font-bold text-primary">{activeFarmer.id}</span>
                    </div>
                  </div>

                  {/* Main specs widgets */}
                  <div className="grid grid-cols-3 gap-8 py-6">
                    <div className="bg-[#FAFAFA] p-6 rounded-2xl border border-border-light text-center">
                      <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Quantity (Weight)</span>
                      <span className="text-5xl font-black text-text-main block mt-2">{weight} <span className="text-xl font-bold">L</span></span>
                    </div>
                    <div className="bg-[#FAFAFA] p-6 rounded-2xl border border-border-light text-center">
                      <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Quality (FAT %)</span>
                      <span className="text-5xl font-black text-text-main block mt-2">{fat}%</span>
                    </div>
                    <div className="bg-[#FAFAFA] p-6 rounded-2xl border border-border-light text-center">
                      <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Quality (SNF %)</span>
                      <span className="text-5xl font-black text-text-main block mt-2">{snf}%</span>
                    </div>
                  </div>

                  {/* Price calculations */}
                  <div className="bg-[#E7F6F0] p-6 rounded-2xl border border-primary/10 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Rate per Liter</span>
                      <span className="text-xl font-extrabold text-primary">₹{liveRate.toFixed(2)} / L</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-text-muted block uppercase tracking-wider">Net Payout Amount</span>
                      <span className="text-4xl font-black text-primary">₹{liveTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary animate-pulse">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-text-main">Waiting for Farmer Selection</h4>
                    <p className="text-xs text-text-muted max-w-sm mt-1 mx-auto">
                      Please select a farmer profile or scan their laminated 3T card on the operator screen to begin verification.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer status bar */}
            <div className="bg-gray-50 border-t border-border-light p-4 px-8 flex justify-between items-center text-[10px] text-text-muted font-bold shrink-0">
              <span>UPI BANK GATEWAY INTEGRATED</span>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-primary">SYSTEM READY</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Verify & Dispatch Payment Confirmation Modal */}
      <AnimatePresence>
        {dispatchConfirmation && (
          <React.Fragment key="modal-branch-dispatch-confirm">
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
                  disabled={isSubmitting}
                  className="py-3 px-4 rounded-xl bg-primary hover:bg-[#0b6b49] text-white font-black text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
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

      {/* Payment Gateway Settlement Modal */}
      {paymentModalData?.isOpen && (
        <>
          <div
            onClick={() => setPaymentModalData(null)}
            className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs"
          />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-6 rounded-3xl border border-border-light shadow-2xl flex flex-col space-y-6">
            
            {paymentModalData.step === "gateway" ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-primary relative">
                  <DollarSign className="w-7 h-7" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Bank Gateway Active
                  </span>
                  <h3 className="text-lg font-black text-text-main pt-1">Processing UPI Payout</h3>
                  <p className="text-xs text-text-muted font-medium">
                    Connecting to NPCI / Bank Switch for {paymentModalData.farmerName}...
                  </p>
                </div>

                <div className="w-full bg-gray-50 p-4 rounded-2xl border border-border-light space-y-3 text-left text-xs font-semibold text-text-main">
                  <div className="flex justify-between items-center text-emerald-800">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Checking Escrow Liquidity</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">PASSED ✓</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-800">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Authenticating VPA ({paymentModalData.upiId})</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">VERIFIED ✓</span>
                  </div>
                  <div className="flex justify-between items-center text-text-muted">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span>Discharging IMPS Funds (₹{paymentModalData.total.toFixed(2)})</span>
                    </span>
                    <span className="text-[10px] font-bold text-primary animate-pulse">PROCESSING...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-2 flex flex-col space-y-5">
                <div className="flex items-center justify-between border-b border-border-light pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Settlement Success
                      </span>
                      <h3 className="text-base font-extrabold text-text-main mt-0.5">Payout Dispatched!</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setPaymentModalData(null)}
                    className="p-1 hover:bg-gray-100 rounded-full text-text-muted"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Amount Banner */}
                <div className="bg-[#E7F6F0] p-4 rounded-2xl border border-primary/10 text-center space-y-1">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Transferred to {paymentModalData.farmerName}</span>
                  <span className="text-3xl font-black text-primary block">₹{paymentModalData.total.toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">UTR: {paymentModalData.utr} · Instant UPI</span>
                </div>

                {/* Specs breakdown */}
                <div className="grid grid-cols-3 gap-3 text-center bg-gray-50 p-3 rounded-xl border border-border-light text-xs font-semibold text-text-muted">
                  <div>
                    <span className="text-[9px] block">Milk Volume</span>
                    <span className="text-sm font-bold text-text-main">{paymentModalData.weight} L</span>
                  </div>
                  <div>
                    <span className="text-[9px] block">FAT / SNF</span>
                    <span className="text-sm font-bold text-text-main">{paymentModalData.fat}% / {paymentModalData.snf}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] block">Rate / Liter</span>
                    <span className="text-sm font-bold text-primary">₹{paymentModalData.rate.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons: WhatsApp & Messenger/SMS */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sendWhatsAppReceipt(paymentModalData);
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center space-x-2"
                  >
                    <span>💬 Send Receipt via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sendSmsReceipt(paymentModalData);
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 border ${
                      smsCopied
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-gray-100 hover:bg-gray-200 text-text-main border-border-light"
                    }`}
                  >
                    <span>{smsCopied ? "📋 Receipt Copied to Clipboard!" : "📱 Send SMS / Messenger Receipt"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Anti-Fraud Collusion Lock Modal */}
      {fraudModalData && (
        <>
          <div 
            onClick={() => setFraudModalData(null)}
            className="fixed inset-0 bg-black/60 z-50 transition-opacity"
          />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-6 rounded-2xl border-2 border-red-500 shadow-2xl flex flex-col space-y-4 font-sans">
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
                Farmer <span className="font-bold underline">{fraudModalData.farmerName} ({fraudModalData.farmerId})</span> has <strong>ALREADY</strong> delivered milk for today&apos;s <strong>{fraudModalData.shift} Shift</strong>.
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Log ID:</span>
                  <span className="font-bold text-gray-800">{fraudModalData.existingLog?.id || 'RECENT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume Logged:</span>
                  <span className="font-bold text-gray-800">{fraudModalData.existingLog?.weight} Liters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recorded Shift:</span>
                  <span className="font-bold text-gray-800">{fraudModalData.existingLog?.time} ({fraudModalData.existingLog?.date})</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-semibold leading-normal">
                🛡️ <strong>Rule Enforcement:</strong> Multiple logs in the same shift are locked to prevent operator-farmer collusion and double payment fraud. Morning and Evening are independent shifts.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFraudModalData(null)}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl transition-all"
              >
                Enforce Lock (Cancel)
              </button>
              <a
                href="mailto:dairy3t@gmail.com?subject=3T%20Anti-Fraud%20Lock%20Inquiry"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact 3T</span>
              </a>
            </div>
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Bluetooth & Dual Display Hub Modal */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isBluetoothModalOpen && (
        <>
          <div
            onClick={() => setIsBluetoothModalOpen(false)}
            className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs"
          />
          <div className="fixed inset-0 m-auto max-w-xl h-fit bg-white z-50 p-6 sm:p-7 rounded-3xl border border-border-light shadow-premium-lg flex flex-col space-y-6 font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-teal-500 flex items-center justify-center text-white shadow-md">
                  <Bluetooth className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-text-main">
                    Bluetooth & Secondary Display Hub
                  </h3>
                  <p className="text-xs text-text-muted font-medium mt-0.5">
                    Connect wireless customer displays & digital Bluetooth scales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBluetoothModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-text-muted transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setBluetoothTab("dual_screen")}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                  bluetoothTab === "dual_screen"
                    ? "bg-white text-text-main shadow-sm"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <Tv className="w-4 h-4 text-primary" />
                <span>🖥️ Customer Dual Screen</span>
              </button>

              <button
                type="button"
                onClick={() => setBluetoothTab("bluetooth")}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                  bluetoothTab === "bluetooth"
                    ? "bg-white text-text-main shadow-sm"
                    : "text-text-muted hover:text-text-main"
                }`}
              >
                <Bluetooth className="w-4 h-4 text-blue-500" />
                <span>🔵 Bluetooth Scale Hardware</span>
              </button>
            </div>

            {/* Tab 1: Customer Dual Screen */}
            {bluetoothTab === "dual_screen" && (
              <div className="space-y-5">
                {/* 1-Click Launch */}
                <div className="p-5 bg-gradient-to-br from-primary-light/50 to-emerald-50/30 rounded-2xl border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-primary uppercase tracking-wider">
                      Option 1: Second Monitor via HDMI / Extend
                    </span>
                    <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      0ms Real-Time Sync
                    </span>
                  </div>
                  <p className="text-xs text-text-muted font-medium leading-relaxed">
                    Launch a clean, distraction-free customer weighment slip window. Drag it onto your second monitor facing the farmer and press <strong>F11</strong> for fullscreen.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      launchCustomerWindow();
                      setIsBluetoothModalOpen(false);
                    }}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-extrabold text-xs rounded-xl shadow-premium transition-all flex items-center justify-center space-x-2"
                  >
                    <Tv className="w-4 h-4" />
                    <span>🖥️ Launch Customer Window (Second Monitor)</span>
                  </button>
                </div>

                {/* Wireless Tablet / Mobile QR Pairing */}
                <div className="p-5 bg-gray-50 rounded-2xl border border-border-light space-y-3">
                  <span className="text-xs font-extrabold text-text-main uppercase tracking-wider block">
                    Option 2: Wireless Secondary Tablet / Phone
                  </span>
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-xl border border-border-light shadow-sm shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                          typeof window !== "undefined"
                            ? `${window.location.origin}/branch/${branchId}/display`
                            : `https://3tdairy.vercel.app/branch/${branchId}/display`
                        )}`}
                        alt="Dual Screen QR"
                        className="w-20 h-20"
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <p className="text-xs text-text-muted font-medium leading-snug">
                        Scan with your tablet or phone camera to turn any device on your counter into a live customer display.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const u = `${window.location.origin}/branch/${branchId}/display`;
                          navigator.clipboard.writeText(u);
                          setCopiedDualScreenUrl(true);
                          setTimeout(() => setCopiedDualScreenUrl(false), 2500);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-border-light bg-white text-xs font-bold text-text-main hover:bg-gray-100 transition-all flex items-center space-x-1.5"
                      >
                        <Copy className="w-3.5 h-3.5 text-primary" />
                        <span>{copiedDualScreenUrl ? "✓ Display URL Copied!" : "Copy Display Link"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Bluetooth Hardware Scanner */}
            {bluetoothTab === "bluetooth" && (
              <div className="space-y-5">
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bluetooth className="w-5 h-5 text-blue-400 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-blue-300">
                        Web Bluetooth Scale Pairing
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isBluetoothConnected
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isBluetoothConnected ? "🟢 Paired & Streaming" : "⚪ Disconnected"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Connect directly to BLE Weighing Indicators, Essae Scales, Phoenix Scales, or CAS Analyzers via standard Web Bluetooth GATT.
                  </p>

                  <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleConnectBluetooth}
                      disabled={isBluetoothConnecting}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                    >
                      <Bluetooth className="w-4 h-4" />
                      <span>{isBluetoothConnecting ? "Searching for Scale..." : "Scan & Pair Bluetooth Scale"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        simulateHardwareReading();
                        setIsBluetoothConnected(true);
                        setBluetoothDeviceName("Essae DX-100 (BLE Sensor)");
                        setIsHardwareLocked(false);
                      }}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span>Simulate Stream</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-border-light text-xs space-y-1.5 font-medium text-text-muted">
                  <div className="flex items-center space-x-1.5 font-bold text-text-main">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Supported Scale Protocols:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed pl-5.5">
                    • IEEE-11073 Standard Weight Scale BLE Service (0x181D)<br />
                    • Standard BLE Serial ASCII Streaming Indicators (Essae, Avery, CAS, Phoenix)<br />
                    • Optical Zero-Tamper Scale Lock protocol
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
