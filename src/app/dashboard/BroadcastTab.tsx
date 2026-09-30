"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Send,
  Loader2,
  Trash2,
  Gift,
  DollarSign,
  Stethoscope,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  UserCheck,
  BellRing,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  farmerId: string;
  branchId: string;
  createdAt: string;
  sentBy: string;
}

interface FarmerOption {
  id: string;
  name: string;
  village: string;
}

interface BranchOption {
  id: string;
  name: string;
}

const TYPE_OPTIONS = [
  { value: "bonus_rate", label: "Bonus Rate 🎉", desc: "Announce Diwali/Festive bonus per liter" },
  { value: "rate_change", label: "Rate Change 💰", desc: "Milk price formula or FAT factor update" },
  { value: "announcement", label: "General Announcement 📢", desc: "Center schedule, holiday, or general notice" },
  { value: "health_advisory", label: "Health & Vet Advisory 🌿", desc: "Vaccination camp, disease warning, feed advice" },
  { value: "milk_drop_alert", label: "Milk Drop Alert 🔴", desc: "Alert farmer about drop in milk quantity" },
];

export function BroadcastTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("announcement");
  const [targetType, setTargetType] = useState<"all" | "branch" | "farmer">("all");
  const [selectedBranch, setSelectedBranch] = useState("B-01");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pastBroadcasts, setPastBroadcasts] = useState<NotificationItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    // Load farmers & branches for dropdowns
    fetch("/api/farmers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setFarmers(data.data);
      })
      .catch(() => {});

    fetch("/api/branches")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setBranches(data.data);
      })
      .catch(() => {});

    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/broadcast?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setPastBroadcasts(data.notifications);
      }
    } catch {}
    setLoadingHistory(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg("Please enter both Title and Message.");
      return;
    }

    if (targetType === "farmer" && !selectedFarmerId) {
      setErrorMsg("Please select a farmer to send the direct message to.");
      return;
    }

    setSending(true);
    setSuccessMsg("");
    setErrorMsg("");

    const payload = {
      type,
      title: title.trim(),
      message: message.trim(),
      farmerId: targetType === "farmer" ? selectedFarmerId : "ALL",
      branchId: targetType === "branch" ? selectedBranch : "ALL",
    };

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.notification) {
        setSuccessMsg(`Notification sent successfully! ID: ${data.notification.id}`);
        setTitle("");
        setMessage("");
        // Instantly prepend to the state list
        setPastBroadcasts((prev) => [
          data.notification,
          ...prev.filter((p) => p.id !== data.notification.id),
        ]);
        try {
          if (typeof window !== "undefined" && "BroadcastChannel" in window) {
            const channel = new BroadcastChannel("3t_realtime_sync");
            channel.postMessage({ type: "NOTIFICATION_SENT", time: Date.now() });
            channel.close();
          }
        } catch {}
      } else {
        setErrorMsg(data.error || "Failed to send notification.");
      }
    } catch {
      setErrorMsg("Server error while sending broadcast.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification broadcast?")) return;
    try {
      await fetch(`/api/admin/broadcast?id=${id}`, { method: "DELETE" });
      setPastBroadcasts((prev) => prev.filter((n) => n.id !== id));
      try {
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("3t_realtime_sync");
          channel.postMessage({ type: "NOTIFICATION_DELETED", time: Date.now() });
          channel.close();
        }
      } catch {}
    } catch {}
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <BellRing className="w-6 h-6 text-emerald-200" />
            <h2 className="text-xl font-black">Farmer Communication Hub</h2>
          </div>
          <p className="text-xs text-emerald-100 font-medium max-w-xl">
            Send instant notifications, bonus rate announcements, health warnings, or custom messages directly to farmer passbooks.
          </p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
          <Megaphone className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{pastBroadcasts.length} Sent Messages</span>
        </div>
      </div>

      {/* Main Broadcast Form */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <h3 className="text-base font-black text-gray-900 flex items-center space-x-2">
          <Send className="w-5 h-5 text-emerald-600" />
          <span>Compose New Message</span>
        </h3>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-6">
          {/* 1. Message Type */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">Message Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    type === opt.value
                      ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <p className="text-xs font-black text-gray-900">{opt.label}</p>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Audience */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                  targetType === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Farmers</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("branch")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                  targetType === "branch"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Specific Branch</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("farmer")}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                  targetType === "farmer"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Single Farmer</span>
              </button>
            </div>

            {/* Target Dropdown options */}
            {targetType === "branch" && (
              <div className="mt-3 max-w-xs">
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Select Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.name}
                    </option>
                  ))}
                  {branches.length === 0 && <option value="B-01">B-01 — Central Collection Hub</option>}
                </select>
              </div>
            )}

            {targetType === "farmer" && (
              <div className="mt-3 max-w-sm">
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Select Farmer</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => setSelectedFarmerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose a farmer --</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id} — {f.name} ({f.village})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. Title */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Message Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 🎉 Diwali Milk Bonus: ₹2 Extra Per Liter!"
              className="w-full px-4 py-3 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* 4. Body */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Message Content</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. All milk deliveries between Oct 20 - Nov 5 will receive an additional ₹2/L bonus directly credited to your account."
              className="w-full px-4 py-3 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending || (targetType === "farmer" && !selectedFarmerId)}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Broadcast Message</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-black text-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            <span>Sent Messages History</span>
          </div>
          <span className="text-xs font-bold text-gray-400">{pastBroadcasts.length} Messages</span>
        </h3>

        {loadingHistory ? (
          <div className="py-8 text-center text-xs text-gray-400 font-semibold">Loading sent history...</div>
        ) : pastBroadcasts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 font-semibold">
            No broadcast messages sent yet. Use the form above to send your first message.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Title & Message</th>
                  <th className="pb-3 px-2">Audience</th>
                  <th className="pb-3 px-2">Sent Date</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastBroadcasts.map((n) => (
                  <tr key={n.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {n.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 max-w-sm">
                      <p className="font-bold text-gray-900 text-xs">{n.title}</p>
                      <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-0.5">{n.body}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-mono text-gray-700 text-[11px]">
                        {n.farmerId === "ALL" ? "All Farmers" : n.farmerId}
                        {n.branchId !== "ALL" ? ` (${n.branchId})` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-[11px]">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
