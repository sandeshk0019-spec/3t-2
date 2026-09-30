import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Mission – 3T Dairy Payment Network",
  description: "3T's mission: every dairy farmer who delivers milk today receives their payment quickly, with full transparency on quality and pricing.",
};

export default function MissionPage() {
  const values = [
    {
      icon: "⚡",
      title: "Speed",
      desc: "Milk payments should be processed quickly. Farmers should not wait many days for money they have already earned.",
    },
    {
      icon: "🔍",
      title: "Transparency",
      desc: "Every FAT reading, every SNF value, and every payment calculation is visible to the farmer in their passbook. Nothing is hidden.",
    },
    {
      icon: "🌾",
      title: "Simplicity",
      desc: "The farmer experience is designed for any mobile phone. OTP login, simple screens, local language support — no technical knowledge needed.",
    },
    {
      icon: "🤝",
      title: "Trust",
      desc: "Farmers should be able to verify their own milk quality data at any time. Our digital records cannot be altered after they are created.",
    },
    {
      icon: "🔒",
      title: "Privacy",
      desc: "A farmer's data belongs to them. We only collect what is needed to process milk collections and payments.",
    },
    {
      icon: "📈",
      title: "Access",
      desc: "By making payment information digital and instant, farmers gain better visibility into their income and can plan more confidently.",
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0a5c3f] to-[#0F8A5F] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Mission
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            Fast, transparent dairy payments<br />for every farmer.
          </h1>
          <p className="text-lg text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
            3T exists to make milk payments fast, honest, and accessible — using technology to give every dairy farmer
            a clear record of what they delivered and exactly what they were paid for it.
          </p>
        </div>
      </section>

      {/* Mission statement */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <blockquote className="text-2xl md:text-3xl font-black text-[#1A1A1A] leading-snug">
          "A farmer who delivers milk should know exactly what quality was recorded, what rate was applied,
          and when the payment was made — not have to guess."
        </blockquote>
      </section>

      {/* Values */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 text-center">What We Stand For</h2>
          <p className="text-sm text-[#707070] font-medium text-center mb-12">
            Every feature in 3T is guided by these principles.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v) => (
              <div key={v.title} className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{v.title}</h3>
                <p className="text-xs font-medium text-[#707070] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The real problem */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-10 text-center">Why This Matters</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl bg-[#1A1A1A] p-8">
            <div className="text-2xl font-black text-red-400 mb-2">The Old Way</div>
            <ul className="space-y-3 mt-4">
              {[
                "Payments delayed by several days",
                "Paper registers — easy to lose or alter",
                "Farmers can't see the FAT/SNF reading",
                "No record of what rate was applied",
                "Must visit the dairy office to check anything",
              ].map((item) => (
                <li key={item} className="text-sm font-medium text-white/70 flex gap-2">
                  <span className="text-red-400">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#0F8A5F] p-8">
            <div className="text-2xl font-black text-white mb-2">With 3T</div>
            <ul className="space-y-3 mt-4">
              {[
                "Payment processed quickly and tracked digitally",
                "All records stored digitally and tamper-evident",
                "Farmer sees FAT, SNF, weight in their passbook",
                "Rate formula is visible and consistent",
                "Full history accessible from any phone, anytime",
              ].map((item) => (
                <li key={item} className="text-sm font-medium text-white/90 flex gap-2">
                  <span className="text-white font-black">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
