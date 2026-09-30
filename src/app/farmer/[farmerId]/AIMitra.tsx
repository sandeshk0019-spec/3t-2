"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ChevronDown,
  Sprout,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Language = "english" | "marathi" | "hindi";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface Props {
  farmerId: string;
  farmerName: string;
  avgFat: string;
  avgSnf: string;
  totalEarnings: number;
  totalCollections: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Language Config
// ─────────────────────────────────────────────────────────────────────────────

const LANG_CONFIG = {
  english: {
    label: "English",
    flag: "🇬🇧",
    placeholder: "Ask anything about your cows or milk quality...",
    greeting: (name: string, fat: string, snf: string) =>
      `Hello ${name}! 🐄 I'm your AI Krishi Mitra. Your average FAT is ${fat}% and SNF is ${snf}%. How can I help you today?`,
    chips: [
      "How to increase FAT%?",
      "How to improve SNF?",
      "Best cow feed plan",
      "Cow disease symptoms",
      "Govt dairy schemes",
    ],
    sending: "Thinking...",
    rateLimited: "You've used all 10 AI questions for today. Try again tomorrow!",
    comingSoon: "🌾 AI Mitra is coming soon! We're setting up the system.",
    error: "Something went wrong. Please try again.",
    title: "AI Krishi Mitra",
    subtitle: "Your Personal Dairy Expert",
    disclaimer: {
      badge: "Safety & Privacy Notice",
      title: "Welcome to AI Krishi Mitra",
      intro: "Before chatting, please read and accept our usage and safety guidelines:",
      point1Title: "Chat Stored for 7 Days:",
      point1Desc: "Your conversations are recorded for 7 days for milk passbook records, calculation audits, and service improvement.",
      point2Title: "Respectful Language & Conduct:",
      point2Desc: "Please use polite language. Abusive words, inappropriate queries, and spam are strictly prohibited and monitored.",
      point3Title: "Security & Confidentiality:",
      point3Desc: "Never share confidential bank OTPs, debit card PINs, or private passwords.",
      agreeCheckbox: "I understand that my messages may be recorded for service quality, and I agree to use polite and respectful language.",
      proceedButton: "Proceed to AI Mitra 🌾",
    },
  },
  marathi: {
    label: "मराठी",
    flag: "🇮🇳",
    placeholder: "गाय किंवा दुधाबद्दल काहीही विचारा...",
    greeting: (name: string, fat: string, snf: string) =>
      `नमस्ते ${name}! 🐄 मी तुमचा AI कृषी मित्र आहे. तुमचा सरासरी FAT ${fat}% आणि SNF ${snf}% आहे. आज मी तुम्हाला कशी मदत करू?`,
    chips: [
      "FAT% कसा वाढवावा?",
      "SNF कसा सुधारावा?",
      "गाईचा आहार नियोजन",
      "गाईचे आजार आणि उपाय",
      "सरकारी डेअरी योजना",
    ],
    sending: "विचार करतोय...",
    rateLimited: "आजचे १० प्रश्न संपले. उद्या पुन्हा प्रयत्न करा!",
    comingSoon: "🌾 AI मित्र लवकरच येतोय! सिस्टम तयार होत आहे.",
    error: "काहीतरी चुकले. पुन्हा प्रयत्न करा.",
    title: "AI कृषी मित्र",
    subtitle: "तुमचा वैयक्तिक डेअरी तज्ञ",
    disclaimer: {
      badge: "सुरक्षा व गोपनीयता सूचना",
      title: "AI कृषी मित्रामध्ये आपले स्वागत आहे",
      intro: "AI मित्राशी संभाषण सुरू करण्यापूर्वी खालील सुरक्षा नियम व सूचना वाचा:",
      point1Title: "संभाषण ७ दिवस साठवले जाईल:",
      point1Desc: "दुग्ध नोंदींचा मागोवा, हिशोबाची मदत आणि सेवेच्या दर्जासाठी तुमचे संभाषण ७ दिवस सुरक्षित साठवले (Store) जाते.",
      point2Title: "सभ्य व आदरयुक्त भाषेचा वापर:",
      point2Desc: "कृपया आदरयुक्त भाषा वापरा. शिवीगाळ, आक्षेपार्ह किंवा चुकीचे संदेश पाठवण्यास सक्त मनाई आहे.",
      point3Title: "गोपनीयता व सुरक्षितता:",
      point3Desc: "आपला बँक पासवर्ड, ओटीपी (OTP) किंवा वैयक्तिक गुप्त माहिती कोणाशीही शेअर करू नका.",
      agreeCheckbox: "मी वरील सर्व नियम वाचले असून सेवेच्या दर्जासाठी संदेश साठवण्यास व योग्य भाषा वापरण्यास सहमत आहे.",
      proceedButton: "संभाषण सुरू करा 🌾",
    },
  },
  hindi: {
    label: "हिंदी",
    flag: "🇮🇳",
    placeholder: "गाय या दूध के बारे में कुछ भी पूछें...",
    greeting: (name: string, fat: string, snf: string) =>
      `नमस्ते ${name}! 🐄 मैं आपका AI कृषि मित्र हूं। आपका औसत FAT ${fat}% और SNF ${snf}% है। आज मैं आपकी कैसे मदद कर सकता हूं?`,
    chips: [
      "FAT% कैसे बढ़ाएं?",
      "SNF कैसे सुधारें?",
      "गाय का चारा योजना",
      "गाय की बीमारी और उपाय",
      "सरकारी डेयरी योजनाएं",
    ],
    sending: "सोच रहा हूं...",
    rateLimited: "आज के १० सवाल खत्म हो गए। कल फिर कोशिश करें!",
    comingSoon: "🌾 AI मित्र जल्द आ रहा है! सिस्टम तैयार हो रहा है।",
    error: "कुछ गलत हो गया। दोबारा कोशिश करें।",
    title: "AI कृषि मित्र",
    subtitle: "आपका व्यक्तिगत डेयरी विशेषज्ञ",
    disclaimer: {
      badge: "सुरक्षा एवं उपयोग दिशानिर्देश",
      title: "AI कृषि मित्र में आपका स्वागत है",
      intro: "AI मित्र से बातचीत शुरू करने से पहले सुरक्षा नियम व दिशानिर्देश स्वीकार करें:",
      point1Title: "बातचीत 7 दिन तक सुरक्षित रहेगी:",
      point1Desc: "डेयरी रिकॉर्ड्स की मदद और सेवा गुणवत्ता सुधार के लिए आपकी बातचीत 7 दिनों तक सुरक्षित रखी जाती है।",
      point2Title: "सभ्य भाषा का उपयोग:",
      point2Desc: "कृपया आदरयुक्त भाषा का प्रयोग करें। अभद्र भाषा, गाली-गलौज या अनुचित प्रश्न पूछना सख्त वर्जित है।",
      point3Title: "गोपनीयता व सुरक्षा:",
      point3Desc: "अपना बैंक पिन, पासवर्ड या गोपनीय जानकारी किसी के साथ साझा न करें।",
      agreeCheckbox: "मैंने सभी नियम पढ़ लिए हैं और सेवा गुणवत्ता हेतु संदेश संग्रह व उचित भाषा के उपयोग से सहमत हूँ।",
      proceedButton: "बातचीत शुरू करें 🌾",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Formatted Message Component (Clean Paragraphs & Bullet Spacing)
// ─────────────────────────────────────────────────────────────────────────────

function FormattedMessage({ text, isAi }: { text: string; isAi: boolean }) {
  if (!isAi) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }

  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const renderInlineMarkdown = (raw: string) => {
    const parts = raw.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} className="font-bold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={idx} className="italic text-gray-800">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code key={idx} className="bg-gray-200 text-emerald-900 px-1 py-0.5 rounded text-[11px] font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const flushList = () => {
    if (currentList.length > 0) {
      const listItems = [...currentList];
      currentList = [];
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2.5 my-2.5 pl-0.5">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start space-x-2 text-xs leading-relaxed text-gray-800">
              <span className="text-emerald-600 font-black shrink-0 mt-0.5 select-none">•</span>
              <span className="flex-1">{renderInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    const bulletMatch = trimmed.match(/^([\*\-\•]|\d+\.)\s+(.*)/);
    if (bulletMatch) {
      currentList.push(bulletMatch[2]);
    } else {
      flushList();
      elements.push(
        <p key={`p-${index}`} className="mb-2.5 leading-relaxed text-xs text-gray-800">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function AIMitra({ farmerId, farmerName, avgFat, avgSnf, totalEarnings, totalCollections }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>("marathi");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeted, setGreeted] = useState(false);

  // ── First-time Disclaimer & Safety Consent ──
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [isDisclaimerChecked, setIsDisclaimerChecked] = useState(false);

  // Check if farmer has already accepted the disclaimer
  useEffect(() => {
    try {
      const accepted = localStorage.getItem(`3t_ai_disclaimer_v1_${farmerId}`);
      if (accepted === "true") {
        setHasAcceptedDisclaimer(true);
      }
    } catch (e) {}
  }, [farmerId]);

  const handleAcceptDisclaimer = () => {
    try {
      localStorage.setItem(`3t_ai_disclaimer_v1_${farmerId}`, "true");
    } catch (e) {}
    setHasAcceptedDisclaimer(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // ── Voice & Speech State (100% Free Web Speech API) ──
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang = LANG_CONFIG[language];

  // Load available browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const vList = window.speechSynthesis.getVoices();
      if (vList && vList.length > 0) {
        setAvailableVoices(vList);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Clean up speech synthesis when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Speak AI response out loud (Text-to-Speech) ──
  const speakText = (text: string, msgId?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // cancel any previous speech

    if (isSpeaking && speakingMsgId === msgId) {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
      return;
    }

    const plainText = text
      .replace(/[*#_`~>\[\]\(\)\$]/g, "")
      .replace(/•/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\n+/g, " ")
      .trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText);
    const allVoices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    let matchedVoice: SpeechSynthesisVoice | null = null;

    if (language === "marathi") {
      // 1. Search for Marathi voice
      matchedVoice =
        allVoices.find(
          (v) =>
            v.lang.toLowerCase() === "mr-in" ||
            v.lang.toLowerCase().startsWith("mr") ||
            v.name.toLowerCase().includes("marathi") ||
            v.name.toLowerCase().includes("मराठी")
        ) || null;

      // 2. High-quality Devanagari Hindi voice (Reads Marathi Devanagari script cleanly)
      if (!matchedVoice) {
        matchedVoice =
          allVoices.find(
            (v) =>
              v.lang.toLowerCase() === "hi-in" ||
              v.lang.toLowerCase().startsWith("hi") ||
              v.name.toLowerCase().includes("hindi") ||
              v.name.toLowerCase().includes("हिन्दी") ||
              v.name.toLowerCase().includes("swara") ||
              v.name.toLowerCase().includes("madhur") ||
              v.name.toLowerCase().includes("hemant") ||
              v.name.toLowerCase().includes("kalpana")
          ) || null;
      }

      // 3. Indian English fallback
      if (!matchedVoice) {
        matchedVoice =
          allVoices.find(
            (v) =>
              v.lang.toLowerCase() === "en-in" ||
              v.name.toLowerCase().includes("india") ||
              v.name.toLowerCase().includes("neerja") ||
              v.name.toLowerCase().includes("prabhat")
          ) || null;
      }

      utterance.lang = matchedVoice?.lang || "mr-IN";
    } else if (language === "hindi") {
      matchedVoice =
        allVoices.find(
          (v) =>
            v.lang.toLowerCase() === "hi-in" ||
            v.lang.toLowerCase().startsWith("hi") ||
            v.name.toLowerCase().includes("hindi") ||
            v.name.toLowerCase().includes("हिन्दी")
        ) || null;

      utterance.lang = matchedVoice?.lang || "hi-IN";
    } else {
      matchedVoice =
        allVoices.find(
          (v) =>
            v.lang.toLowerCase() === "en-in" ||
            v.name.toLowerCase().includes("india") ||
            v.name.toLowerCase().includes("neerja")
        ) ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith("en")) ||
        null;

      utterance.lang = matchedVoice?.lang || "en-IN";
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = language === "marathi" ? 0.88 : 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (msgId) setSpeakingMsgId(msgId);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingMsgId(null);
    }
  };

  // ── Listen to Farmer's voice (Speech-to-Text) ──
  const toggleListening = async () => {
    stopSpeaking();

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please open this app in Google Chrome, Microsoft Edge, or Android Chrome."
      );
      return;
    }

    // 1. Explicitly request microphone permission from browser & release track
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release stream tracks immediately so SpeechRecognition can bind to the mic device
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err: any) {
      alert("Microphone permission was denied. Please allow microphone access in your browser site settings.");
      return;
    }

    // 2. Start speech recognition instance
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      const langMap: Record<Language, string> = {
        marathi: "mr-IN",
        hindi: "hi-IN",
        english: "en-IN",
      };
      recognition.lang = langMap[language] || "mr-IN";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let capturedText = "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }
        if (finalChunk) capturedText = finalChunk;
        const textToDisplay = capturedText || interimText;
        if (textToDisplay) {
          setInput(textToDisplay);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[SpeechRecognition Error]", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          if (window.location.hostname === "localhost") {
            alert("Chrome requires 127.0.0.1 for local speech recognition. Please open http://127.0.0.1:3009 in your browser bar!");
          } else {
            alert("Microphone access blocked. Please enable microphone permission in browser settings.");
          }
        } else if (event.error === "audio-capture") {
          alert("No working microphone detected on your device.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (capturedText && capturedText.trim().length > 1) {
          const textToSend = capturedText.trim();
          setInput(textToSend);
          sendMessage(textToSend);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("[SpeechRecognition Exception]", err);
      setIsListening(false);
      alert("Could not start microphone. Please refresh the page and try again.");
    }
  };

  // ── 7-Day LocalStorage Persistence ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`3t_ai_chat_v1_${farmerId}`);
      if (saved) {
        const parsed: Array<{ id: string; role: "user" | "ai"; text: string; timestamp: string }> = JSON.parse(saved);
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const valid = parsed
          .map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
          .filter((m) => m.timestamp.getTime() > sevenDaysAgo);

        if (valid.length > 0) {
          setMessages(valid);
          setGreeted(true);
        }
      }
    } catch (e) {
      console.warn("[AI Mitra] Failed to load chat history:", e);
    }
  }, [farmerId]);

  // Save messages to LocalStorage with 7-day expiry
  useEffect(() => {
    if (messages.length > 0) {
      try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const toSave = messages.filter((m) => m.timestamp.getTime() > sevenDaysAgo);
        localStorage.setItem(`3t_ai_chat_v1_${farmerId}`, JSON.stringify(toSave));
      } catch (e) {}
    }
  }, [messages, farmerId]);

  // Show greeting when chat opens if no history exists
  useEffect(() => {
    if (isOpen && !greeted && messages.length === 0) {
      const greeting: Message = {
        id: "greeting",
        role: "ai",
        text: lang.greeting(farmerName.split(" ")[0], avgFat, avgSnf),
        timestamp: new Date(),
      };
      setMessages([greeting]);
      setGreeted(true);
      setTimeout(() => inputRef.current?.focus(), 400);
    }
  }, [isOpen, greeted, messages.length]);

  // Clear chat history manually
  const clearChatHistory = () => {
    stopSpeaking();
    try {
      localStorage.removeItem(`3t_ai_chat_v1_${farmerId}`);
    } catch (e) {}
    const greeting: Message = {
      id: "greeting-" + Date.now(),
      role: "ai",
      text: lang.greeting(farmerName.split(" ")[0], avgFat, avgSnf),
      timestamp: new Date(),
    };
    setMessages([greeting]);
  };

  // Switch language without wiping out conversation history
  const handleLanguageChange = (l: Language) => {
    stopSpeaking();
    setLanguage(l);
  };

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;
    stopSpeaking();
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-mitra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language, farmerId }),
      });
      const data = await res.json();

      const aiText = data.comingSoon
        ? lang.comingSoon
        : data.rateLimited
        ? lang.rateLimited
        : data.success
        ? data.answer
        : (data.error || lang.error);

      const aiMsg: Message = {
        id: Date.now().toString() + "-ai",
        role: "ai",
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Speak response out loud if voice output enabled
      if (data.success && data.answer) {
        speakText(data.answer);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-err", role: "ai", text: err?.message || lang.error, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="ai-mitra-open-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-300/50 hover:shadow-emerald-400/60 transition-all hover:-translate-y-1 font-bold text-sm"
          >
            <Sprout className="w-5 h-5" />
            <span>AI Krishi Mitra</span>
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-4 right-4 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">{lang.title}</p>
                  <p className="text-emerald-200 text-[10px] font-semibold">{lang.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Voice Speaker Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      setVoiceEnabled(!voiceEnabled);
                    }
                  }}
                  title={isSpeaking ? "Stop Speaking" : voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    isSpeaking
                      ? "bg-amber-400 text-emerald-950 animate-pulse shadow-md"
                      : voiceEnabled
                      ? "bg-white/20 text-white hover:bg-white/30"
                      : "bg-white/10 text-white/50 hover:bg-white/20"
                  }`}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Language Selector */}
                <div className="flex bg-white/10 rounded-xl p-0.5 space-x-0.5">
                  {(Object.keys(LANG_CONFIG) as Language[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => handleLanguageChange(l)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        language === l
                          ? "bg-white text-emerald-700"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {LANG_CONFIG[l].label}
                    </button>
                  ))}
                </div>
                {/* Clear / New Chat */}
                <button
                  type="button"
                  onClick={clearChatHistory}
                  title={language === "marathi" ? "नवीन संभाषण सुरू करा" : language === "hindi" ? "नई बातचीत शुरू करें" : "Start New Chat"}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!hasAcceptedDisclaimer ? (
              /* First-Time Safety & Guidelines Consent Dialog */
              <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between bg-gradient-to-b from-emerald-50/50 via-white to-white">
                <div className="space-y-4">
                  {/* Safety Banner */}
                  <div className="flex items-center space-x-3 bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                        {lang.disclaimer.badge}
                      </span>
                      <p className="text-xs font-bold text-amber-950">
                        {lang.disclaimer.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 font-medium leading-relaxed">
                    {lang.disclaimer.intro}
                  </p>

                  {/* 3 Guidelines Cards */}
                  <div className="space-y-2.5">
                    <div className="bg-white border border-emerald-100/80 rounded-2xl p-3 shadow-xs hover:border-emerald-200 transition-colors">
                      <div className="flex items-start space-x-2.5">
                        <span className="text-base shrink-0">💾</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{lang.disclaimer.point1Title}</p>
                          <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{lang.disclaimer.point1Desc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-emerald-100/80 rounded-2xl p-3 shadow-xs hover:border-emerald-200 transition-colors">
                      <div className="flex items-start space-x-2.5">
                        <span className="text-base shrink-0">🤝</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{lang.disclaimer.point2Title}</p>
                          <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{lang.disclaimer.point2Desc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-emerald-100/80 rounded-2xl p-3 shadow-xs hover:border-emerald-200 transition-colors">
                      <div className="flex items-start space-x-2.5">
                        <span className="text-base shrink-0">🔒</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{lang.disclaimer.point3Title}</p>
                          <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{lang.disclaimer.point3Desc}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox & Action Button */}
                <div className="pt-4 border-t border-gray-100 mt-4 space-y-3 shrink-0">
                  <label className="flex items-start space-x-2.5 cursor-pointer select-none bg-emerald-50/70 hover:bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={isDisclaimerChecked}
                      onChange={(e) => setIsDisclaimerChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] font-bold text-emerald-950 leading-tight">
                      {lang.disclaimer.agreeCheckbox}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleAcceptDisclaimer}
                    disabled={!isDisclaimerChecked}
                    className={`w-full py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 shadow-md ${
                      isDisclaimerChecked
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer hover:shadow-lg active:scale-98"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang.disclaimer.proceedButton}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Farmer Stats Bar */}
                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">FAT%</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-900">{avgFat}%</span>
                  </div>
                  <div className="w-px h-6 bg-emerald-200" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">SNF%</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-900">{avgSnf}%</span>
                  </div>
                  <div className="w-px h-6 bg-emerald-200" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Earnings</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-900">₹{totalEarnings.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-px h-6 bg-emerald-200" />
                  <div className="text-center">
                    <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Deliveries</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-900">{totalCollections}</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === "ai" ? "bg-emerald-100" : "bg-gray-100"
                      }`}>
                        {msg.role === "ai" ? (
                          <Bot className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <User className="w-4 h-4 text-gray-600" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="flex flex-col space-y-1 max-w-[85%]">
                        <div
                          className={`px-4 py-3 rounded-2xl text-xs font-medium ${
                            msg.role === "ai"
                              ? "bg-gray-100 text-gray-800 rounded-tl-sm border border-gray-200/80 shadow-xs"
                              : "bg-emerald-600 text-white rounded-tr-sm shadow-xs"
                          }`}
                        >
                          <FormattedMessage text={msg.text} isAi={msg.role === "ai"} />
                        </div>

                        {msg.role === "ai" && (
                          <div className="flex items-center space-x-2 px-1">
                            <button
                              type="button"
                              onClick={() => speakText(msg.text, msg.id)}
                              className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                                speakingMsgId === msg.id
                                  ? "bg-amber-100 text-amber-900 animate-pulse border border-amber-300"
                                  : "text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title="Listen to this message"
                            >
                              {speakingMsgId === msg.id ? (
                                <>
                                  <Volume2 className="w-3 h-3 text-amber-700" />
                                  <span>{language === "marathi" ? "बोलत आहे..." : language === "hindi" ? "बोल रहा है..." : "Speaking..."}</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span>{language === "marathi" ? "मराठीत ऐका 🔊" : language === "hindi" ? "हिंदी में सुनें 🔊" : "Listen 🔊"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {loading && (
                    <div className="flex items-end space-x-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center space-x-1.5">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-400"
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.7, delay }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Chips */}
                <div className="px-4 py-2 border-t border-gray-100 overflow-x-auto flex space-x-2 shrink-0 no-scrollbar">
                  {lang.chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      disabled={loading}
                      className="shrink-0 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-xl border border-emerald-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="px-4 pb-4 pt-2 shrink-0">
                  <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Listening... Speak now 🎙️" : lang.placeholder}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 text-xs font-medium border rounded-xl focus:outline-none transition-all disabled:opacity-60 placeholder:text-gray-400 ${
                        isListening
                          ? "bg-rose-50 border-rose-300 text-rose-900 animate-pulse font-bold"
                          : "bg-gray-50 border-gray-200 focus:border-emerald-400 focus:bg-white text-gray-900"
                      }`}
                    />

                    {/* 🎙️ Mic Button (Speech-to-Text) */}
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={loading}
                      title={isListening ? "Stop Listening" : "Tap to Speak"}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                        isListening
                          ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
