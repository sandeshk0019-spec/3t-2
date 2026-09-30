import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Weighing – 3T Dairy Payment Network",
  description: "How 3T records milk quality data (weight, FAT, SNF) at collection centres and uses it for transparent payment calculation.",
};

export default function DigitalWeighingPage() {
  return (
    <div>
      <section className="bg-[#0F8A5F] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Solutions → Digital Weighing
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            Quality recorded. Formula applied.<br />Payment calculated.
          </h1>
          <p className="text-lg text-white/80 font-medium max-w-xl mx-auto leading-relaxed">
            3T builds the software layer that captures FAT, SNF, and weight at the collection centre —
            and turns those numbers into a transparent payment record that both the dairy and farmer can see.
          </p>
        </div>
      </section>

      {/* What data is collected */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-8">What Is Recorded for Every Collection</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { icon: "⚖️", title: "Weight (kg)", desc: "The total weight of milk delivered, measured in kilograms at the collection point." },
            { icon: "🥛", title: "FAT %", desc: "The fat content of the milk, measured as a percentage. A key factor in determining the price per litre." },
            { icon: "🔬", title: "SNF %", desc: "Solid-Not-Fat content percentage. Also factors into the pricing formula alongside FAT." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-[#EBEBEB] p-6 text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{f.title}</h3>
              <p className="text-xs font-medium text-[#707070] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How pricing works */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-6 text-center">How the Pricing Formula Works</h2>
          <div className="bg-white rounded-2xl border border-[#EBEBEB] p-8 space-y-5 text-sm font-medium text-[#707070] leading-relaxed">
            <p>
              Each dairy or collection centre configures its own pricing formula in the 3T admin dashboard.
              The formula defines how much to pay per unit of FAT and per unit of SNF.
            </p>
            <p>
              When a collection is recorded, 3T automatically applies the formula:
            </p>
            <div className="bg-[#f4faf7] rounded-xl p-5 font-mono text-xs text-[#1A1A1A] space-y-1">
              <p>Rate = (FAT × FAT_rate) + (SNF × SNF_rate) + base_rate</p>
              <p>Amount = Weight × Rate</p>
            </div>
            <p>
              The result — weight, FAT, SNF, rate, and final amount — is shown to the farmer in their
              digital passbook. Nothing is hidden or estimated.
            </p>
            <p>
              Dairy operators can update the formula at any time from the admin dashboard.
              Changes apply to new collections from that point forward.
            </p>
          </div>
        </div>
      </section>

      {/* Before vs after */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-10 text-center">Paper vs Digital</h2>
        <div className="rounded-2xl border border-[#EBEBEB] overflow-hidden">
          <div className="grid grid-cols-2 bg-[#FAFAFA] border-b border-[#EBEBEB]">
            <div className="p-4 text-xs font-bold text-red-600 uppercase tracking-wide text-center">Paper Register</div>
            <div className="p-4 text-xs font-bold text-[#0F8A5F] uppercase tracking-wide text-center border-l border-[#EBEBEB]">3T Digital Record</div>
          </div>
          {[
            ["Reading written by hand — can be altered", "Reading entered and stored digitally — permanent record"],
            ["Farmer cannot see the register", "Farmer views their records in their own passbook"],
            ["Payment calculated manually — room for error", "Payment calculated automatically by the system formula"],
            ["No history after register is lost or full", "Complete collection history always available"],
            ["No way to verify rate applied", "Rate formula and calculation shown with every entry"],
          ].map((row, i) => (
            <div key={i} className={`grid grid-cols-2 ${i < 4 ? "border-b border-[#EBEBEB]" : ""}`}>
              <div className="p-4 text-xs font-medium text-[#707070] leading-relaxed bg-red-50/40">{row[0]}</div>
              <div className="p-4 text-xs font-medium text-[#1A1A1A] leading-relaxed border-l border-[#EBEBEB] bg-[#f4faf7]">{row[1]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f4faf7] border-t border-[#EBEBEB] py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h3 className="text-base font-bold text-[#1A1A1A] mb-2">Want to set up 3T at your collection centre?</h3>
          <p className="text-sm text-[#707070] font-medium mb-5">Get in touch to discuss setup and how 3T fits your existing equipment.</p>
          <a
            href="mailto:dairy3t@gmail.com"
            className="inline-block px-6 py-2.5 bg-[#0F8A5F] text-white font-bold rounded-xl text-sm hover:bg-[#0a7050] transition-colors"
          >
            dairy3t@gmail.com
          </a>
        </div>
      </section>
    </div>
  );
}
