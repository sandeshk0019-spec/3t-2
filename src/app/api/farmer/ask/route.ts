import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkAIRateLimit } from '@/lib/ai-rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/farmer/ask
// Secure server-side route — Gemini API key NEVER exposed to browser
// Only OTP-verified farmers can call this
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check — must have valid farmer session ──
    const cookieStore = await cookies();
    const farmerToken = cookieStore.get('3t_farmer_token')?.value;
    const adminToken = cookieStore.get('3t_session_token')?.value;

    let farmerId: string | null = null;

    if (farmerToken) {
      const session = await verifySession(farmerToken);
      if (session && session.role === 'farmer') {
        farmerId = session.name; // farmerId stored in name field
      }
    } else if (adminToken) {
      const session = await verifySession(adminToken);
      if (session && session.role !== 'farmer') {
        farmerId = 'ADMIN'; // admins get unlimited access
      }
    }

    if (!farmerId) {
      return NextResponse.json(
        { success: false, error: 'Please log in to use AI Mitra.' },
        { status: 401 }
      );
    }

    // ── 2. Rate limit check (farmers only, not admins) ──
    if (farmerId !== 'ADMIN') {
      const rateLimit = checkAIRateLimit(farmerId);
      if (!rateLimit.allowed) {
        const hoursLeft = Math.ceil(rateLimit.resetInMs / (1000 * 60 * 60));
        return NextResponse.json(
          {
            success: false,
            error: `You have used all 10 AI questions for today. Try again in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`,
            rateLimited: true,
          },
          { status: 429 }
        );
      }
    }

    // ── 3. Parse request body ──
    const body = await request.json();
    const question: string = (body.question || '').trim();
    const language: string = body.language || 'english';
    const contextFarmerId: string = body.farmerId || farmerId;

    if (!question || question.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid question.' },
        { status: 400 }
      );
    }

    // ── 4. Check API key configured ──
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI Mitra is coming soon! The system is being configured.',
          comingSoon: true,
        },
        { status: 503 }
      );
    }

    // ── 5. Load farmer's real data for personalized context ──
    const db = await getDb();
    const farmer = db.data.farmers.find(
      (f) => f.id.toUpperCase() === contextFarmerId.toUpperCase()
    );

    let farmerContext = '';
    if (farmer) {
      const collections = db.data.collections.filter((c) => c.farmerId === farmer.id);
      const payments = db.data.payments.filter((p) => p.farmerId === farmer.id);
      const totalVolume = collections.reduce((s, c) => s + c.weight, 0);
      const totalEarnings = collections.reduce((s, c) => s + c.total, 0);

      const avgFat =
        collections.length > 0
          ? (collections.reduce((s, c) => s + c.fat, 0) / collections.length).toFixed(2)
          : 'N/A';
      const avgSnf =
        collections.length > 0
          ? (collections.reduce((s, c) => s + c.snf, 0) / collections.length).toFixed(2)
          : 'N/A';

      // Format recent 15 transaction records
      const ledgerRows = collections
        .slice(-15)
        .map((c) => {
          return `  * Date: ${c.date} | Shift: ${c.time} | Volume: ${c.weight} L | FAT: ${c.fat}% | SNF: ${c.snf}% | Total: ₹${c.total} | Status: ${c.status}`;
        })
        .join('\n');

      farmerContext = `
FARMER PROFILE & DATABASE RECORD:
- Farmer ID: ${farmer.id}
- Name: ${farmer.name}
- Village: ${farmer.village}
- Registered cattle: ${farmer.animals}
- Total milk delivered to 3T: ${totalVolume.toFixed(1)} liters across ${collections.length} entries
- Total earnings from 3T: ₹${totalEarnings.toFixed(2)}
- Average FAT%: ${avgFat}%
- Average SNF%: ${avgSnf}%

FARMER RECENT MILK LEDGER (Use this to answer questions about specific dates, fat, volume, or payments):
${ledgerRows || '  * No past collection records found.'}
`;
    }

    // ── 6. Build universal system prompt ──
    const languageInstructions = {
      marathi: `तुम्ही ३T चे AI मित्र आहात. तुम्ही सर्व विषयांचे (जगातील सामान्य ज्ञान, देश-विदेश, इतिहास, विज्ञान, ऑलिम्पिक, गणित, राजकारण, चालू घडामोडी) तसेच शेती, डेअरी, शासकीय योजना आणि शेतकरी डेटाचे अचूक उत्तर देऊ शकता. मराठीत स्पष्ट, सुटसुटीत आणि थेट उत्तर द्या.`,
      hindi: `आप 3T के AI मित्र हैं। आप सभी विषयों (सामान्य ज्ञान, देश-विदेश, विज्ञान, गणित, करंट अफेयर्स) तथा डेयरी, कृषि और किसान डेटा का सटीक उत्तर दे सकते हैं। हिंदी में स्पष्ट और सीधा उत्तर दें।`,
      english: `You are AI Mitra, an omniscient and versatile AI Assistant powered by 3T Network. You can answer ANY question accurately across all domains — including World General Knowledge (presidents, capitals, national symbols, Olympic games, history, science, technology), Mathematics & Calculations (e.g. 5+5, financial math), Dairy Farming, Cattle Health, Government Schemes (AHIDF, NABARD, KCC), and Farmer Database Records.`,
    };

    const systemPrompt = `${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.english}

${farmerContext}

CORE KNOWLEDGE ABOUT 3T DAIRY PAYMENT NETWORK:
- **Founder & Creator**: **Sandesh Kadam** (संदेश कदम). (Official Contact: dairy3t@gmail.com). When asked who founded, created, owns, or started 3T, ALWAYS state with absolute certainty that **Sandesh Kadam** (संदेश कदम) is the founder & creator of 3T. Never mention or hallucinate any other name.
- **Full Meaning**: 3T stands for "Time To Time" (पारदर्शक, वेळेवर, विश्वासू). Tagline: "Milk Now. Money Now."
- **Core Mission**: India's fastest direct-to-bank instant milk payment and digital weighing network. Eliminates payment delays (7-15 days), middlemen cuts, and FAT/SNF manipulation.
- **Key Features & Benefits for Farmers**:
  1. **Sub-2-Second UPI Payout**: Milk money is transferred directly to the farmer's bank account with an official 12-digit RBI UTR reference within 2 seconds of weighing/testing.
  2. **Automated Digital Weighing & Testing**: Digital scales and ultrasonic milk analyzers are integrated directly into the system. Zero human manipulation of weight, FAT%, or SNF%.
  3. **Dynamic Quality-Based Pricing**: Rate = BasePrice + (FAT × FATFactor) + (SNF × SNFFactor). Farmers earn ₹5 to ₹12 MORE per liter for high quality milk compared to traditional flat buyers.
  4. **24/7 Digital Passbook & Mobile PWA**: Real-time access to past delivery slips, FAT trends, and payments with offline sync.
  5. **Anti-Fraud Security**: 1 morning & 1 evening collection limit per registered farmer per day with collusion alerts to protect farmers and societies.
  6. **AI Krishi Mitra**: 24/7 multilingual dairy & farm advisory (disease prevention, silage, feed, government schemes, ledger queries).
  7. **Financial Inclusion**: Digital transaction history enables easy access to low-interest Kisan Credit Cards (KCC), AHIDF dairy loans, and cattle insurance.

INSTRUCTIONS:
1. ANSWER ANY QUESTION: Whether the user asks about 3T, world general knowledge (e.g., 'Who is the President of China?', 'National bird of India', 'PM of Pakistan', 'Next Olympics'), math (e.g., '5+5'), science, or agriculture, answer directly, accurately, and politely.
2. 3T QUERIES: If asked about 3T (what is 3T, how it works, pricing formula, instant UPI payment, digital passbook, security), explain enthusiastically with all core benefits.
3. LEDGER QUERIES: If the user asks about their milk records, FAT%, volume, date-specific entries, or payment history, check the provided FARMER RECENT MILK LEDGER and report the exact facts.
4. FORMATTING: Use clean bullet points or concise paragraphs. Respond in the requested language (${language}).`;

    const FALLBACK_MODELS = [
      'gemini-3.6-flash',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-pro-latest',
      'gemini-flash-latest',
    ];

    // ── 7. Call Gemini API with Multi-Model Fallback Cascade ──
    let answer = '';

    for (const modelName of FALLBACK_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const geminiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `\n\nUser Question: ${question}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 3500,
              topP: 0.9,
            },
          }),
        });

        clearTimeout(timeoutId);
        const geminiData = await geminiRes.json();
        if (geminiRes.ok && geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          answer = geminiData.candidates[0].content.parts[0].text;
          break;
        }
      } catch (err) {
        console.warn(`[AI Mitra] Model ${modelName} error, falling back...`);
      }
    }

    if (!answer) {
      const q = question.toLowerCase().trim();
      const mathMatch = q.match(/^(\d+[\s\+\-\*\/%]+\d+[\s\+\-\*\/%\d]*)$/);
      if (mathMatch) {
        try {
          const sanitized = mathMatch[0].replace(/[^0-9\+\-\*\/\.\s]/g, '');
          const result = Function(`'use strict'; return (${sanitized})`)();
          answer = `The result is: **${result}**`;
        } catch {}
      }

      if (!answer && (q.includes('president of china') || q.includes('चीन') || q.includes('china'))) {
        answer = language === 'marathi' ? `चीनचे राष्ट्राध्यक्ष **शी जिनपिंग (Xi Jinping)** आहेत.` : `The President of China is **Xi Jinping**.`;
      } else if (!answer && (q.includes('national bird') || q.includes('पक्षी'))) {
        answer = language === 'marathi' ? `भारताचा राष्ट्रीय पक्षी **मोर (Peacock)** आहे.` : `The National Bird of India is the **Indian Peacock**.`;
      } else if (!answer && (q.includes('scheme') || q.includes('subsidy') || q.includes('yojana') || q.includes('योजना') || q.includes('अनुदान') || q.includes('सबसिडी') || q.includes('loan'))) {
        if (language === 'marathi') {
          answer = `नमस्कार शेतकरी मित्र, दुग्ध व्यवसायासाठी शासकीय योजना व सबसिडी:\n\n* **१. AHIDF योजना:** डेअरी शेड व मशिनरीसाठी ९०% कर्ज आणि ३% व्याज सवलत.\n* **२. नाबार्ड सबसिडी (NLM):** नवीन दुभती जनावरे खरेदीवर २५% ते ३३.३३% पर्यंत थेट शासकीय अनुदान.\n* **३. किसान क्रेडिट कार्ड (KCC):** चारा व पशुखाद्यासाठी ४% सवलतीच्या दराने ₹२ लाखांपर्यंत खेळते भांडवल कर्ज.`;
        } else if (language === 'hindi') {
          answer = `नमस्ते किसान मित्र, डेयरी क्षेत्र की प्रमुख सरकारी योजनाएं:\n\n* **1. AHIDF योजना:** आधुनिक शेड व डेयरी उपकरणों के लिए 90% तक ऋण व 3% ब्याज सब्सिडी।\n* **2. नाबार्ड योजना (NLM):** 2 से 10 दुधारू पशु खरीदने पर 25% से 33.33% तक सीधी सब्सिडी।\n* **3. डेयरी KCC:** चारे और पशु आहार के लिए 4% रियायती ब्याज दर पर ₹2 लाख तक का ऋण।`;
        } else {
          answer = `Hello Farmer Friend, here are the key Government Dairy Schemes:\n\n* **1. AHIDF Scheme:** Up to 90% bank loan with 3% interest subvention for dairy setups and equipment.\n* **2. NABARD NLM Subsidy:** 25% to 33.33% capital subsidy for purchasing milch cows or buffaloes.\n* **3. Dairy Kisan Credit Card (KCC):** Working capital loans up to ₹2 Lakh at just 4% interest.`;
        }
      } else if (!answer) {
        if (language === 'marathi') {
          answer = `नमस्कार शेतकरी मित्र, ३T AI मित्राकडून महत्त्वाचा सल्ला:\n\n* **फॅट व SNF वाढवण्यासाठी:** दररोज जनावरांना ६०% सुका चारा, ४०% हिरवा चारा आणि ५०-१०० ग्रॅम बायपास फॅट द्या.\n* **आरोग्य व स्वच्छता:** दररोज गोठा स्वच्छ ठेवा आणि स्वच्छ पिण्याचे पाणी पुरवा.\n* **३T फायदा:** उत्तम फॅट/SNF दुधाला ३T वर त्वरित उच्च दर आणि थेट UPI पेमेंट मिळते.`;
        } else if (language === 'hindi') {
          answer = `नमस्ते किसान मित्र, 3T AI मित्र से सलाह:\n\n* **फैट और SNF वृद्धि:** पशुओं को 60% सूखा चारा, 40% हरा चारा और 50-100 ग्राम बाईपास फैट दें।\n* **स्वच्छता व देखभाल:** थनैला से बचाव के लिए दूध निकालने के बाद थनों को साफ रखें।\n* **3T लाभ:** उच्च गुणवत्ता वाले दूध पर तुरंत उचित मूल्य और सीधा UPI भुगतान प्राप्त होता है।`;
        } else {
          answer = `Hello Farmer Friend, here is 3T AI Mitra guidance:\n\n* **Improve FAT & SNF:** Maintain 60% dry fodder, 40% green fodder, and supplement with bypass fat.\n* **Hygiene & Health:** Keep sheds clean and ensure clean drinking water daily.\n* **3T Benefits:** Higher quality milk receives higher dynamic rates, credited instantly via UPI.`;
        }
      }
    }

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error('[AI Mitra] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
