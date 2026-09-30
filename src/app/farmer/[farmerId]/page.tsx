import React from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Phone, MapPin, ArrowLeft, LogOut } from "lucide-react";
import Link from "next/link";
import { PassbookHeaderActions } from "./PassbookHeaderActions";
import { AIMitra } from "./AIMitra";
import { NotificationPanel } from "./NotificationPanel";
import { LivePassbookLedger } from "./LivePassbookLedger";
import { FarmerLogoutButton } from "./FarmerLogoutButton";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: Promise<{ farmerId: string }> | { farmerId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const farmerId = resolvedParams?.farmerId || "";
  const db = await getDb();
  const farmer = db.data.farmers.find(f => f.id.toUpperCase() === farmerId.toUpperCase());
  return {
    title: farmer ? `3T Passbook - ${farmer.name}` : "3T Farmer Passbook",
    manifest: `/api/manifest?farmerId=${farmerId}`,
  };
}

export default async function PublicFarmerPassbookPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params);
  const farmerId = resolvedParams?.farmerId || "";

  // ── Session Check ──────────────────────────────────────────────────────────
  // Allow access if:
  //  (a) a valid farmer OTP session exists AND it matches this farmerId, OR
  //  (b) a valid admin session exists (dashboard staff QR scan)
  const cookieStore = await cookies();
  const farmerToken = cookieStore.get("3t_farmer_token")?.value;
  const adminToken = cookieStore.get("3t_session_token")?.value;

  let isAdmin = false;
  let isOwnFarmer = false;

  if (adminToken) {
    const adminSession = await verifySession(adminToken);
    if (adminSession && adminSession.role !== "farmer") {
      isAdmin = true;
    }
  }

  if (farmerToken && !isAdmin) {
    const farmerSession = await verifySession(farmerToken);
    // farmerSession.name stores the farmerId
    if (farmerSession && farmerSession.role === "farmer" && farmerSession.name.toUpperCase() === farmerId.toUpperCase()) {
      isOwnFarmer = true;
    }
  }

  // If neither admin nor the matching farmer — redirect to login
  if (!isAdmin && !isOwnFarmer) {
    redirect(`/farmer/login?next=/farmer/${farmerId}`);
  }

  // ── Load Data ──────────────────────────────────────────────────────────────
  const db = await getDb();
  let farmer = db.data.farmers.find(f => f.id.toUpperCase() === farmerId.toUpperCase());

  // Fallback to Supabase cloud if farmer was added on another instance
  if (!farmer) {
    try {
      const { data: directFarmer } = await supabase
        .from('farmers')
        .select('*')
        .eq('id', farmerId)
        .single();
      if (directFarmer) {
        farmer = {
          id: directFarmer.id,
          name: directFarmer.name,
          phone: directFarmer.phone,
          village: directFarmer.village,
          animals: directFarmer.animals || 0,
          avgFat: directFarmer.avg_fat || 0,
          avgSnf: directFarmer.avg_snf || 0,
          monthlyEarnings: directFarmer.monthly_earnings || 0,
          branchId: directFarmer.branch_id || 'B-01',
          aadhaar: directFarmer.aadhaar || '',
          bankAccount: directFarmer.bank_account || '',
          ifsc: directFarmer.ifsc || '',
          upiId: directFarmer.upi_id || '',
          qrCode: directFarmer.qr_code || '',
          milkHistory: [],
          paymentHistory: []
        };
      }
    } catch {}
  }

  if (!farmer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center max-w-sm w-full space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto font-black text-xl">
            !
          </div>
          <h1 className="text-xl font-black text-gray-900">Farmer Not Found</h1>
          <p className="text-xs text-gray-500">The farmer record with ID #{farmerId} could not be located in the 3T ledger.</p>
          <Link href="/farmer/login" className="inline-block px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs">
            Return to Farmer Login
          </Link>
        </div>
      </div>
    );
  }

  const collections = db.data.collections.filter(c => c.farmerId?.toUpperCase() === farmer.id.toUpperCase());
  const payments = db.data.payments.filter(p => p.farmerId?.toUpperCase() === farmer.id.toUpperCase());

  // These server-side values seed the AI Mitra component only.
  // Live totals are computed dynamically inside LivePassbookLedger.
  const totalEarnings = collections.reduce((sum, c) => sum + c.total, 0);
  const avgFat = collections.length > 0
    ? (collections.reduce((sum, c) => sum + c.fat, 0) / collections.length).toFixed(1)
    : "0.0";
  const avgSnf = collections.length > 0
    ? (collections.reduce((sum, c) => sum + c.snf, 0) / collections.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans p-4 sm:p-8 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Client Interactive Header Actions & Notifications */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PassbookHeaderActions farmerName={farmer.name} farmerId={farmer.id} />
          <NotificationPanel farmerId={farmer.id} />
        </div>

        {/* 1. Official Passbook Header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:border-black print:rounded-none print:shadow-none">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img src="/3t-logo.png" alt="3T Logo" className="h-9 sm:h-10 w-auto max-w-[120px] sm:max-w-[130px] object-contain drop-shadow-xs shrink-0" />
            <div>
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest block w-fit mb-1">
                Official Digital Farmer Passbook
              </span>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                Village Milk Co-Operative Ledger
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
                Central Collection Center B-01 · Instant UPI Settlement Network
              </p>
            </div>
          </div>

          {/* Logout button */}
          <div className="no-print self-end sm:self-auto">
            <FarmerLogoutButton />
          </div>
        </div>

        {/* 2. Farmer Account Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6 print:border-black print:rounded-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-4 gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600 text-white font-black text-base sm:text-lg flex items-center justify-center shrink-0 shadow-sm">
                {farmer.id}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">{farmer.name}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono">{farmer.phone}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{farmer.village}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                <span>Bank & UPI Verified</span>
              </span>
            </div>
          </div>

          {/* 3. & 4. Live Summary Cards + Ledger — polls cloud every 10s for real-time updates */}
          <LivePassbookLedger
            farmerId={farmer.id}
            initialCollections={collections}
            initialPayments={payments}
          />
        </div>


        {/* Footer info */}
        <div className="text-center text-xs text-gray-500 font-medium py-4 space-y-1 no-print">
          <p>© {new Date().getFullYear()} 3T Dairy Payment Network · Verified Digital Passbook System</p>
          <p className="text-[10px] text-gray-400">Powered by 3T Instant UPI Settlement Gateway</p>
        </div>

      </div>

      {/* AI Krishi Mitra — Floating Chat Assistant */}
      <AIMitra
        farmerId={farmer.id}
        farmerName={farmer.name}
        avgFat={avgFat}
        avgSnf={avgSnf}
        totalEarnings={totalEarnings}
        totalCollections={collections.length}
      />
    </div>
  );
}
