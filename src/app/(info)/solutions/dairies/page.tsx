import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Dairies – 3T Dairy Payment Network",
  description: "How 3T helps dairy cooperatives and collection centres manage farmer registrations, milk records, pricing, and payments.",
};

export default function ForDairiesPage() {
  return (
    <div>
      <section className="bg-[#1A1A1A] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-[#0F8A5F]/30 text-[#46B36A] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Solutions → For Dairies
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            Manage your collection centres<br />digitally and transparently.
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl mx-auto leading-relaxed mb-8">
            Replace paper registers and manual payment processing with a digital system that gives you complete
            control over farmer records, pricing, and collections.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3.5 bg-[#0F8A5F] text-white font-black rounded-xl hover:bg-[#0a7050] transition-colors"
          >
            Admin Login →
          </Link>
        </div>
      </section>

      {/* What operators can do */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 text-center">What Dairy Operators Can Do</h2>
        <p className="text-sm text-[#707070] font-medium text-center mb-12">
          Full control from the admin dashboard.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "👨‍🌾",
              title: "Farmer Management",
              desc: "Register farmers with their name, mobile number, and bank account. Edit or deactivate farmers at any time.",
            },
            {
              icon: "🏭",
              title: "Collection Centres",
              desc: "Create and manage multiple collection branches. Assign farmers to their nearest centre.",
            },
            {
              icon: "⚙️",
              title: "Pricing Configuration",
              desc: "Set the FAT/SNF pricing formula for each branch. Update rates as needed — changes apply to new collections immediately.",
            },
            {
              icon: "📋",
              title: "Milk Collection Records",
              desc: "Record daily milk intake with weight, FAT, SNF, and shift. All records are stored permanently and visible to the farmer.",
            },
            {
              icon: "📊",
              title: "Analytics & Reports",
              desc: "View total collections by branch, by farmer, or by period. Export data for your own records.",
            },
            {
              icon: "📢",
              title: "Farmer Messaging",
              desc: "Send announcements, payment alerts, or seasonal notices directly to all farmers via the passbook notification system.",
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

      {/* Old vs 3T */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-10 text-center">Paper Registers vs 3T</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-red-100 p-6">
              <h3 className="text-sm font-bold text-red-600 mb-4">❌ Old System</h3>
              <ul className="space-y-2.5">
                {[
                  "Paper registers — easy to lose, damage, or alter",
                  "Manual payment calculation — errors are hard to spot",
                  "Farmers can't see their own records",
                  "No history after the book is full or lost",
                  "No way to message all farmers at once",
                ].map((item) => (
                  <li key={item} className="text-xs font-medium text-[#707070] flex gap-2">
                    <span className="text-red-400 shrink-0">✗</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-[#0F8A5F]/20 p-6">
              <h3 className="text-sm font-bold text-[#0F8A5F] mb-4">✓ With 3T</h3>
              <ul className="space-y-2.5">
                {[
                  "Digital records — permanent and searchable",
                  "Automatic calculation based on your formula",
                  "Farmer sees their records in their own passbook",
                  "Complete history always available",
                  "Broadcast messages to all farmers instantly",
                ].map((item) => (
                  <li key={item} className="text-xs font-medium text-[#707070] flex gap-2">
                    <span className="text-[#0F8A5F] font-black shrink-0">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-lg font-black text-[#1A1A1A] mb-4">Interested in Onboarding Your Dairy?</h2>
        <p className="text-sm font-medium text-[#707070] mb-6 leading-relaxed">
          Get in touch to discuss how 3T can be set up for your collection centre or cooperative.
        </p>
        <a
          href="mailto:dairy3t@gmail.com"
          className="inline-block px-6 py-2.5 bg-[#0F8A5F] text-white font-bold rounded-xl text-sm hover:bg-[#0a7050] transition-colors"
        >
          dairy3t@gmail.com
        </a>
      </section>
    </div>
  );
}
