"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Wrench,
  FileQuestion,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  Trash2,
  Send,
  Loader2,
  Check,
  AlertTriangle,
  User,
  ShieldCheck,
  Calendar,
  Sparkles
} from "lucide-react";
import { FarmerQuery, QueryCategory, QueryStatus } from "@/app/data";

interface FarmerQueriesTabProps {
  onQueriesUpdated?: (pendingCount: number) => void;
}

export function FarmerQueriesTab({ onQueriesUpdated }: FarmerQueriesTabProps) {
  const [queries, setQueries] = useState<FarmerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Per-query editing state
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStatus, setEditStatus] = useState<Record<string, QueryStatus>>({});
  const [updateFeedback, setUpdateFeedback] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/farmer/query?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.queries)) {
        setQueries(data.queries);
        const pending = data.queries.filter((q: FarmerQuery) => q.status === "pending").length;
        if (onQueriesUpdated) onQueriesUpdated(pending);

        // Pre-fill edit state
        const notesMap: Record<string, string> = {};
        const statusMap: Record<string, QueryStatus> = {};
        data.queries.forEach((q: FarmerQuery) => {
          notesMap[q.id] = q.adminNotes || "";
          statusMap[q.id] = q.status;
        });
        setEditNotes(notesMap);
        setEditStatus(statusMap);
      }
    } catch (err) {
      console.warn("Failed to fetch queries:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadQueries();
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = queries.length;
    const payment = queries.filter((q) => q.category === "payment").length;
    const technical = queries.filter((q) => q.category === "technical").length;
    const general = queries.filter((q) => q.category === "general").length;
    const pending = queries.filter((q) => q.status === "pending").length;
    const inProgress = queries.filter((q) => q.status === "in_progress").length;
    const resolved = queries.filter((q) => q.status === "resolved").length;
    return { total, payment, technical, general, pending, inProgress, resolved };
  }, [queries]);

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      // Category filter
      if (selectedCategory !== "ALL" && q.category !== selectedCategory) return false;
      // Status filter
      if (selectedStatus !== "ALL" && q.status !== selectedStatus) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const needle = searchQuery.toLowerCase().trim();
        const matchesId = (q.id || "").toLowerCase().includes(needle);
        const matchesFarmerId = (q.farmerId || "").toLowerCase().includes(needle);
        const matchesFarmerName = (q.farmerName || "").toLowerCase().includes(needle);
        const matchesPhone = (q.farmerPhone || "").toLowerCase().includes(needle);
        const matchesSubject = (q.subject || "").toLowerCase().includes(needle);
        const matchesDesc = (q.description || "").toLowerCase().includes(needle);
        return (
          matchesId ||
          matchesFarmerId ||
          matchesFarmerName ||
          matchesPhone ||
          matchesSubject ||
          matchesDesc
        );
      }

      return true;
    });
  }, [queries, selectedCategory, selectedStatus, searchQuery]);

  const handleUpdateQuery = async (queryId: string) => {
    setUpdatingId(queryId);
    setUpdateFeedback((prev) => ({ ...prev, [queryId]: "" }));
    try {
      const targetStatus = editStatus[queryId];
      const targetNotes = editNotes[queryId] || "";

      const res = await fetch("/api/farmer/query", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryId,
          status: targetStatus,
          adminNotes: targetNotes,
          resolvedBy: "Dairy Administrator"
        })
      });

      const data = await res.json();
      if (data.success && data.query) {
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? data.query : q))
        );
        const updatedList = queries.map((q) => (q.id === queryId ? data.query : q));
        const pending = updatedList.filter((q) => q.status === "pending").length;
        if (onQueriesUpdated) onQueriesUpdated(pending);

        setUpdateFeedback((prev) => ({
          ...prev,
          [queryId]: "✓ Status and note updated successfully!"
        }));
        setTimeout(() => {
          setUpdateFeedback((prev) => ({ ...prev, [queryId]: "" }));
        }, 4000);
      } else {
        alert(data.error || "Update failed.");
      }
    } catch {
      alert("Network error while updating query.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!window.confirm(`Are you sure you want to dismiss / delete query #${queryId}?`)) {
      return;
    }
    setDeletingId(queryId);
    try {
      const res = await fetch(`/api/farmer/query?queryId=${encodeURIComponent(queryId)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        const nextList = queries.filter((q) => q.id !== queryId);
        setQueries(nextList);
        const pending = nextList.filter((q) => q.status === "pending").length;
        if (onQueriesUpdated) onQueriesUpdated(pending);
      }
    } catch {
      alert("Failed to delete query.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border-light shadow-premium-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-black text-text-main">
                Farmer Queries & Support Desk
              </h2>
              <span className="text-[10px] font-extrabold bg-primary-light text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Live Helpdesk
              </span>
            </div>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              शेतकरी तक्रारी व तांत्रिक अडचणी — Review payment disputes and app issues submitted by farmers without email
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-end md:self-auto">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-text-main font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-border-light shadow-2xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold">Total Queries</span>
            <FileQuestion className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-text-main">
            {metrics.total}
          </div>
          <span className="text-[10px] text-text-muted font-medium">All logged issues</span>
        </div>

        {/* Payment Issues */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold">Payment Issues</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950">
            {metrics.payment}
          </div>
          <span className="text-[10px] text-amber-700 font-medium">Milk bills, UTR, rates</span>
        </div>

        {/* Technical Issues */}
        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-xs font-bold">Technical Issues</span>
            <Wrench className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-950">
            {metrics.technical}
          </div>
          <span className="text-[10px] text-indigo-700 font-medium">Passbook, QR, login</span>
        </div>

        {/* Pending Action */}
        <div className={`p-4 rounded-2xl border shadow-2xs ${
          metrics.pending > 0
            ? "bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30"
            : "bg-white border-border-light text-text-main"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${metrics.pending > 0 ? "text-amber-100" : "text-text-muted"}`}>
              Pending Review
            </span>
            <Clock className={`w-4 h-4 ${metrics.pending > 0 ? "text-white" : "text-amber-500"}`} />
          </div>
          <div className={`mt-2 text-2xl font-black ${metrics.pending > 0 ? "text-white" : "text-amber-600"}`}>
            {metrics.pending}
          </div>
          <span className={`text-[10px] font-bold ${metrics.pending > 0 ? "text-amber-100" : "text-text-muted"}`}>
            Requires Attention
          </span>
        </div>

        {/* Resolved */}
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950">
            {metrics.resolved}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Successfully closed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border-light shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Farmer Name, ID (F-102), Phone, Query ID (#QRY-...), or issue..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-border-light rounded-xl text-xs text-text-main focus:bg-white focus:ring-2 focus:ring-primary focus:outline-hidden transition-all"
            />
          </div>

          {/* Clear Search */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category & Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-muted mr-1">Category:</span>
            {[
              { id: "ALL", label: "All Categories" },
              { id: "payment", label: "💳 Payment Issues" },
              { id: "technical", label: "⚙️ Technical Issues" },
              { id: "general", label: "📝 General Inquiries" }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-gray-100 text-text-muted hover:text-text-main hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-text-muted mr-1">Status:</span>
            {[
              { id: "ALL", label: "All Status" },
              { id: "pending", label: "⏳ Pending" },
              { id: "in_progress", label: "🔄 In Progress" },
              { id: "resolved", label: "✅ Resolved" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  selectedStatus === st.id
                    ? "bg-gray-900 text-white shadow-2xs"
                    : "bg-gray-100 text-text-muted hover:text-text-main hover:bg-gray-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query List Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border-light text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-text-muted font-medium">Loading farmer queries...</p>
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-border-light text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-extrabold text-text-main">No Queries Found</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            {searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL"
              ? "No queries match your current search and filter selections."
              : "No farmer queries have been submitted yet. When farmers raise payment or technical issues from their passbook, they will appear right here."}
          </p>
          {(searchQuery || selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text-main text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((item) => {
            const isUpdating = updatingId === item.id;
            const isDeleting = deletingId === item.id;
            const currentEditStatus = editStatus[item.id] || item.status;
            const currentEditNotes = editNotes[item.id] !== undefined ? editNotes[item.id] : (item.adminNotes || "");
            const feedback = updateFeedback[item.id];

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all shadow-premium-sm overflow-hidden ${
                  item.status === "pending"
                    ? "border-amber-300 ring-1 ring-amber-300/30"
                    : item.status === "in_progress"
                    ? "border-blue-300"
                    : "border-border-light hover:border-gray-300"
                }`}
              >
                {/* Query Header Row */}
                <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-black text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                      #{item.id}
                    </span>

                    {/* Category pill */}
                    <span
                      className={`text-[11px] font-black px-2.5 py-1 rounded-xl flex items-center space-x-1.5 ${
                        item.category === "payment"
                          ? "bg-amber-100 text-amber-900 border border-amber-200"
                          : item.category === "technical"
                          ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      {item.category === "payment" ? (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                          <span>Payment Problem</span>
                        </>
                      ) : item.category === "technical" ? (
                        <>
                          <Wrench className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Technical Problem</span>
                        </>
                      ) : (
                        <>
                          <FileQuestion className="w-3.5 h-3.5 text-emerald-700" />
                          <span>General Query</span>
                        </>
                      )}
                    </span>

                    {/* Language tag */}
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-md">
                      {item.language === "marathi"
                        ? "🇮🇳 मराठी"
                        : item.language === "hindi"
                        ? "🇮🇳 हिंदी"
                        : "🇬🇧 English"}
                    </span>
                  </div>

                  {/* Status Indicator & Timestamp */}
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[11px] font-black px-3 py-1 rounded-xl border flex items-center space-x-1.5 ${
                        item.status === "resolved"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : item.status === "in_progress"
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-amber-50 border-amber-300 text-amber-900 animate-pulse"
                      }`}
                    >
                      {item.status === "resolved" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Resolved / निकाली</span>
                        </>
                      ) : item.status === "in_progress" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          <span>In Progress / प्रक्रियेत</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Pending / प्रतिक्षित</span>
                        </>
                      )}
                    </span>

                    <span className="text-[11px] text-text-muted font-medium flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Farmer Profile Info Bar */}
                <div className="px-4 sm:px-5 py-3 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {item.farmerId}
                    </div>
                    <div>
                      <span className="font-extrabold text-gray-900 block">
                        {item.farmerName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Farmer ID: {item.farmerId}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Call farmer button */}
                    {item.farmerPhone && (
                      <a
                        href={`tel:${item.farmerPhone}`}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-[11px]"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-mono">{item.farmerPhone}</span>
                      </a>
                    )}

                    {/* WhatsApp button */}
                    {item.farmerPhone && (
                      <a
                        href={`https://wa.me/91${item.farmerPhone.replace(/\D/g, "").slice(-10)}?text=Namaskar%20${encodeURIComponent(item.farmerName)},%20this%20is%20regarding%20your%20dairy%20query%20%23${item.id}%20about:%20${encodeURIComponent(item.subject)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp Farmer</span>
                      </a>
                    )}

                    {/* View passbook */}
                    <a
                      href={`/farmer/${item.farmerId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-[11px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Passbook</span>
                    </a>
                  </div>
                </div>

                {/* Problem Description Container */}
                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 flex items-center space-x-1.5">
                      <span>📌 Issue:</span>
                      <span className="text-gray-800 font-extrabold">{item.subject}</span>
                    </h4>
                    <div className="mt-2 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </div>
                  </div>

                  {/* Admin Resolution Form */}
                  <div className="pt-2 border-t border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-gray-700 shrink-0">
                          Update Status:
                        </label>
                        <select
                          value={currentEditStatus}
                          onChange={(e) =>
                            setEditStatus((prev) => ({
                              ...prev,
                              [item.id]: e.target.value as QueryStatus
                            }))
                          }
                          className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary focus:outline-hidden"
                        >
                          <option value="pending">⏳ Pending (प्रतिक्षित)</option>
                          <option value="in_progress">🔄 In Progress (तपासणी सुरू)</option>
                          <option value="resolved">✅ Resolved (निकाली काढले)</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuery(item.id)}
                          disabled={isUpdating}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Save & Respond</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuery(item.id)}
                          disabled={isDeleting}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Delete / Dismiss Query"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Admin Notes Textarea */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 block mb-1">
                        Admin Resolution Note / Response to Farmer (visible to farmer in passbook):
                      </label>
                      <textarea
                        rows={2}
                        value={currentEditNotes}
                        onChange={(e) =>
                          setEditNotes((prev) => ({
                            ...prev,
                            [item.id]: e.target.value
                          }))
                        }
                        placeholder="e.g., Bank transaction verified. Amount of ₹1,450 credited with UTR #982741 on Oct 26."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
                      />
                    </div>

                    {/* Feedback message */}
                    {feedback && (
                      <div className="text-xs font-bold text-emerald-700 animate-in fade-in flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{feedback}</span>
                      </div>
                    )}

                    {/* Resolved info footer if present */}
                    {item.resolvedAt && (
                      <div className="text-[10px] text-gray-400 font-medium">
                        Resolved on{" "}
                        {new Date(item.resolvedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}{" "}
                        by {item.resolvedBy || "Administrator"}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
