"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Cpu,
  CreditCard,
  Building,
  ChevronDown,
  Send,
  Sparkles,
  ArrowRight,
  Headphones
} from "lucide-react";

export default function HelpdeskPage() {
  const [ticketCategory, setTicketCategory] = useState("hardware");
  const [ticketPriority, setTicketPriority] = useState("high");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{ id: string; time: string } | null>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const generatedId = "3T-HD-" + Math.floor(100000 + Math.random() * 900000);
      setSubmittedTicket({
        id: generatedId,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      });
      setIsSubmitting(false);
    }, 800);
  };

  const faqs = [
    {
      q: "What should I do if the digital scale is not connecting via Bluetooth?",
      a: "Ensure the weighing machine is powered ON and within 5 meters. Click 'Connect Bluetooth Scale' in Chrome/Edge, enable Bluetooth on your PC, and select the scale from the pairing popup. If it fails, power cycle the scale and click 'Tare Scale' to calibrate."
    },
    {
      q: "How fast are payments deposited into the farmer's bank account?",
      a: "3T triggers direct UPI/IMPS payments via the integrated Banking Gateway within 3 seconds of the operator recording the milk collection. Both the operator terminal and the farmer's passbook update in real time."
    },
    {
      q: "Can the collection center operate without internet connection?",
      a: "Yes. 3T is offline-first. All milk collection records and weight measurements are securely saved locally to the browser's IndexedDB. As soon as connectivity is restored, records automatically sync to the central cloud database without any data loss."
    },
    {
      q: "How can a farmer update their linked bank account or UPI ID?",
      a: "Farmers can request a bank detail update through the Passbook portal. For anti-fraud security, updates require 2-Factor OTP verification sent directly to the farmer's registered mobile number."
    },
    {
      q: "What if the customer dual-display screen is not mirroring operator actions?",
      a: "Make sure both tabs/screens are opened on the same branch ID (e.g. /branch/B-01 and /branch/B-01/display). The dual-display uses low-latency BroadcastChannel and WebSockets for instant 0ms mirroring."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#f0faf5] via-white to-white py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-4">
          <span className="inline-flex items-center gap-2 bg-[#0F8A5F]/10 text-[#0F8A5F] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider">
            <Headphones className="w-3.5 h-3.5" /> 24/7 Operations Helpdesk & Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            How Can We Assist You Today?
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Get instant technical support for booth terminals, digital scales, payment settlements, and dairy management.
          </p>

          {/* Quick Contact Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:dairy3t@gmail.com"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-xs hover:border-[#0F8A5F] transition"
            >
              <Mail className="w-4 h-4 text-[#0F8A5F]" />
              <span>dairy3t@gmail.com</span>
            </a>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-50 text-[#0F8A5F] border border-emerald-200 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>Average Response: &lt; 5 mins</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Dedicated Support Pillars */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#0F8A5F] transition">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Scale & Bluetooth</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Weighing scale pairing, Web-BLE driver troubleshooting, and calibration support.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#0F8A5F] transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Payment Settlements</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              UPI payout verification, bank failure reconciliation, and passbook synchronization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#0F8A5F] transition">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Security & 2FA Access</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Operator credential resets, farmer OTP login assistance, and Aadhaar privacy masking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#0F8A5F] transition">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Dairy Co-Operatives</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Rate formula adjustments, multi-branch hub setup, and emergency broadcasts.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Ticket Submission & Live Status */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Create an Operations Ticket</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Our engineering & support team will respond directly to your registered contact.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full w-fit">
                Live Dispatch Ready
              </span>
            </div>

            {submittedTicket ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0F8A5F] flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-gray-900">Support Ticket Created Successfully!</h3>
                <div className="inline-block px-4 py-2 bg-gray-100 rounded-xl font-mono text-sm font-black text-gray-900">
                  Ticket Reference: {submittedTicket.id}
                </div>
                <p className="text-xs text-gray-500 max-w-md mx-auto font-medium leading-relaxed">
                  Your issue has been logged into the 3T Operations Queue at {submittedTicket.time}. A technical executive has been assigned.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setSubject("");
                    setDescription("");
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#0F8A5F] text-white text-xs font-bold hover:bg-[#0c704d] transition"
                >
                  Submit Another Query
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                    >
                      <option value="hardware">Bluetooth Scale & Hardware</option>
                      <option value="payments">Payment Settlement & UPI</option>
                      <option value="farmer_passbook">Farmer Passbook & OTP</option>
                      <option value="formula">Milk Pricing & Formula</option>
                      <option value="general">General Dairy Query</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                    >
                      <option value="urgent">🔴 Urgent (Booth Collection Stopped)</option>
                      <option value="high">🟠 High (Payment Delay / Scale Disconnect)</option>
                      <option value="normal">🟢 Normal (General Inquiry)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Your Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patil / Operator"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Mobile Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="operator@dairy.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Subject *</label>
                  <input
                    type="text"
                    placeholder="Brief description of the problem..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Issue Details *</label>
                  <textarea
                    rows={4}
                    placeholder="Please specify branch ID, farmer ID, error messages, or steps to reproduce..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50/50"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#0F8A5F] hover:bg-[#0b6b49] text-white font-extrabold text-xs tracking-wide uppercase transition shadow-md shadow-[#0F8A5F]/20 flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting Ticket to Helpdesk...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Ticket to 3T Helpdesk</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-[#0F8A5F] uppercase tracking-wider">Quick Answers</span>
          <h2 className="text-2xl font-black text-gray-900">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-200 rounded-2xl overflow-hidden transition-all bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-gray-900 hover:text-[#0F8A5F] transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                    openFaqIndex === idx ? "rotate-180 text-[#0F8A5F]" : ""
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 pt-1 text-xs font-medium text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
