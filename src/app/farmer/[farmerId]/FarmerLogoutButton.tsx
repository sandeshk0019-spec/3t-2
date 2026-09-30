"use client";

import React, { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function FarmerLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("3t_saved_farmer_id");
        localStorage.removeItem("3t_farmer_phone");
        sessionStorage.clear();
        document.cookie = "3t_farmer_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      }
      await fetch("/api/auth/farmer-otp/logout", { method: "POST" });
    } catch {}
    window.location.href = "/farmer/login";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center space-x-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-xl border border-gray-200 transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-95"
      title="Logout from Farmer Passbook"
    >
      {loggingOut ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      <span>Logout / बाहेर पडा</span>
    </button>
  );
}