"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, CheckCheck, Megaphone, TrendingDown, Gift, DollarSign, Stethoscope, CreditCard, Info } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  farmerId: string;
  branchId: string;
  createdAt: string;
  readBy: string[];
}

interface Props {
  farmerId: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification type config
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  milk_drop_alert:  { icon: TrendingDown,  color: "text-red-600",    bg: "bg-red-50 border-red-200",    label: "Milk Alert" },
  bonus:            { icon: Gift,          color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Bonus" },
  bonus_rate:       { icon: Gift,          color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", label: "Bonus" },
  rate_change:      { icon: DollarSign,    color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",   label: "Rate Change" },
  announcement:     { icon: Megaphone,     color: "text-purple-600", bg: "bg-purple-50 border-purple-200", label: "Notice" },
  health_advisory:  { icon: Stethoscope,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-200", label: "Health" },
  payment_credited: { icon: CreditCard,   color: "text-teal-600",   bg: "bg-teal-50 border-teal-200",   label: "Payment" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function NotificationPanel({ farmerId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const getClientReadIds = useCallback((): Set<string> => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(`3t_read_notifs_${farmerId}`);
        if (raw) return new Set(JSON.parse(raw));
      }
    } catch {}
    return new Set();
  }, [farmerId]);

  const saveClientReadIds = useCallback((ids: string[]) => {
    try {
      if (typeof window !== "undefined") {
        const current = getClientReadIds();
        ids.forEach((id) => current.add(id));
        localStorage.setItem(`3t_read_notifs_${farmerId}`, JSON.stringify(Array.from(current)));
      }
    } catch {}
  }, [farmerId, getClientReadIds]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`/api/farmer/notifications?farmerId=${encodeURIComponent(farmerId)}&_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        const localReadIds = getClientReadIds();
        const merged = data.notifications.map((n: Notification) => {
          const isReadLocally = localReadIds.has(n.id);
          const isReadServer = n.readBy.some((r: string) => r.toUpperCase() === farmerId.toUpperCase());
          if (isReadLocally && !isReadServer) {
            return { ...n, readBy: [...n.readBy, farmerId] };
          }
          return n;
        });
        const unread = merged.filter((n: Notification) => !n.readBy.some((r: string) => r.toUpperCase() === farmerId.toUpperCase())).length;
        setNotifications(merged);
        setUnreadCount(unread);
      }
    } catch {}
  }, [farmerId, getClientReadIds]);

  // Fetch on mount and on realtime broadcast / 4s interval
  useEffect(() => {
    fetchNotifications();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => {
          fetchNotifications();
        };
      }
    } catch {}

    const interval = setInterval(fetchNotifications, 4_000);
    return () => {
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const handleOpen = async () => {
    setIsOpen(true);
    // Persist read status locally so badge NEVER pops back up
    const visibleIds = notifications.map((n) => n.id);
    saveClientReadIds(visibleIds);

    // Optimistically mark all as read in UI immediately
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        readBy: Array.from(new Set([...n.readBy, farmerId]))
      }))
    );
    setUnreadCount(0);

    try {
      await fetch(`/api/farmer/notifications?farmerId=${encodeURIComponent(farmerId)}`, { method: "PATCH" });
    } catch {}
  };

  return (
    <>
      {/* ── Bell Button ── */}
      <div className="relative no-print">
        <button
          id="notification-bell-btn"
          onClick={handleOpen}
          className="relative w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* ── Notification Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 no-print"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col no-print"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-emerald-700" />
                  <h2 className="font-black text-gray-900 text-base">Notifications</h2>
                  {notifications.length > 0 && (
                    <span className="text-xs font-bold text-gray-400">({notifications.length})</span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-2 px-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Bell className="w-7 h-7 text-gray-300" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-700 text-sm">No notifications yet</p>
                      <p className="text-xs text-gray-400 font-medium mt-1">Messages from your collection center will appear here</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const cfg = TYPE_CONFIG[notif.type] || { icon: Info, color: "text-gray-600", bg: "bg-gray-50 border-gray-200", label: "Info" };
                    const Icon = cfg.icon;
                    const isUnread = !notif.readBy.some((r: string) => r.trim().toUpperCase() === farmerId.trim().toUpperCase());

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border ${cfg.bg} ${isUnread ? "ring-2 ring-emerald-300/50" : ""} relative`}
                      >
                        {isUnread && (
                          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border ${cfg.bg}`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                                {cfg.label}
                              </span>
                              <span className="text-[9px] font-semibold text-gray-400">
                                {timeAgo(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs font-black text-gray-900 leading-snug">{notif.title}</p>
                            <p className="text-xs font-medium text-gray-600 leading-relaxed mt-1">{notif.body}</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 shrink-0">
                  <p className="text-[10px] text-center text-gray-400 font-medium flex items-center justify-center space-x-1">
                    <CheckCheck className="w-3 h-3" />
                    <span>Messages from 3T Collection Center</span>
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
