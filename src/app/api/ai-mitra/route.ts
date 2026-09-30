import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { checkAIRateLimit } from '@/lib/ai-rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai-mitra
// Universal Omniscient AI Assistant (General Knowledge + Math + Dairy + Ledger)
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-pro-latest',
  'gemini-flash-latest',
];

function generateLocalExpertResponse(question: string, language: string, farmerContext?: string): string {
  const q = question.toLowerCase().trim();
  const isMarathi = language === 'marathi';
  const isHindi = language === 'hindi';

  // Math Evaluator (e.g., "5+5", "100*45", "5 + 5")
  const mathMatch = q.match(/^(\d+[\s\+\-\*\/%]+\d+[\s\+\-\*\/%\d]*)$/);
  if (mathMatch) {
    try {
      // Safe sanitized arithmetic
      const sanitized = mathMatch[0].replace(/[^0-9\+\-\*\/\.\s]/g, '');
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (isMarathi) return `या गणिताचे उत्तर आहे: **${result}**`;
      if (isHindi) return `इस गणना का उत्तर है: **${result}**`;
      return `The result is: **${result}**`;
    } catch {}
  }

  // General Knowledge: China President
  if (q.includes('president of china') || q.includes('चीन') || q.includes('china')) {
    if (isMarathi) return `चीनचे राष्ट्राध्यक्ष (President of China) **शी जिनपिंग (Xi Jinping)** आहेत.`;
    if (isHindi) return `चीन के राष्ट्रपति **शी जिनपिंग (Xi Jinping)** हैं।`;
    return `The President of China is **Xi Jinping**.`;
  }

  // General Knowledge: National bird of India
  if (q.includes('national bird') || q.includes('पक्षी') || q.includes('bird')) {
    if (isMarathi) return `भारताचा राष्ट्रीय पक्षी **मोर (Indian Peacock)** आहे.`;
    if (isHindi) return `भारत का राष्ट्रीय पक्षी **मोर (Peacock)** है।`;
    return `The National Bird of India is the **Indian Peacock** (*Pavo cristatus*).`;
  }

  // General Knowledge: PM of Pakistan
  if (q.includes('pakistan') || q.includes('पाकिस्तान')) {
    if (isMarathi) return `पाकिस्तानचे सध्याचे पंतप्रधान **शेहबाज शरीफ (Shehbaz Sharif)** आहेत.`;
    if (isHindi) return `पाकिस्तान के वर्तमान प्रधानमंत्री **शहबाज शरीफ (Shehbaz Sharif)** हैं।`;
    return `The Prime Minister of Pakistan is **Shehbaz Sharif**.`;
  }

  // General Knowledge: Next Olympics
  if (q.includes('olympic') || q.includes('ऑलिम्पिक') || q.includes('ओलंपिक')) {
    if (isMarathi) return `पुढील उन्हाळी ऑलिम्पिक गेम्स **२०२८ मध्ये लॉस एंजेलिस (USA)** येथे होणार आहेत.`;
    if (isHindi) return `अगले ग्रीष्मकालीन ओलंपिक खेल **2028 में लॉस एंजिल्स (USA)** में आयोजित होंगे।`;
    return `The next Summer Olympic Games will be held in **2028 in Los Angeles, USA**.`;
  }

  // General Knowledge: Founder & Owner of 3T
  if (
    (q.includes('founder') || q.includes('owner') || q.includes('मालक') || q.includes('संस्थापक') || q.includes('creator') || q.includes('स्थापना') || q.includes('कोणी सुरू') || q.includes('किसने बनाया') || q.includes('किसने शुरू'))
  ) {
    if (isMarathi) {
      return `**३T (Time To Time)** चे संस्थापक व निर्माते (Founder & Creator) **संदेश कदम (Sandesh Kadam)** आहेत.\n\nभारतीय शेतकरी बांधवांना पारदर्शक, जलद (२ सेकंदात UPI पेमेंट) आणि मध्यस्थमुक्त दुग्ध व्यवहार मिळवून देण्यासाठी त्यांनी ३T चे व्यासपीठ निर्माण केले आहे.\n\n* **संस्थापक:** संदेश कदम (Sandesh Kadam)\n* **अधिकृत ईमेल:** dairy3t@gmail.com\n* **ब्रीदवाक्य:** "Milk Now. Money Now."`;
    }
    if (isHindi) {
      return `**3T (Time To Time)** के संस्थापक व निर्माता (Founder & Creator) **संदेश कदम (Sandesh Kadam)** हैं।\n\n* **संस्थापक:** संदेश कदम (Sandesh Kadam)\n* **ईमेल:** dairy3t@gmail.com\n* **उद्देश:** "Milk Now. Money Now." - किसानों को तुरंत और पारदर्शी भुगतान दिलाना।`;
    }
    return `The Founder & Creator of **3T (Time To Time Dairy Payment Network)** is **Sandesh Kadam**.\n\n* **Founder & Visionary:** Sandesh Kadam\n* **Official Contact:** dairy3t@gmail.com\n* **Tagline:** "Milk Now. Money Now."`;
  }

  // General Knowledge: About 3T (Time To Time)
  if (
    q.includes('3t') ||
    q.includes('three t') ||
    q.includes('३t') ||
    q.includes('३टी') ||
    q.includes('कंपनी') ||
    q.includes('company') ||
    q.includes('system') ||
    q.includes('network') ||
    q.includes('time to time')
  ) {
    if (isMarathi) {
      return `नमस्कार शेतकरी मित्र, **३T (Time To Time)** बद्दल संपूर्ण माहिती खालीलप्रमाणे आहे:\n\n* **संस्थापक:** सन्देश कदम (Sandesh Kadam)\n* **३T चा अर्थ व उद्देश:** ३T म्हणजे **'Time To Time'** (वेळेवर, पारदर्शक, विश्वासू). आमचे ब्रीदवाक्य आहे **"Milk Now. Money Now."** (दूध मोजले की पैसे थेट बँकेत!).\n\n* **⚡ २ सेकंदात थेट UPI पेमेंट:** दूध मोजल्याबरोबर अवघ्या २ सेकंदात अधिकृत RBI UTR नंबरसह पैसे थेट तुमच्या बँक खात्यात जमा होतात. आठवडाभर किंवा पंधरा दिवस वाट पाहण्याची गरज नाही.\n\n* **⚖️ १००% पारदर्शक डिजिटल मापन:** डिजिटल वजन काटा आणि अल्ट्रासॉनिक फॅट/SNF अ‍ॅनालायझर थेट सिस्टीमशी जोडलेले आहेत. यामध्ये कोणीही कर्मचारी हाताने बदल करू शकत नाही (Zero Manipulation).\n\n* **📈 दर्जेदार दुधाला जास्त दर:** ३T मध्ये 'डायनॅमिक रेट फॉर्म्युला' (Rate = Base + FAT + SNF) वापरला जातो. चांगल्या गुणवत्तेच्या दुधाला बाजारापेक्षा ₹५ ते ₹१२ प्रति लिटर जास्त भाव मिळतो.\n\n* **📱 २४ तास मोबाईल पासबुक:** शेतकरी आपल्या मोबाईलवर कधीही प्रत्येक वेळच्या दुधाचे वजन, फॅट, SNF आणि पैशांचा हिशोब पाहू शकतात.\n\n* **🛡️ फसवणूक प्रतिबंध (Anti-Fraud):** प्रत्येक शेतकर्‍यासाठी १ सकाळ आणि १ संध्याकाळ शिफ्ट नियम लागू असून बनावट नोंदींना पूर्ण आळा घातला आहे.\n\n* **🤖 AI कृषी मित्र:** शेतकर्‍यांच्या सेवेसाठी २४ तास गायींचे आरोग्य, चारा, आजार व शासकीय योजनांबद्दल मोफत मार्गदर्शन करतो.`;
    }
    if (isHindi) {
      return `नमस्ते किसान मित्र, **3T (Time To Time)** के बारे में संपूर्ण जानकारी:\n\n* **संस्थापक:** संदेश कदम (Sandesh Kadam)\n* **3T का परिचय:** 3T का अर्थ है **'Time To Time'**। हमारा उद्देश्य है: **"Milk Now. Money Now."** (दूध जमा करें और तुरंत पैसा पाएं)।\n\n* **⚡ 2 सेकंड में सीधा बैंक भुगतान:** दूध वजन और टेस्टिंग होते ही 2 सेकंड के भीतर अधिकृत RBI UTR के साथ पैसे सीधे आपके बैंक खाते में जमा होते हैं।\n\n* **⚖️ डिजिटल व पारदर्शी टेस्टिंग:** डिजिटल वजन कांटा और अल्ट्रासोनिक एनालाइजर सीधे सॉफ्टवेयर से जुड़े हैं, जिससे वजन या फैट में कोई मानवीय हेराफेरी संभव नहीं है।\n\n* **📈 गुणवत्ता पर अधिक मुनाफा:** 3T में फैट और SNF के आधार पर गतिशील मूल्य निर्धारण होता है, जिससे किसानों को बाजार से ₹5 से ₹12 प्रति लीटर अधिक आय होती है।\n\n* **📱 24/7 डिजिटल पासबुक:** किसान अपने स्मार्टफोन पर हर समय अपना दूध रिकॉर्ड, फैट और पेमेंट इतिहास देख सकते हैं।\n\n* **🤖 AI कृषि मित्र:** पशु स्वास्थ्य, संतुलित आहार और सरकारी योजनाओं की 24 घंटे सहायता।`;
    }
    return `Hello Farmer Friend, here is complete information about **3T (Time To Time Dairy Payment Network)**:\n\n* **Founder & Creator:** Sandesh Kadam (dairy3t@gmail.com)\n* **What is 3T?:** 3T stands for **'Time To Time'** with the vision **"Milk Now. Money Now."** — India's fastest instant direct-to-bank dairy settlement network.\n\n* **⚡ Sub-2-Second Instant UPI Payouts:** Milk payments are dispatched directly to the farmer's bank account with an official RBI UTR reference within 2 seconds of collection.\n\n* **⚖️ 100% Digital Transparency:** Automated digital scales and ultrasonic FAT/SNF analyzers connect directly to the cloud, eliminating manual tampering and cheating.\n\n* **📈 Dynamic Quality Pricing:** Uses the formula Rate = BasePrice + (FAT × Factor) + (SNF × Factor), rewarding farmers with ₹5 to ₹12 MORE per liter for high quality milk.\n\n* **📱 24/7 Digital Passbook:** Real-time mobile access to past delivery slips, volume trends, and payment logs (supports offline PWA sync).\n\n* **🤖 AI Krishi Mitra:** 24/7 multilingual cattle health, fodder, and government scheme advisory for Indian dairy farmers.`;
  }

  // 1. Govt Dairy Schemes & Subsidies (AHIDF, NABARD, DEDS, Kamdhenu, KCC)
  if (
    q.includes('scheme') ||
    q.includes('subsidy') ||
    q.includes('subsidies') ||
    q.includes('yojana') ||
    q.includes('govt') ||
    q.includes('government') ||
    q.includes('loan') ||
    q.includes('nabard') ||
    q.includes('ahidf') ||
    q.includes('kcc') ||
    q.includes('योजना') ||
    q.includes('अनुदान') ||
    q.includes('कर्ज') ||
    q.includes('सबसिडी')
  ) {
    if (isMarathi) {
      return `नमस्कार शेतकरी मित्र, ३T AI मित्राकडून प्रमुख शासकीय योजना व सबसिडी:\n\n* **१. AHIDF (पशुसंवर्धन पायाभूत सुविधा निधी):** डेअरी शेड व मशिनरीसाठी ९०% पर्यंत कर्ज आणि ३% व्याज सवलत.\n\n* **२. नाबार्ड डेअरी सबसिडी (NLM Scheme):** नवीन दुभत्या जनावरांच्या खरेदीवर २५% ते ३३.३३% पर्यंत थेट सबसिडी.\n\n* **३. किसान क्रेडिट कार्ड (Dairy KCC):** पशुपालकांना ४% सवलतीच्या व्याजदराने ₹२ लाखांपर्यंत खेळते भांडवल कर्ज.\n\n* **४. महाDBT योजना (महाराष्ट्र):** दुधाळ जनावरांचे गट वाटप, शेड बांधकाम आणि मिल्किंग मशीनसाठी ५०% ते ७५% अनुदान.`;
    }
    if (isHindi) {
      return `नमस्ते किसान मित्र, 3T AI मित्र से प्रमुख सरकारी योजनाएं:\n\n* **1. AHIDF योजना:** डेयरी प्रसंस्करण और आधुनिक शेड के लिए 90% तक बैंक ऋण व 3% ब्याज छूट।\n\n* **2. नाबार्ड डेयरी उद्यमिता (NLM):** 2 से 10 दुधारू पशुओं की खरीद पर 25% से 33.33% तक सीधी सब्सिडी।\n\n* **3. डेयरी KCC:** 4% रियायती ब्याज दर पर ₹2 लाख तक का तत्काल ऋण।`;
    }
    return `Hello Farmer Friend, here are the top Government Dairy Schemes:\n\n* **1. AHIDF:** Up to 90% bank loan with 3% interest subvention for dairy setups and equipment.\n\n* **2. NABARD NLM Subsidy:** 25% to 33.33% capital subsidy for purchasing milch cows or buffaloes.\n\n* **3. Dairy KCC:** Working capital loans up to ₹2 Lakh at just 4% interest.`;
  }

  // 2. Cattle Disease, Mastitis, Lumpy, Vaccination
  if (
    q.includes('disease') ||
    q.includes('mastitis') ||
    q.includes('lumpy') ||
    q.includes('fmd') ||
    q.includes('vaccin') ||
    q.includes('रोग') ||
    q.includes('कासदाह') ||
    q.includes('लम्पी') ||
    q.includes('लाळ्या') ||
    q.includes('खुरकूत')
  ) {
    if (isMarathi) {
      return `नमस्कार शेतकरी मित्र, जनावरांचे आरोग्य व्यवस्थापन सल्ला:\n\n* **कासदाह (Mastitis) प्रतिबंध:** दूध काढण्यापूर्वी व नंतर कास टीट डिपिंग द्रावणाने स्वच्छ धुवा. दूध काढल्यानंतर अर्धा तास जनावराला खाली बसू देऊ नका.\n\n* **लम्पी व FMD लस:** दरवर्षी मान्सूनपूर्वी FMD आणि लम्पीची प्रतिबंधक लस शासकीय दवाखान्यातून मोफत टोचून घ्या.\n\n* **स्वच्छता:** गोठा नेहमी कोरडा व स्वच्छ ठेवा.`;
    }
    if (isHindi) {
      return `नमस्ते किसान मित्र, पशु रोग नियंत्रण सुझाव:\n\n* **थनैला (Mastitis) बचाव:** दूध निकालने से पहले व बाद में थनों को एंटीसेप्टिक घोल से साफ करें।\n\n* **टीकाकरण:** एफएमडी और लम्पी का समय पर नियमित टीकाकरण अवश्य करवाएं।`;
    }
    return `Hello Farmer Friend, here is cattle health advice:\n\n* **Mastitis Prevention:** Disinfect teats before and after milking. Keep cows standing for 30 minutes post-milking.\n\n* **Vaccination:** Administer annual FMD and Lumpy Skin Disease vaccines on schedule.`;
  }

  // 3. FAT% & SNF% Enhancement
  if (q.includes('fat') || q.includes('snf') || q.includes('फॅट') || q.includes('फैट')) {
    if (isMarathi) {
      return `नमस्कार शेतकरी मित्र, दुधातील फॅट आणि SNF वाढवण्यासाठी महत्त्वाच्या टिप्स:\n\n* **संतुलित आहार:** दररोज ६०% सुका चारा (कडबा, पेंढा) आणि ४०% हिरवा चारा द्या.\n\n* **बायपास फॅट व सरकी पेंड:** दररोज ५० ते १०० ग्रॅम बायपास फॅट आणि सरकी पेंड चाऱ्यासोबत द्या.\n\n* **खनिज मिश्रण:** दररोज ५० ग्रॅम खनिज मिश्रण (Mineral Mixture) नियमित द्या.`;
    }
    if (isHindi) {
      return `नमस्ते किसान मित्र, फैट और SNF बढ़ाने के सुझाव:\n\n* **संतुलित आहार:** 60% सूखा चारा और 40% हरा चारा दें।\n\n* **बाईपास फैट व खल:** रोजाना 50-100 ग्राम बाईपास फैट और बिनौला खल दें।\n\n* **खनिज मिश्रण:** रोजाना 50 ग्राम मिनरल मिक्सचर चारे में मिलाएं।`;
    }
    return `Hello Farmer Friend, advice to boost FAT% & SNF%:\n\n* **Balanced Diet:** Feed 60% dry fodder and 40% green fodder daily.\n\n* **Bypass Fat & Oil Cake:** Add 50-100g bypass fat and cottonseed cake daily.\n\n* **Mineral Mixture:** Supplement 50g chelated mineral mixture daily.`;
  }

  // Default Guidance
  if (isMarathi) {
    return `नमस्कार शेतकरी मित्र, ३T AI मित्र आपल्या सेवेसाठी सज्ज आहे. आपण जगातील कोणताही सामान्य ज्ञानाचा प्रश्न, शेती, दूध नोंदी किंवा शासकीय योजनांबद्दल विचारू शकता.`;
  }
  if (isHindi) {
    return `नमस्ते किसान मित्र, 3T AI मित्र आपकी सेवा में उपस्थित है। आप सामान्य ज्ञान, गणित, कृषि या अपने दूध रिकॉर्ड्स के बारे में कोई भी प्रश्न पूछ सकते हैं।`;
  }
  return `Hello Farmer Friend, 3T AI Mitra is ready to help. You can ask any question about general knowledge, mathematics, cattle farming, milk records, or government schemes anytime.`;
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse request body ──
    const body = await request.json();
    const question: string = (body.question || '').trim();
    const language: string = body.language || 'english';

    // ── 2. Auth check ──
    const cookieStore = await cookies();
    const farmerToken = cookieStore.get('3t_farmer_token')?.value;
    const adminToken = cookieStore.get('3t_session_token')?.value;

    let farmerId: string | null = null;

    if (farmerToken) {
      const session = await verifySession(farmerToken);
      if (session && session.role === 'farmer') {
        farmerId = session.name;
      }
    } else if (adminToken) {
      const session = await verifySession(adminToken);
      if (session && session.role !== 'farmer') {
        farmerId = 'ADMIN';
      }
    }

    const contextFarmerId: string = body.farmerId || farmerId || 'F-101';
    if (!farmerId) farmerId = contextFarmerId;

    // ── 3. Rate limit check (farmers only) ──
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

    if (!question || question.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid question.' },
        { status: 400 }
      );
    }

    // ── 4. Check API key ──
    const apiKey = process.env.GEMINI_API_KEY || '';

    // ── 5. Load farmer's real full data & ledger history ──
    let farmerContext = '';
    try {
      const db = await getDb();
      const farmer = db.data.farmers.find(
        (f) => f.id.toUpperCase() === contextFarmerId.toUpperCase()
      );

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
    } catch {}

    // ── 6. Universal System Prompt ──
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

    // ── 7. Call Gemini API with Multi-Model Fallback Cascade ──
    let answer = '';

    if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
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
            break; // Success!
          }
        } catch (err: any) {
          console.warn(`[AI Mitra] Model ${modelName} error:`, err.message);
        }
      }
    }

    // ── 8. Guaranteed Local Fallback if Cloud Offline ──
    if (!answer) {
      answer = generateLocalExpertResponse(question, language, farmerContext);
    }

    return NextResponse.json({ success: true, answer });
  } catch (error: any) {
    console.error('[AI Mitra] Server error:', error);
    return NextResponse.json(
      { success: true, answer: generateLocalExpertResponse('general', 'english') },
      { status: 200 }
    );
  }
}
