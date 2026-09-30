"use client";

import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Smartphone, Monitor, CheckCircle2 } from "lucide-react";

interface HeaderActionsProps {
  farmerName?: string;
  farmerId?: string;
}

export function PassbookHeaderActions({ farmerName, farmerId }: HeaderActionsProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));

      if (farmerId) {
        try {
          localStorage.setItem("3t_saved_farmer_id", farmerId);
        } catch {}
      }
    }

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 6000);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === "accepted") {
          setInstalledSuccess(true);
          setTimeout(() => setInstalledSuccess(false), 6000);
        }
        setDeferredPrompt(null);
      } catch {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const displayName = farmerName ? farmerName : "Farmer";

  return (
    <div className="flex items-center justify-end space-x-3 no-print">
      {installedSuccess && (
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Added to {isMobile ? "Phone" : "Desktop"}!</span>
        </div>
      )}

      {!isInstalled ? (
        <button
          onClick={handleInstallClick}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-2 border border-emerald-600 cursor-pointer"
          title="Add to Desktop or Phone Home Screen"
        >
          {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span>📲 Add to {isMobile ? "Phone" : "Desktop"}</span>
        </button>
      ) : (
        <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Passbook App Installed</span>
        </div>
      )}

      <button
        onClick={() => window.print()}
        className="px-4 py-2.5 bg-slate-900 hover:bg-black active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
        title="Print Passbook Statement"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span>🖨️ Print Passbook</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-xs">
                  {isMobile ? "📱" : "💻"}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Add {displayName}'s Passbook to {isMobile ? "Phone" : "Desktop"}
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-bold">1-Tap Direct Access App</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 font-medium">
              {!isMobile ? (
                <>
                  <p className="font-bold text-gray-900 text-xs">
                    Quick Steps for Desktop / Laptop (Chrome, Edge, Brave):
                  </p>
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 text-emerald-950">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Look at your browser's top address bar (near the ⭐️ bookmark star).
                      </span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Click the <strong>Install icon (⊕ or 💻)</strong> or click browser menu <strong>⋮ (three dots)</strong> ➔ <strong>"Install 3T Passbook"</strong> (or <em>"Save and Share" ➔ "Install page as app"</em>).
                      </span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Click <strong>Install</strong> — a dedicated <strong>3T Passbook</strong> icon will appear on your Desktop & Taskbar!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-900 text-xs">
                    Quick Steps for Smartphone (Android / iPhone):
                  </p>
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 text-emerald-950">
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap your browser menu (<strong>⋮ 3 dots</strong> on Android Chrome, or the <strong>Share ⎘ icon</strong> at the bottom of iPhone Safari).
                      </span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Tap <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.
                      </span>
                    </div>
                    <div className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        The 3T Passbook icon will be pinned to your phone app screen for instant 1-tap ledger access anytime!
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pt-1">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
