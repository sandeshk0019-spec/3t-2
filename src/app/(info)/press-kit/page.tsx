import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press Kit – 3T Dairy Payment Network",
  description: "Brand assets, colours, and contact information for media covering 3T Dairy Payment Network.",
};

export default function PressKitPage() {
  const brand = [
    { label: "Primary Green", hex: "#0F8A5F" },
    { label: "Secondary Green", hex: "#46B36A" },
    { label: "Accent Amber", hex: "#F6B73C" },
    { label: "Text Dark", hex: "#1A1A1A" },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-[#EBEBEB] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <span className="inline-block bg-[#e7f6f0] text-[#0F8A5F] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Media & Press
          </span>
          <h1 className="text-4xl font-black text-[#1A1A1A] mb-4">Press Kit</h1>
          <p className="text-base font-medium text-[#707070] max-w-xl leading-relaxed mb-8">
            Brand assets and contact information for media writing about 3T Dairy Payment Network.
          </p>
          <a
            href="mailto:dairy3t@gmail.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F8A5F] text-white font-bold rounded-xl hover:bg-[#0a7050] transition-colors text-sm"
          >
            Contact: dairy3t@gmail.com
          </a>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* What is 3T */}
        <section>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4">About 3T</h2>
          <div className="bg-white border border-[#EBEBEB] rounded-2xl p-6 text-sm font-medium text-[#707070] leading-relaxed space-y-3">
            <p>
              <strong className="text-[#1A1A1A]">3T (Time To Time) Dairy Payment Network</strong> is a digital platform
              for dairy collection centres and cooperatives. It records milk deliveries with FAT and SNF quality readings,
              calculates farmer payments using a transparent formula, and gives each farmer a digital passbook to view
              their complete history.
            </p>
            <p>
              The platform includes a farmer-facing passbook (OTP login, no password required), an admin dashboard for
              dairy operators, an AI farming assistant (AI Krishi Mitra) in Hindi, Marathi, and English, and a farmer
              notification system.
            </p>
            <p>
              3T is an early-stage product built in Maharashtra, India.
            </p>
          </div>
        </section>

        {/* Brand colours */}
        <section>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-6">Brand Colours</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {brand.map((b) => (
              <div key={b.hex} className="rounded-xl border border-[#EBEBEB] overflow-hidden">
                <div className="h-20 rounded-t-xl" style={{ backgroundColor: b.hex }} />
                <div className="p-3 bg-white">
                  <div className="text-xs font-bold text-[#1A1A1A]">{b.label}</div>
                  <div className="text-xs font-mono text-[#707070]">{b.hex}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-[#707070] mt-4">
            <strong>Typography:</strong> Inter (Google Fonts). Do not place the 3T logo on backgrounds other than white or Primary Green.
          </p>
        </section>

        {/* Product name usage */}
        <section>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Name Usage</h2>
          <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden divide-y divide-[#EBEBEB] text-sm">
            {[
              ["Full product name", "3T Dairy Payment Network"],
              ["Short name", "3T"],
              ["Founder, 3T", "Sandesh Kadam"],
              ["What '3T' stands for", "Time To Time"],
              ["Category", "Dairy fintech / farmer payment platform"],
              ["Geography", "Maharashtra, India"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex px-6 py-3.5 gap-8">
                <span className="w-44 shrink-0 font-bold text-[#1A1A1A]">{label}</span>
                <span className="text-[#707070] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section className="bg-[#f4faf7] rounded-2xl border border-[#0F8A5F]/15 p-8">
          <h2 className="text-lg font-black text-[#1A1A1A] mb-4">Press Contact</h2>
          <p className="text-sm font-medium text-[#707070] mb-2">
            For media enquiries, interview requests, or product demonstrations:
          </p>
          <a href="mailto:dairy3t@gmail.com" className="text-[#0F8A5F] font-bold text-sm">dairy3t@gmail.com</a>
        </section>

      </div>
    </div>
  );
}
