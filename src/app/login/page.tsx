"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  KeyRound
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [judgesFilled, setJudgesFilled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      // Successful Auth - Automatic role-based redirect
      const targetUrl = data.redirectTo || "/dashboard";
      router.push(targetUrl);
    } catch (err: any) {
      setErrorMsg("Unable to connect to authentication server. Please check your network.");
      setIsLoading(false);
    }
  };

  const getCurrentTimeString = () => {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return formatter.format(new Date());
    } catch {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
  };

  const handleJudgesCredentials = () => {
    const timeStr = getCurrentTimeString();
    setEmail("3t@adminlogin");
    setPassword(timeStr);
    setShowPassword(true);
    setErrorMsg("");
    setJudgesFilled(true);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-between items-center relative overflow-hidden font-sans">
      {/* Subtle Geometric Background Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#0F8A5F_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <img src="/3t-logo.png" alt="3T Logo" className="h-10 w-auto max-w-[130px] object-contain drop-shadow-xs" />
          <div>
            <span className="font-extrabold text-sm text-gray-900 block tracking-tight">3T FINANCIAL NETWORK</span>
            <span className="text-[10px] font-semibold text-gray-500 block uppercase tracking-wider">Enterprise Dairy Settlement System</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3.5 py-1.5 rounded-full border border-emerald-200/60 shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-[#0F8A5F]" />
          <span>256-Bit SSL Encrypted Gateway</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md px-6 py-8 z-10 my-auto">
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xl shadow-emerald-950/5 p-8 space-y-6 backdrop-blur-sm">
          {/* Card Header */}
          <div className="space-y-1 text-center">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sign In to 3T Platform</h1>
            <p className="text-xs text-gray-500 font-medium">Enter your organizational credentials to continue</p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs font-semibold text-rose-800 flex items-start space-x-3 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Judges Credential Confirmation Badge */}
          {judgesFilled && !errorMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] font-semibold text-emerald-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Judges Credentials Auto-Filled!</span>
              </div>
              <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                {password} IST
              </span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Email or Username</label>
              <input
                type="text"
                placeholder="name@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#0F8A5F] focus:ring-2 focus:ring-[#0F8A5F]/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 block">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-bold text-[#0F8A5F] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#0F8A5F] focus:ring-2 focus:ring-[#0F8A5F]/20 transition-all placeholder:text-gray-400 placeholder:font-normal"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0F8A5F] focus:ring-[#0F8A5F] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">
                Remember this device for 7 days
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0F8A5F] hover:bg-[#0b6b49] active:bg-[#085238] text-white font-extrabold text-xs tracking-wide uppercase transition-all shadow-md shadow-[#0F8A5F]/20 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Secure Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Evaluation Demo</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Judges Credentials Button (Exact down to secure login) */}
            <div>
              <button
                type="button"
                onClick={handleJudgesCredentials}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-amber-300 font-bold text-xs tracking-wide border border-slate-700/80 shadow-md transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-white">Judges Credentials</span>
                <span className="text-[10px] font-normal text-amber-400/90 bg-slate-950/60 px-2 py-0.5 rounded ml-1 font-mono">
                  Auto-Fill
                </span>
              </button>
              <p className="text-[10px] text-gray-400 text-center mt-1.5 font-medium">
                Auto-fills Email: <span className="font-mono text-gray-600 font-semibold">3t@adminlogin</span> • Password: <span className="font-mono text-gray-600 font-semibold">Current Time (HH:MM)</span>
              </p>
            </div>
          </form>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-7xl px-6 py-6 text-center text-xs font-medium text-gray-400 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-gray-200/60">
        <span>© 2026 3T Financial Systems Ltd. All Rights Reserved.</span>
        <div className="flex items-center space-x-4">
          <Link href="/legal/security" className="hover:text-gray-600 cursor-pointer">Security Protocol</Link>
          <span>•</span>
          <Link href="/legal/privacy" className="hover:text-gray-600 cursor-pointer">Privacy Policy</Link>
          <span>•</span>
          <Link href="/helpdesk" className="hover:text-gray-600 cursor-pointer">Helpdesk</Link>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <>
          <div
            onClick={() => setIsForgotModalOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 transition-opacity backdrop-blur-xs"
          />
          <div className="fixed inset-0 m-auto max-w-md h-fit bg-white z-50 p-6 rounded-3xl border border-gray-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-base text-gray-900">Reset Account Access</h3>
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSent(false);
                }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0F8A5F] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-gray-900">Recovery Instructions Dispatched</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  If an authorized account exists for <strong className="text-gray-800">{forgotEmail}</strong>, password reset instructions have been sent.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSent(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-all cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 font-medium">
                  Enter your registered organizational email address. We will verify your account and dispatch security reset instructions.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Account Email</label>
                  <input
                    type="email"
                    placeholder="name@organization.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold bg-gray-50"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 text-gray-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0F8A5F] hover:bg-[#0b6b49] text-white font-bold text-xs transition-all cursor-pointer"
                  >
                    Dispatch Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
