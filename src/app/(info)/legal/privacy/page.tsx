import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – 3T Dairy Payment Network",
  description: "How 3T collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 2025";

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-[#0F8A5F] uppercase tracking-wide">Legal</span>
        <h1 className="text-3xl font-black text-[#1A1A1A] mt-2 mb-3">Privacy Policy</h1>
        <p className="text-sm font-medium text-[#707070]">Last updated: {lastUpdated}</p>
      </div>

      <div className="bg-[#e7f6f0] border border-[#0F8A5F]/20 rounded-xl p-5 mb-10 text-sm font-medium text-[#0a5c3f] leading-relaxed">
        <strong>Plain language summary:</strong> We collect only the information needed to record milk deliveries
        and process payments. We do not sell your data. You can request your data or ask us to delete it by contacting us.
      </div>

      <div className="space-y-8 text-sm font-medium text-[#707070]">
        {[
          {
            title: "1. Who We Are",
            content:
              "3T Dairy Payment Network is a platform that records milk collection data and farmer payment information for dairy cooperatives and collection centres. For privacy questions, contact us at: dairy3t@gmail.com",
          },
          {
            title: "2. What Data We Collect",
            content:
              "We collect the following information:\n\n• Farmer name and mobile number (required for OTP login)\n• Bank account number and IFSC code (required for payment processing)\n• Milk delivery records: date, time, weight, FAT %, SNF %, rate, and amount\n• Village and taluka (for record keeping)\n\nFor admin/operator accounts:\n• Name, email address, and login credentials (passwords are hashed and never stored in plain text)\n\nWe do not collect health data, social media profiles, or any information not needed for milk collection and payment processing.",
          },
          {
            title: "3. Why We Collect This Data",
            content:
              "We use your data only for:\n\n• Recording milk deliveries and calculating payment amounts\n• Giving farmers access to their passbook via OTP login\n• Processing payments to farmers via their registered bank account\n• Sending notifications relevant to your dairy account\n• AI Krishi Mitra chat responses (your chat history is used only to answer your question)",
          },
          {
            title: "4. Who We Share Data With",
            content:
              "We share data only where necessary:\n\n• The dairy or cooperative you deliver milk to — they see your collection records\n• Your bank — your account number, IFSC, name, and payment amount are shared when processing your payment\n\nWe do not sell, rent, or share your data with any advertising platform, analytics service, or unrelated third party.",
          },
          {
            title: "5. How Long We Keep Your Data",
            content:
              "• Milk collection and payment records: kept as long as your account is active and for a reasonable period after\n• Login/OTP logs: 90 days\n• AI chat history: 30 days\n• If you request deletion, your personal data will be removed within 30 days (some records may be retained if legally required)",
          },
          {
            title: "6. Your Rights",
            content:
              "You have the right to:\n\n• See what data we hold about you\n• Ask us to correct inaccurate data\n• Ask us to delete your data\n• Raise a complaint about how your data is handled\n\nTo exercise any of these, contact: dairy3t@gmail.com",
          },
          {
            title: "7. Data Security",
            content:
              "We take reasonable steps to protect your data:\n\n• All data in transit is encrypted using HTTPS/TLS\n• Passwords are hashed and never stored in plain text\n• Admin access requires authentication\n\nNo system is 100% secure. If you believe your data has been compromised, contact us immediately at dairy3t@gmail.com.",
          },
          {
            title: "8. AI Krishi Mitra",
            content:
              "AI Krishi Mitra uses Google's Gemini API to generate responses. Your question is sent to Google's API to produce a reply. Do not enter sensitive information (bank account numbers, OTPs, passwords) in the chat. Chat history is stored for 30 days.",
          },
          {
            title: "9. Changes to This Policy",
            content:
              "If we make significant changes to this policy, we will notify users through the app or by other means before the changes take effect.",
          },
          {
            title: "10. Contact",
            content:
              "For privacy-related questions or requests:\n\nEmail: dairy3t@gmail.com",
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
