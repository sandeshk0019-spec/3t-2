import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Farmers – 3T Dairy Payment Network",
  description: "How 3T helps dairy farmers track their milk deliveries, view FAT/SNF quality readings, and access their payment history.",
};

export default function ForFarmersPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#0F8A5F] to-[#1a9e6e] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Solutions → For Farmers
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            Your milk records.<br />Your payments. All in one place.
          </h1>
          <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed mb-8">
            3T gives every dairy farmer a digital passbook — showing exactly what milk was collected, what quality
            was recorded, what rate was applied, and what was paid.
          </p>
          <Link
            href="/farmer/login"
            className="inline-block px-8 py-3.5 bg-white text-[#0F8A5F] font-black rounded-xl hover:bg-[#f0faf5] transition-colors"
          >
            Open Your Passbook →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-b border-[#EBEBEB] py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-10 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Deliver Milk", desc: "Bring milk to the collection centre — morning or evening." },
              { num: "02", title: "Quality Is Measured", desc: "Weight, FAT %, and SNF % are recorded by the center operator." },
              { num: "03", title: "Rate Is Calculated", desc: "Your rate is computed based on the FAT/SNF formula set by the dairy." },
              { num: "04", title: "Record in Your Passbook", desc: "The full transaction appears in your digital passbook instantly." },
            ].map((s) => (
              <div key={s.num}>
                <div className="text-3xl font-black text-[#0F8A5F]/15 mb-3">{s.num}</div>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">{s.title}</h3>
                <p className="text-xs font-medium text-[#707070] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 text-center">What You Get</h2>
        <p className="text-sm text-[#707070] font-medium text-center mb-12">
          Available to any farmer registered at a 3T collection centre.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "📱",
              title: "OTP Login – No Password",
              desc: "Login with just your registered mobile number and an OTP. No username or password to remember.",
            },
            {
              icon: "📊",
              title: "Full Delivery History",
              desc: "Every milk delivery — date, time, weight, FAT, SNF, rate, and amount — is stored in your passbook.",
            },
            {
              icon: "🔍",
              title: "Transparent Pricing",
              desc: "See exactly how your rate was calculated. The formula is visible — no hidden deductions without explanation.",
            },
            {
              icon: "🔔",
              title: "Notifications",
              desc: "Receive alerts from your dairy about announcements, payment updates, and important messages.",
            },
            {
              icon: "🤖",
              title: "AI Krishi Mitra",
              desc: "Ask questions about milk quality, cattle care, or farming in Hindi, Marathi, or English.",
            },
            {
              icon: "📋",
              title: "Monthly Summary",
              desc: "View total milk delivered, total amount earned, and average rate for any period.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-[#EBEBEB] p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{f.title}</h3>
              <p className="text-xs font-medium text-[#707070] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f4faf7] border-t border-[#EBEBEB] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Do I need a smartphone?",
                a: "No. The passbook works on any mobile browser. You only need a phone that can receive an SMS OTP.",
              },
              {
                q: "Is there any charge for farmers?",
                a: "No. The farmer passbook is free to use.",
              },
              {
                q: "What if my mobile number changes?",
                a: "Contact your collection centre operator to update your registered mobile number.",
              },
              {
                q: "What if I think my FAT reading is wrong?",
                a: "Contact your collection centre operator directly. You can also view the reading in your passbook history.",
              },
            ].map((item) => (
              <div key={item.q} className="bg-white rounded-xl border border-[#EBEBEB] p-5">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{item.q}</h3>
                <p className="text-xs font-medium text-[#707070] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
