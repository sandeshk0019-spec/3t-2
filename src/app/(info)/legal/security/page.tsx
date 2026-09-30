import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security – 3T Dairy Payment Network",
  description: "How 3T protects farmer and dairy data through technical security measures.",
};

export default function SecurityPage() {
  return (
    <div>
      <section className="bg-[#1A1A1A] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-[#0F8A5F]/30 text-[#46B36A] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Legal → Security
          </span>
          <h1 className="text-4xl font-black text-white leading-tight mb-4">Security</h1>
          <p className="text-base text-white/70 font-medium max-w-xl mx-auto leading-relaxed">
            Farmers trust 3T with their bank account details and payment records. Here is how we protect that data.
          </p>
        </div>
      </section>

      {/* Security measures */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-2 text-center">Security Measures</h2>
        <p className="text-sm text-[#707070] font-medium text-center mb-12">
          What we do to keep your data safe.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              icon: "🔐",
              title: "HTTPS Encryption",
              desc: "All data between your browser and 3T servers is encrypted using HTTPS. Unencrypted HTTP connections are not accepted.",
            },
            {
              icon: "🔑",
              title: "OTP-Only Farmer Login",
              desc: "Farmers do not have passwords. Login is by OTP to their registered mobile number only, reducing the risk of password theft.",
            },
            {
              icon: "🛡️",
              title: "Hashed Passwords",
              desc: "Admin and operator passwords are hashed using bcrypt before storage. Plain-text passwords are never stored in the database.",
            },
            {
              icon: "🔒",
              title: "Session Security",
              desc: "Login sessions use secure, HttpOnly cookies. Sessions expire after inactivity.",
            },
            {
              icon: "📋",
              title: "Audit Logging",
              desc: "Admin actions (adding farmers, recording collections, changing pricing) are logged with the operator's ID and timestamp.",
            },
            {
              icon: "🌏",
              title: "Data Location",
              desc: "3T application data is hosted on servers located in India. Data is not transferred outside India for storage.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-2xl border border-[#EBEBEB] p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{c.icon}</span>
                <h3 className="text-sm font-bold text-[#1A1A1A]">{c.title}</h3>
              </div>
              <p className="text-xs font-medium text-[#707070] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Reporting a Security Issue</h2>
          <p className="text-sm font-medium text-[#707070] leading-relaxed mb-6">
            If you find a security vulnerability in 3T, please report it responsibly. Do not exploit or publicly
            disclose it before giving us a chance to fix it.
          </p>
          <div className="space-y-4">
            {[
              { title: "What to report", desc: "Login bypasses, ability to view another farmer's records, data exposure, or any issue that could allow unauthorised access to payment or personal data." },
              { title: "How to report", desc: "Email dairy3t@gmail.com with a description of the issue. We will acknowledge your report and investigate." },
              { title: "Our commitment", desc: "We will not take action against security researchers who report issues in good faith and follow responsible disclosure practices." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-[#EBEBEB] p-5">
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">{item.title}</h3>
                <p className="text-xs font-medium text-[#707070] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="mailto:dairy3t@gmail.com"
              className="inline-block px-6 py-2.5 bg-[#1A1A1A] text-white font-bold rounded-xl text-sm hover:bg-[#333] transition-colors"
            >
              dairy3t@gmail.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
