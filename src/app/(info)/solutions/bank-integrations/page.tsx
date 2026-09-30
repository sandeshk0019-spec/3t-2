import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Integrations – 3T Dairy Payment Network",
  description: "How 3T processes and tracks farmer milk payments, and how bank integrations can be connected for direct settlement.",
};

export default function BankIntegrationsPage() {
  return (
    <div>
      <section className="bg-white border-b border-[#EBEBEB] py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-[#e7f6f0] text-[#0F8A5F] text-xs font-bold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Solutions → Bank Integrations
          </span>
          <h1 className="text-4xl font-black text-[#1A1A1A] leading-tight mb-4">
            Payment tracking built in.<br />Bank integration ready.
          </h1>
          <p className="text-base font-medium text-[#707070] max-w-xl mx-auto leading-relaxed">
            3T calculates the exact amount owed to each farmer for every milk delivery. This data can feed directly
            into bank settlement systems to process IMPS/NEFT credits without manual entry.
          </p>
        </div>
      </section>

      {/* Current state */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-xl font-black text-[#1A1A1A] mb-8">How Payment Works Today</h2>
        <div className="space-y-4">
          {[
            { step: "1", title: "Milk Collected", desc: "Operator records weight, FAT, and SNF for each farmer at the collection centre." },
            { step: "2", title: "Amount Calculated", desc: "3T's pricing engine applies the configured formula: Amount = Weight × Rate(FAT, SNF). Result is logged in the farmer's passbook." },
            { step: "3", title: "Payment Record Created", desc: "A payment entry is created in the system showing what is owed to each farmer for that collection or period." },
            { step: "4", title: "Bank Transfer", desc: "The dairy processes the transfer to each farmer's registered bank account. 3T provides the exact amounts and account details for each farmer." },
          ].map((s) => (
            <div key={s.step} className="flex gap-5 bg-white rounded-xl border border-[#EBEBEB] p-5">
              <div className="w-8 h-8 rounded-full bg-[#0F8A5F] flex items-center justify-center text-white text-xs font-black shrink-0">
                {s.step}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">{s.title}</h3>
                <p className="text-xs font-medium text-[#707070] mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What integrations are planned */}
      <section className="bg-[#f4faf7] border-y border-[#EBEBEB] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4">Bank API Integration (Planned)</h2>
          <p className="text-sm font-medium text-[#707070] leading-relaxed mb-8">
            3T is designed to connect directly with bank payment APIs so that farmer credits can be triggered
            automatically at the end of each shift — without the dairy having to manually initiate transfers.
            The following capabilities are planned:
          </p>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: "⚡", title: "IMPS / NEFT Bulk Trigger", desc: "Automatically initiate batch IMPS or NEFT transfers to all farmers at shift close, using verified bank account details." },
              { icon: "✅", title: "Credit Confirmation", desc: "Receive bank confirmation of each successful credit and update the farmer's passbook automatically." },
              { icon: "🔄", title: "Reconciliation", desc: "Daily reconciliation of all payment records — flagging any failed or pending transfers for follow-up." },
              { icon: "🔔", title: "Farmer Notification on Credit", desc: "Automatically notify farmers via SMS or in-app when their payment has been credited to their account." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-[#EBEBEB] p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">{f.title}</h3>
                <p className="text-xs font-medium text-[#707070] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-lg font-black text-[#1A1A1A] mb-4">Interested in Integrating Your Bank?</h2>
        <p className="text-sm font-medium text-[#707070] mb-6 leading-relaxed">
          If you represent a bank or cooperative financial institution interested in building a settlement
          integration with 3T, get in touch.
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
