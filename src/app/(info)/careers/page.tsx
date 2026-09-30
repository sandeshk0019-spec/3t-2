import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers – 3T Dairy Payment Network",
  description: "Interested in working on rural fintech and dairy technology? Get in touch with the 3T team.",
};

export default function CareersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1A1A1A] py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-[#0F8A5F]/30 text-[#46B36A] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Careers
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            Help build technology<br />that helps farmers.
          </h1>
          <p className="text-lg text-white/70 font-medium max-w-xl mx-auto leading-relaxed">
            3T is an early-stage dairy payment platform. We are looking for people who care about
            building honest, reliable technology for rural India.
          </p>
        </div>
      </section>

      {/* What we are building */}
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-6">What We Are Building</h2>
        <div className="space-y-4 text-sm font-medium text-[#707070] leading-relaxed">
          <p>
            3T is a dairy payment network — a platform that connects milk quality measurements (FAT, SNF, weight)
            to farmer payment records. We build the farmer passbook app, the admin dashboard for dairy operators,
            the pricing engine, and AI-powered assistance for farmers.
          </p>
          <p>
            We are at an early stage and growing. If you are interested in contributing to this platform —
            whether in engineering, design, operations, or domain expertise in the dairy or agri sector —
            we'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Areas we need help */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-8 text-center">Areas We Are Looking For</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: "💻", title: "Software Development", desc: "Full-stack web development (Next.js, Node.js, TypeScript), mobile apps, and API integration with banking systems." },
              { icon: "🎨", title: "Product & Design", desc: "UI/UX design for low-literacy, mobile-first rural users. Experience with Marathi or Hindi language products is a plus." },
              { icon: "🐄", title: "Dairy / Agri Domain Expertise", desc: "If you have on-ground knowledge of dairy cooperatives, milk quality testing, or collection centre operations." },
              { icon: "🤝", title: "Operations & Partnerships", desc: "Helping connect 3T with dairy cooperatives, collection centres, and banking partners in Maharashtra and beyond." },
            ].map((area) => (
              <div key={area.title} className="flex gap-4 p-5 bg-white rounded-xl border border-[#EBEBEB]">
                <span className="text-2xl">{area.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">{area.title}</h3>
                  <p className="text-xs font-medium text-[#707070] mt-0.5 leading-relaxed">{area.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Interested?</h2>
        <p className="text-sm font-medium text-[#707070] mb-8 leading-relaxed">
          There are no formal job listings yet. Send us a message introducing yourself, what you do,
          and why you are interested in working on dairy farmer technology.
        </p>
        <a
          href="mailto:dairy3t@gmail.com"
          className="inline-block px-8 py-3.5 bg-[#0F8A5F] text-white font-bold rounded-xl hover:bg-[#0a7050] transition-colors text-sm"
        >
          Reach out at dairy3t@gmail.com
        </a>
      </section>
    </div>
  );
}
