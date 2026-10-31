"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Gift,
  DollarSign,
  TrendingDown,
  Sparkles,
  Stethoscope,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bell,
  X
} from "lucide-react";
import { usePassbookLanguage } from "./PassbookLanguageContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  farmerId: string;
  branchId: string;
  createdAt: string;
  readBy: string[];
  sentBy?: string;
}

interface Props {
  farmerId: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; label: string; labelMr: string }> = {
  bonus_rate: {
    icon: Gift,
    color: "text-emerald-700",
    bg: "from-emerald-50 via-teal-50/70 to-emerald-50",
    border: "border-emerald-300",
    label: "Bonus Rate Announced 🎉",
    labelMr: "बोनस जाहीर 🎉"
  },
  bonus: {
    icon: Gift,
    color: "text-emerald-700",
    bg: "from-emerald-50 via-teal-50/70 to-emerald-50",
    border: "border-emerald-300",
    label: "Bonus Rate Announced 🎉",
    labelMr: "बोनस जाहीर 🎉"
  },
  rate_change: {
    icon: DollarSign,
    color: "text-blue-700",
    bg: "from-blue-50 via-indigo-50/70 to-blue-50",
    border: "border-blue-300",
    label: "Milk Rate Update 💰",
    labelMr: "दूध दर बदल 💰"
  },
  announcement: {
    icon: Megaphone,
    color: "text-purple-700",
    bg: "from-purple-50 via-fuchsia-50/70 to-purple-50",
    border: "border-purple-300",
    label: "Dairy Announcement 📢",
    labelMr: "डेअरी सूचना 📢"
  },
  health_advisory: {
    icon: Stethoscope,
    color: "text-amber-700",
    bg: "from-amber-50 via-orange-50/70 to-amber-50",
    border: "border-amber-300",
    label: "Health & Vet Advisory 🌿",
    labelMr: "आरोग्य व आहार सल्ला 🌿"
  },
  quality_feed_advisory: {
    icon: Sparkles,
    color: "text-amber-800",
    bg: "from-amber-50 via-yellow-50/70 to-amber-50",
    border: "border-amber-300",
    label: "Cattle Feed Advisory 🥛",
    labelMr: "पशुखाद्य व फॅट सल्ला 🥛"
  },
  milk_drop_alert: {
    icon: TrendingDown,
    color: "text-rose-700",
    bg: "from-rose-50 via-red-50/70 to-rose-50",
    border: "border-rose-300",
    label: "Milk Drop Alert ⚠️",
    labelMr: "दूध संकलन घट सूचना ⚠️"
  },
  payment_credited: {
    icon: CreditCard,
    color: "text-teal-700",
    bg: "from-teal-50 via-cyan-50/70 to-teal-50",
    border: "border-teal-300",
    label: "Payment Settled 💳",
    labelMr: "पेमेंट जमा झाले 💳"
  }
};

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now / नुकताच";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return "Recent";
  }
}

export function FarmerBroadcastBanner({ farmerId }: Props) {
  const [unreadNotifs, setUnreadNotifs] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const { lang } = usePassbookLanguage();

  const getClientReadIds = useCallback((): Set<string> => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`3t_read_notifs_${farmerId}`);
        if (raw) return new Set(JSON.parse(raw));
      }
    } catch {}
    return new Set();
  }, [farmerId]);

  const saveClientReadId = useCallback((id: string) => {
    try {
      if (typeof window !== "undefined") {
        const current = getClientReadIds();
        current.add(id);
        localStorage.setItem(`3t_read_notifs_${farmerId}`, JSON.stringify(Array.from(current)));
      }
    } catch {}
  }, [farmerId, getClientReadIds]);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/farmer/notifications?farmerId=${encodeURIComponent(farmerId)}&_t=${Date.now()}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        const localReadIds = getClientReadIds();
        const unread = data.notifications.filter((n: Notification) => {
          const isReadLocal = localReadIds.has(n.id);
          const isReadServer = (n.readBy || []).some(
            (r: string) => r.trim().toUpperCase() === farmerId.trim().toUpperCase()
          );
          return !isReadLocal && !isReadServer;
        });
        setUnreadNotifs(unread);
        if (currentIndex >= unread.length && unread.length > 0) {
          setCurrentIndex(0);
        }
      }
    } catch {}
  }, [farmerId, getClientReadIds, currentIndex]);

  useEffect(() => {
    fetchUnread();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => {
          fetchUnread();
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "3t_last_notification_sync" || e.key?.startsWith("3t_read_notifs_")) {
        fetchUnread();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Fast 3.5s real-time poll
    const interval = setInterval(fetchUnread, 3500);

    return () => {
      if (channel) {
        try { channel.close(); } catch {}
      }
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [fetchUnread]);

  const handleAcknowledge = async (notifId: string) => {
    setIsDismissing(true);
    saveClientReadId(notifId);

    // Optimistically update list
    setUnreadNotifs((prev) => prev.filter((n) => n.id !== notifId));
    if (currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }

    try {
      await fetch(
        `/api/farmer/notifications?farmerId=${encodeURIComponent(farmerId)}&notificationId=${encodeURIComponent(notifId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ farmerId, notificationId: notifId })
        }
      );
    } catch {}

    // Trigger local update event
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("3t_last_notification_sync", Date.now().toString());
      }
    } catch {}

    setIsDismissing(false);
  };

  const handleOpenDrawer = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("3t_open_notifications"));
    }
  };

  if (unreadNotifs.length === 0) {
    return null;
  }

  const activeNotif = unreadNotifs[Math.min(currentIndex, unreadNotifs.length - 1)];
  if (!activeNotif) return null;

  const config = TYPE_CONFIG[activeNotif.type] || TYPE_CONFIG.announcement;
  const Icon = config.icon;

  const isMr = lang === "mr";
  const badgeLabel = isMr ? config.labelMr : config.label;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeNotif.id}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className={`w-full rounded-2xl border ${config.border} bg-gradient-to-r ${config.bg} p-4 sm:p-5 shadow-md relative no-print overflow-hidden`}
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Left info */}
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white shadow-xs border border-white/60 flex items-center justify-center shrink-0 ${config.color}`}>
              <Icon className="w-6 h-6 animate-pulse" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white shadow-2xs border ${config.border} ${config.color}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping mr-1" />
                  {badgeLabel}
                </span>

                <span className="text-[11px] text-gray-500 font-semibold">
                  {timeAgo(activeNotif.createdAt)}
                </span>

                {unreadNotifs.length > 1 && (
                  <span className="text-[10px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-full">
                    {currentIndex + 1} / {unreadNotifs.length}
                  </span>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-black text-gray-900 tracking-tight leading-snug">
                {activeNotif.title}
              </h4>

              <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1 leading-relaxed">
                {activeNotif.body}
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center justify-end space-x-2 shrink-0 self-end md:self-center">
            {unreadNotifs.length > 1 && (
              <div className="flex items-center space-x-1 mr-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : unreadNotifs.length - 1))}
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
                  title="Previous message"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev < unreadNotifs.length - 1 ? prev + 1 : 0))}
                  className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center text-gray-700 transition-colors shadow-2xs"
                  title="Next message"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={isDismissing}
              onClick={() => handleAcknowledge(activeNotif.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center space-x-1.5 border border-emerald-700 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isMr ? "समजले (Acknowledge)" : "Acknowledge"}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDrawer}
              className="px-3 py-2 bg-white/90 hover:bg-white active:scale-95 text-gray-800 text-xs font-bold rounded-xl transition-all border border-gray-300 shadow-2xs flex items-center space-x-1 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-gray-600" />
              <span>{isMr ? `सर्व (${unreadNotifs.length})` : `All (${unreadNotifs.length})`}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
