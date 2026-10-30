"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronRight, ShieldAlert, Sparkles } from "lucide-react";
import { RaiseQueryModal } from "./RaiseQueryModal";
import { usePassbookLanguage } from "./PassbookLanguageContext";

interface Props {
  farmerId: string;
  farmerName: string;
  farmerPhone?: string;
}

export function FarmerQueryBanner({ farmerId, farmerName, farmerPhone }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = usePassbookLanguage();

  return (
    <>
      <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs no-print transition-all hover:shadow-xs hover:border-amber-300">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider">
                {t.supportTag}
              </span>
              <span className="text-[10px] font-bold text-gray-400">·</span>
              <span className="text-[10px] font-bold text-emerald-700">
                🌐 English / मराठी / हिंदी
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-amber-950 mt-0.5">
              {t.supportQueryTitle}
            </h3>
            <p className="text-[11px] sm:text-xs text-amber-800/90 font-medium">
              {t.supportQuerySubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 border border-amber-600 cursor-pointer shrink-0"
        >
          <span>💬 {t.raiseQueryBtn}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <RaiseQueryModal
        farmerId={farmerId}
        farmerName={farmerName}
        farmerPhone={farmerPhone}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
