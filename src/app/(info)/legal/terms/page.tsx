import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – 3T Dairy Payment Network",
  description: "Terms and conditions for using the 3T Dairy Payment Network farmer passbook and admin dashboard.",
};

export default function TermsPage() {
  const lastUpdated = "August 2025";

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-[#0F8A5F] uppercase tracking-wide">Legal</span>
        <h1 className="text-3xl font-black text-[#1A1A1A] mt-2 mb-3">Terms of Service</h1>
        <p className="text-sm font-medium text-[#707070]">Last updated: {lastUpdated}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-10 text-sm font-medium text-amber-800 leading-relaxed">
        By using the 3T farmer passbook, admin dashboard, or any part of this platform, you agree to these terms.
        If you do not agree, please do not use the platform.
      </div>

      <div className="space-y-8 text-sm font-medium text-[#707070]">
        {[
          {
            title: "1. What 3T Is",
            content:
              "3T Dairy Payment Network is a software platform for dairy collection centres. It records milk delivery data (weight, FAT, SNF), calculates payment amounts, and provides farmers with a digital passbook to view their records. 3T is a software tool — it does not directly process bank payments unless a specific bank integration is configured.",
          },
          {
            title: "2. Farmer Accounts",
            content:
              "• Farmer accounts are created by dairy operators. Farmers log in using OTP only.\n• Your account is linked to your registered mobile number. Keep it updated with your collection centre.\n• Do not share your OTP with anyone. 3T will never call you to ask for your OTP.\n• If you believe your account has been misused, contact your dairy operator or email dairy3t@gmail.com.",
          },
          {
            title: "3. Accuracy of Records",
            content:
              "• Milk collection records are entered by collection centre operators. 3T stores and displays what is entered.\n• If you believe a collection record is incorrect (wrong weight, wrong FAT/SNF reading), raise this with your dairy operator directly.\n• 3T cannot verify the accuracy of readings entered at the collection centre — that responsibility lies with the dairy operator.",
          },
          {
            title: "4. Payments",
            content:
              "• 3T calculates the amount owed based on the formula configured by the dairy. This amount is shown in your passbook.\n• The actual bank transfer is carried out by the dairy, not by 3T (unless a specific bank integration is set up).\n• If payment has not been received, contact your dairy or collection centre directly.",
          },
          {
            title: "5. Admin / Operator Accounts",
            content:
              "• Admin accounts are for authorised dairy staff only. Do not share your login credentials.\n• Operators are responsible for the accuracy of all data they enter into the system.\n• Operators must not register farmers with incorrect or someone else's bank details.\n• 3T may suspend accounts involved in misuse of the platform.",
          },
          {
            title: "6. AI Krishi Mitra",
            content:
              "• AI Krishi Mitra is an informational assistant. Its responses are not veterinary, legal, or financial advice.\n• Always verify important information with a qualified expert or official government source.\n• Do not enter sensitive personal information (bank passwords, OTPs) in the chat.",
          },
          {
            title: "7. What We Are Not Responsible For",
            content:
              "• Incorrect data entered by dairy operators\n• Bank transfer delays caused by the bank or payment system\n• Loss of access due to change in mobile number not updated with the collection centre\n• Decisions made based on AI Krishi Mitra responses",
          },
          {
            title: "8. Changes to the Platform",
            content:
              "3T may update or change features of the platform at any time. We will try to notify users of significant changes in advance.",
          },
          {
            title: "9. Governing Law",
            content:
              "These terms are governed by the laws of India. Disputes will be subject to the jurisdiction of courts in Maharashtra, India.",
          },
          {
            title: "10. Contact",
            content:
              "For questions about these terms:\n\nEmail: dairy3t@gmail.com",
          },
        ].map((section) => (
          <div key={section.title} className="border-t border-[#EBEBEB] pt-8">
            <h2 className="text-base font-black text-[#1A1A1A] mb-3">{section.title}</h2>
            <div className="leading-relaxed whitespace-pre-line">{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
