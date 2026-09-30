import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compliance – 3T Dairy Payment Network",
  description: "3T's approach to legal and data compliance for a dairy payment platform operating in India.",
};

export default function CompliancePage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-[#0a3d2b] to-[#0F8A5F] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Legal → Compliance
          </span>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">Compliance</h1>
          <p className="text-base text-white/80 font-medium max-w-xl mx-auto leading-relaxed">
            3T is designed to handle farmer and dairy data responsibly, in line with applicable Indian law.
          </p>
        </div>
      </section>

      {/* What we do */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-8">Our Compliance Approach</h2>
        <div className="space-y-5">
          {[
            {
              title: "Data Protection",
              desc: "We collect only the personal data needed to operate the platform — farmer name, mobile, and bank account for payment processing; milk records for the passbook. We do not sell or share data for advertising or unrelated purposes.",
            },
            {
              title: "Data Storage",
              desc: "Farmer and dairy data is stored on servers located in India. We do not transfer personal data outside India for storage.",
            },
            {
              title: "Password and Account Security",
              desc: "Admin passwords are hashed (bcrypt). Farmers use OTP-only login — no passwords to protect or lose. Sessions use secure, HttpOnly cookies.",
            },
            {
              title: "Third-Party Services",
              desc: "3T uses Google Gemini API for the AI Krishi Mitra feature. Questions sent to the assistant are processed by Google. Do not include sensitive data in chat messages. 3T also uses SMS for OTP delivery via a third-party SMS gateway.",
            },
            {
              title: "Payment Processing",
              desc: "3T is a data and calculation platform. It calculates payment amounts but does not directly hold or transfer funds unless a specific bank integration is configured. Actual bank transfers are carried out by the dairy.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-[#EBEBEB] p-6">
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
              <p className="text-xs font-medium text-[#707070] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is 3T a bank or payment company?",
                a: "No. 3T is a software platform that records milk quality data and calculates payment amounts. It is not a bank, NBFC, or licensed payment aggregator. Actual fund transfers are carried out by the dairy through their own bank.",
              },
              {
                q: "Where is farmer data stored?",
                a: "Farmer and dairy data is stored on servers in India.",
              },
              {
                q: "Does 3T share data with advertisers?",
                a: "No. We do not sell or share farmer or dairy data with any advertising platform or unrelated third party.",
              },
              {
                q: "How can I request my data or ask for it to be deleted?",
                a: "Email dairy3t@gmail.com with your request. We will respond and process it within 30 days.",
              },
              {
                q: "Who can I contact about a compliance concern?",
                a: "Email dairy3t@gmail.com for any compliance or legal questions.",
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

      {/* Contact */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-lg font-black text-[#1A1A1A] mb-4">Compliance Contact</h2>
        <p className="text-sm font-medium text-[#707070] mb-6">For legal, compliance, or regulatory questions:</p>
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
