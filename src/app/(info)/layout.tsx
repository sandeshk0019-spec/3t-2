"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Film, Sparkles } from "lucide-react";
import ProcessVideoPlayer from "@/app/components/ProcessVideoPlayer";

export default function InfoLayout({ children }: { children: React.ReactNode }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-[#111827]">
      {/* Interactive Process Video Modal */}
      <ProcessVideoPlayer isOpen={showVideo} onClose={() => setShowVideo(false)} />

      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="flex items-center gap-1.5 text-[#6B7280] text-xs font-semibold group-hover:text-[#0F8A5F] transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </span>
          </Link>
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/3t-logo.png" alt="3T Logo" className="h-7 w-auto max-w-[110px] object-contain drop-shadow-xs" />
            <span className="font-bold text-sm text-[#111827] tracking-tight">3T Dairy Payment Network</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVideo(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0F8A5F] bg-[#e7f6f0] hover:bg-[#d8f2e7] rounded-lg transition-colors border border-[#0F8A5F]/20 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Watch Process Video</span>
            </button>
            <Link href="/farmer/login" className="px-3.5 py-1.5 text-xs font-semibold text-[#0F8A5F] hover:bg-[#e7f6f0] rounded-lg transition-colors">
              Farmer Login
            </Link>
            <Link href="/login" className="px-3.5 py-1.5 text-xs font-semibold bg-[#0F8A5F] hover:bg-[#0d7450] text-white rounded-lg transition-colors shadow-xs">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#F9FAFB] border-t border-[#E5E7EB] py-14 mt-24 text-[#111827]">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          {/* Watch Process Video Interactive Footer Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#e7f6f0] via-[#F3F4F6] to-[#fef2f2] border border-[#0F8A5F]/20 flex flex-wrap items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0F8A5F] flex items-center justify-center text-white shrink-0 shadow-md">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <span>How 3T Works: Cow Milking to Bank Payment</span>
                  <span className="text-[10px] uppercase font-extrabold bg-[#0F8A5F] text-white px-2 py-0.5 rounded-full">
                    Video Demo
                  </span>
                </h4>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  See the complete step-by-step interactive workflow of how 3T settles milk payments in real-time.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F8A5F] hover:bg-[#0d7450] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-[#0F8A5F]/20 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Process Video</span>
            </button>
          </div>

          {/* Standard Footer Columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 flex flex-col space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/3t-logo.png" alt="3T Logo" className="h-8 w-auto max-w-[120px] object-contain drop-shadow-xs" />
              <span className="font-bold text-base text-[#111827]">3T (Time To Time)</span>
            </div>
            <p className="text-xs text-[#6B7280] max-w-sm leading-relaxed">
              India's transparent farmer payment network, connecting milk quality data straight to instant digital settlements.
            </p>
            <span className="text-xs text-[#9CA3AF] pt-2 block">
              © {new Date().getFullYear()} 3T Fintech Ltd. All rights reserved.
            </span>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Company</h5>
            <ul className="space-y-2 text-xs font-medium text-[#6B7280]">
              <li><Link href="/about" className="hover:text-[#0F8A5F] transition-colors">About Us</Link></li>
              <li><Link href="/mission" className="hover:text-[#0F8A5F] transition-colors">Our Mission</Link></li>
              <li><Link href="/helpdesk" className="hover:text-[#0F8A5F] transition-colors font-semibold text-emerald-700">Helpdesk & Support</Link></li>
              <li><Link href="/careers" className="hover:text-[#0F8A5F] transition-colors">Careers</Link></li>
              <li><Link href="/press-kit" className="hover:text-[#0F8A5F] transition-colors">Press Kit</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Solutions</h5>
            <ul className="space-y-2 text-xs font-medium text-[#6B7280]">
              <li><Link href="/solutions/farmers" className="hover:text-[#0F8A5F] transition-colors">For Farmers</Link></li>
              <li><Link href="/solutions/dairies" className="hover:text-[#0F8A5F] transition-colors">For Dairies</Link></li>
              <li><Link href="/solutions/bank-integrations" className="hover:text-[#0F8A5F] transition-colors">Bank Integrations</Link></li>
              <li><Link href="/solutions/digital-weighing" className="hover:text-[#0F8A5F] transition-colors">Digital Weighing</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-3">Legal</h5>
            <ul className="space-y-2 text-xs font-medium text-[#6B7280]">
              <li><Link href="/legal/privacy" className="hover:text-[#0F8A5F] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="hover:text-[#0F8A5F] transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/security" className="hover:text-[#0F8A5F] transition-colors">Security Standards</Link></li>
              <li><Link href="/legal/compliance" className="hover:text-[#0F8A5F] transition-colors">Compliance</Link></li>
            </ul>
          </div>
        </div>
        </div>
      </footer>
    </div>
  );
}
