"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Calendar, RefreshCw, Search, X, Filter, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types (mirror what the API returns)
// ─────────────────────────────────────────────────────────────────────────────

interface CollectionItem {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  date: string;
  time: string;
  weight: number;
  fat: number;
  snf: number;
  rate: number;
  total: number;
  status: string;
  branchId?: string;
}

interface PaymentItem {
  id: string;
  farmerId: string;
  farmerName: string;
  date: string;
  time: string;
  amount: number;
  status: string;
  timeline?: { label: string; status: string; time?: string; description: string }[];
}

interface Props {
  farmerId: string;
  initialCollections: CollectionItem[];
  initialPayments: PaymentItem[];
}

type PeriodType = "all" | "1-10" | "11-20" | "21-31";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LivePassbookLedger({ farmerId, initialCollections, initialPayments }: Props) {
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [payments, setPayments]       = useState<PaymentItem[]>(initialPayments);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isFetching, setIsFetching]   = useState(false);
  const prevCountRef                  = useRef(initialCollections.length);

  // ── Filter State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [periodFilter, setPeriodFilter]   = useState<PeriodType>("all");
  const [customDate, setCustomDate]       = useState<string>("");

  // ── Fetch fresh data from cloud ───────────────────────────────────────────
  const fetchLatest = useCallback(async () => {
    try {
      setIsFetching(true);
      const res = await fetch(`/api/farmer/${encodeURIComponent(farmerId)}/data`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setCollections(json.collections || []);
        setPayments(json.payments || []);
        setLastRefresh(new Date());
        prevCountRef.current = (json.collections || []).length;
      }
    } catch {
      // Silent: don't disrupt the UI if polling fails
    } finally {
      setIsFetching(false);
    }
  }, [farmerId]);

  // ── Startup + BroadcastChannel + 10s heartbeat ─────────────────────────────
  useEffect(() => {
    fetchLatest();

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("3t_realtime_sync");
        channel.onmessage = () => { fetchLatest(); };
      }
    } catch {}

    const intervalId = setInterval(fetchLatest, 10_000);

    return () => {
      if (channel) channel.close();
      clearInterval(intervalId);
    };
  }, [fetchLatest]);

  // ── Extract Available Months from Records ─────────────────────────────────
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    collections.forEach((c) => {
      if (c.date && c.date.length >= 7) {
        monthsSet.add(c.date.slice(0, 7)); // "YYYY-MM"
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [collections]);

  // ── Filtered Collections ──────────────────────────────────────────────────
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const cDate = c.date || "";
      const day = parseInt(cDate.split("-")[2] || "0", 10);
      const monthStr = cDate.slice(0, 7);

      // 1. Custom exact date filter
      if (customDate) {
        if (cDate !== customDate) return false;
      }

      // 2. Month filter (if not using custom exact date)
      if (!customDate && selectedMonth !== "all") {
        if (monthStr !== selectedMonth) return false;
      }

      // 3. 10-Day Period filter (Dekads)
      if (!customDate && periodFilter !== "all") {
        if (periodFilter === "1-10" && (day < 1 || day > 10)) return false;
        if (periodFilter === "11-20" && (day < 11 || day > 20)) return false;
        if (periodFilter === "21-31" && day < 21) return false;
      }

      // 4. Search query (search across date, shift, fat, snf, rate, total, UTR)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchPay = payments.find(p => p.id === c.id || (p.farmerId === c.farmerId && p.date === c.date && p.time === c.time));
        const utr = matchPay?.timeline?.[3]?.description?.toLowerCase() || "";
        const matches =
          cDate.toLowerCase().includes(q) ||
          (c.time || "").toLowerCase().includes(q) ||
          c.weight.toString().includes(q) ||
          c.fat.toString().includes(q) ||
          c.snf.toString().includes(q) ||
          c.rate.toString().includes(q) ||
          c.total.toString().includes(q) ||
          utr.includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [collections, payments, searchQuery, selectedMonth, periodFilter, customDate]);

  // ── Computed Filtered Totals ──────────────────────────────────────────────
  const hasDeliveries = filteredCollections.length > 0;
  const totalVolume   = filteredCollections.reduce((sum, c) => sum + c.weight, 0);
  const totalEarnings = filteredCollections.reduce((sum, c) => sum + c.total, 0);
  const avgFat = hasDeliveries
    ? (filteredCollections.reduce((sum, c) => sum + c.fat, 0) / filteredCollections.length).toFixed(1) + "%"
    : "0.0%";
  const avgSnf = hasDeliveries
    ? (filteredCollections.reduce((sum, c) => sum + c.snf, 0) / filteredCollections.length).toFixed(1) + "%"
    : "0.0%";

  const isFiltered = searchQuery !== "" || selectedMonth !== "all" || periodFilter !== "all" || customDate !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMonth("all");
    setPeriodFilter("all");
    setCustomDate("");
  };

  // Format month name (e.g. "2026-08" -> "August 2026")
  const formatMonthName = (m: string) => {
    try {
      const [year, month] = m.split("-");
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return m;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Summary Cards (Reflects Filtered Period & Deliveries) ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block">
            {isFiltered ? "Filtered Milk Volume" : "Total Milk Volume"}
          </span>
          <span className="text-base sm:text-xl font-black text-gray-900 block mt-1">{totalVolume.toFixed(1)} L</span>
          <span className="text-[10px] font-semibold text-gray-500 block mt-0.5">
            {hasDeliveries ? `${filteredCollections.length} ${filteredCollections.length === 1 ? "Delivery" : "Deliveries"}` : "0 Deliveries"}
          </span>
        </div>

        <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block">
            {isFiltered ? "Period Settled" : "Total Settled Outflow"}
          </span>
          <span className={`text-base sm:text-xl font-black font-mono block mt-1 ${totalEarnings > 0 ? "text-emerald-700" : "text-gray-900"}`}>
            ₹{totalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${totalEarnings > 0 ? "text-emerald-800" : "text-gray-500"}`}>
            {totalEarnings > 0 ? "Direct UPI Credited" : "No Payouts Yet"}
          </span>
        </div>

        <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block">Average FAT%</span>
          <span className="text-base sm:text-xl font-black text-gray-900 block mt-1">{avgFat}</span>
          <span className="text-[10px] font-semibold text-gray-500 block mt-0.5">
            {hasDeliveries ? "Quality Standard" : "No Milk Tested"}
          </span>
        </div>

        <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200 text-center">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider block">Average SNF%</span>
          <span className="text-base sm:text-xl font-black text-gray-900 block mt-1">{avgSnf}</span>
          <span className="text-[10px] font-semibold text-gray-500 block mt-0.5">
            {hasDeliveries ? "Live Quality Index" : "No Milk Tested"}
          </span>
        </div>
      </div>

      {/* ── 10-DAY PERIOD CALENDAR & SEARCH FILTER CONTROLS ─────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-3.5 no-print">
        {/* Top Controls: Search Bar & Month Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD), shift, FAT%, rate, or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-emerald-600 transition-colors bg-[#FAFAFA]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month Dropdown & Custom Date Filter */}
          <div className="flex items-center space-x-2">
            {/* Month selector */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCustomDate(""); // clear custom date when selecting month
              }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-[#FAFAFA] text-gray-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="all">📅 All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthName(m)}
                </option>
              ))}
            </select>

            {/* Exact Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  if (e.target.value) {
                    setPeriodFilter("all");
                    setSelectedMonth("all");
                  }
                }}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold bg-[#FAFAFA] text-gray-800 focus:outline-none focus:border-emerald-600 cursor-pointer max-w-[130px]"
                title="Filter by exact day"
              />
            </div>
          </div>
        </div>

        {/* Bottom Controls: 10-Day Period Billing Cycles (Dekads) */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mr-1 hidden sm:inline">
              10-Day Cycles:
            </span>

            {/* Period 0: All Days */}
            <button
              onClick={() => {
                setPeriodFilter("all");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                periodFilter === "all" && !customDate
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Days
            </button>

            {/* Period 1: Days 1 - 10 */}
            <button
              onClick={() => {
                setPeriodFilter("1-10");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                periodFilter === "1-10"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>1st – 10th</span>
              <span className="text-[10px] opacity-80">(Cycle 1)</span>
            </button>

            {/* Period 2: Days 11 - 20 */}
            <button
              onClick={() => {
                setPeriodFilter("11-20");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                periodFilter === "11-20"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>11th – 20th</span>
              <span className="text-[10px] opacity-80">(Cycle 2)</span>
            </button>

            {/* Period 3: Days 21 - End */}
            <button
              onClick={() => {
                setPeriodFilter("21-31");
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer ${
                periodFilter === "21-31"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>21st – End</span>
              <span className="text-[10px] opacity-80">(Cycle 3)</span>
            </button>
          </div>

          {/* Reset Filters button if any active filter */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Ledger Table & Mobile Cards ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm print:border-black print:rounded-none">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Milk Intake &amp; Payout History ({filteredCollections.length}
              {filteredCollections.length !== collections.length ? ` of ${collections.length}` : ""}{" "}
              Records)
            </span>
          </h3>
          <div className="flex items-center space-x-2 no-print self-end sm:self-auto">
            {isFetching && (
              <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
            )}
            <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
              Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase()}
            </span>
            <span className="text-[10px] sm:text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold font-mono">
              3T-PASSBOOK-VERIFIED
            </span>
          </div>
        </div>

        {/* ── MOBILE CARD VIEW (Phones < md) ── */}
        <div className="block md:hidden divide-y divide-gray-100 p-3 space-y-3">
          {filteredCollections.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-bold text-xs bg-gray-50 rounded-xl space-y-2">
              <p>No milk delivery records match your selected 10-day period or search.</p>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Show All Records
                </button>
              )}
            </div>
          ) : (
            filteredCollections.map((col, idx) => {
              const colSuffix = col.id.replace(/^C-/, "");
              const matchPay = payments.find(p =>
                p.id === col.id ||
                p.id.replace(/^PAY-/, "") === colSuffix ||
                (p.farmerId === col.farmerId && p.date === col.date && p.time === col.time)
              );
              const utr =
                matchPay?.timeline?.[3]?.description?.match(/UTR:\s*(\w+)/)?.[1] ||
                matchPay?.timeline?.[3]?.description?.match(/TXN\d+/)?.[0] ||
                `TXN${90000000 + idx}`;

              return (
                <div key={col.id} className="bg-[#FAFDFB] border border-emerald-100 rounded-2xl p-4 shadow-2xs space-y-3">
                  {/* Top Row: Date, Shift, & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-black text-xs text-gray-900">{col.date}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          col.time === "Morning"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                        }`}
                      >
                        {col.time === "Morning" ? "☀️ Morning" : "🌙 Evening"}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[10px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300">
                      CREDITED
                    </span>
                  </div>

                  {/* Middle Row: Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-white p-2.5 rounded-xl border border-gray-100 text-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-gray-400 block">Volume</span>
                      <span className="font-black text-xs text-gray-900 block mt-0.5">{col.weight.toFixed(1)} L</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-gray-400 block">FAT</span>
                      <span className="font-mono font-bold text-xs text-gray-800 block mt-0.5">{col.fat.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-gray-400 block">SNF</span>
                      <span className="font-mono font-bold text-xs text-gray-800 block mt-0.5">{col.snf.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-gray-400 block">Rate</span>
                      <span className="font-mono font-bold text-xs text-gray-800 block mt-0.5">₹{col.rate.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Payout Total & UTR */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                    <span className="text-[10px] text-gray-500 font-mono">UTR: {utr}</span>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] text-gray-500 font-bold">Payout:</span>
                      <span className="font-mono font-black text-sm text-emerald-700">
                        ₹{col.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP TABLE VIEW (Screens >= md) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100/80 text-[10px] font-bold uppercase text-gray-700 tracking-wider border-b border-gray-200">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-center">Shift</th>
                <th className="px-5 py-3 text-right">Volume (L)</th>
                <th className="px-5 py-3 text-center">FAT%</th>
                <th className="px-5 py-3 text-center">SNF%</th>
                <th className="px-5 py-3 text-right">Rate (₹/L)</th>
                <th className="px-5 py-3 text-right">Payout (₹)</th>
                <th className="px-5 py-3 text-center">Status / UTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-semibold text-gray-900">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-bold text-xs">
                    No milk delivery records match your selected 10-day period or search.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col, idx) => {
                  const colSuffix = col.id.replace(/^C-/, "");
                  const matchPay = payments.find(p =>
                    p.id === col.id ||
                    p.id.replace(/^PAY-/, "") === colSuffix ||
                    (p.farmerId === col.farmerId && p.date === col.date && p.time === col.time)
                  );
                  const utr =
                    matchPay?.timeline?.[3]?.description?.match(/UTR:\s*(\w+)/)?.[1] ||
                    matchPay?.timeline?.[3]?.description?.match(/TXN\d+/)?.[0] ||
                    `TXN${90000000 + idx}`;
                  return (
                    <tr key={col.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-900">{col.date}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            col.time === "Morning"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          }`}
                        >
                          {col.time}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{col.weight.toFixed(1)} L</td>
                      <td className="px-5 py-3.5 text-center font-mono">{col.fat.toFixed(1)}%</td>
                      <td className="px-5 py-3.5 text-center font-mono">{col.snf.toFixed(1)}%</td>
                      <td className="px-5 py-3.5 text-right font-mono text-gray-700">₹{col.rate.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-black text-emerald-800 text-sm">
                        ₹{col.total.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="space-y-0.5">
                          <span className="inline-block text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            CREDITED
                          </span>
                          <span className="block text-[9px] font-mono text-gray-500 font-normal">{utr}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
