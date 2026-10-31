"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { usePassbookLanguage, LanguageSelector } from "./PassbookLanguageContext";
import { FarmerLogoutButton } from "./FarmerLogoutButton";
import { NotificationPanel } from "./NotificationPanel";

interface PassbookHeaderProps {
  farmerId?: string;
}

export function PassbookHeader({ farmerId }: PassbookHeaderProps) {
  const { t } = usePassbookLanguage();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:border-black print:rounded-none print:shadow-none">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <img
          src="/3t-logo.png"
          alt="3T Logo"
          className="h-9 sm:h-10 w-auto max-w-[120px] sm:max-w-[130px] object-contain drop-shadow-xs shrink-0"
        />
        <div>
          <span className="text-[9px] sm:text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-widest block w-fit mb-1">
            {t.officialPassbook}
          </span>
          <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            {t.ledgerTitle}
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5">
            {t.ledgerSubtitle}
          </p>
        </div>
      </div>

      {/* Language Selector + Notification Bell + Logout Button */}
      <div className="no-print flex flex-wrap items-center gap-2 sm:gap-2.5 self-end md:self-auto">
        {farmerId && <NotificationPanel farmerId={farmerId} />}
        <LanguageSelector />
        <FarmerLogoutButton />
      </div>
    </div>
  );
}

export function FarmerVerificationBadge() {
  const { t } = usePassbookLanguage();
  return (
    <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl">
      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
      <span>{t.bankVerified}</span>
    </span>
  );
}

export function PassbookFooter() {
  const { t } = usePassbookLanguage();
  return (
    <div className="text-center text-xs text-gray-500 font-medium py-4 space-y-1 no-print">
      <p>© {new Date().getFullYear()} {t.footerCopyright}</p>
      <p className="text-[10px] text-gray-400">{t.footerPowered}</p>
    </div>
  );
}
