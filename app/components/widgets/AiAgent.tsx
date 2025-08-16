// REPLACED CONTENT
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ParticleOrb2D from "@/app/components/widgets/ParticleOrb2D";

// ---- Conversation mode (Speech Synthesis / Recognition) types ----
declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

/** ---------------- Types ---------------- */
type MsgRole = "system" | "user" | "assistant";
type Msg = { role: MsgRole; content: string };

type Chip = { label: string; href: string };
type SeedPayload = {
  initialMessage?: string;
  chips?: Chip[];
  lang?: "th" | "en" | "zh";
};

type AgentResponse = {
  reply?: string;
  chips?: Chip[];
  /** optional from API: quick links/anchors */
  links?: string[];
};

/** ---------------- Storage Keys ---------------- */
const STORAGE_PREFIX = "cf.aiagent.v1";
function historyKey(lang: "th" | "en" | "zh") {
  return `${STORAGE_PREFIX}.history.${lang}`;
}
const HIGHLIGHT_KEY = `${STORAGE_PREFIX}.highlightTarget`;
const MAX_HISTORY = 50;

const OPEN_KEY = `${STORAGE_PREFIX}.open`;
const TTS_KEY = `${STORAGE_PREFIX}.ttsOn`;
const STT_HINT_KEY = `${STORAGE_PREFIX}.sttSupported`;

function initialMessages(lang: "th" | "en" | "zh"): Msg[] {
  return [
    { role: "system", content: "You are ContentFlow AI Suite assistant for Thai SMEs & Enterprises." },
    { role: "assistant", content: greeting(lang) },
  ];
}

function ideaPrompts(lang: "th" | "en" | "zh"): string[] {
  switch (lang) {
    case "en":
      return [
        "Recommend a plan for a 10-person team",
        "Do you support AWS/Azure/Alibaba Cloud?",
        "How does PDPA & consent work here?",
        "Show feature highlights",
        "Any e‑commerce integrations?",
        "Can I see Thai/EN/CN localization?",
      ];
    case "zh":
      return [
        "10人团队适合哪种方案？",
        "是否支持 AWS/Azure/阿里云？",
        "PDPA 与同意管理如何实现？",
        "展示功能亮点",
        "有电商/社媒集成吗？",
        "支持中英泰多语言吗？",
      ];
    default:
      return [
        "แนะนำแพ็กเกจสำหรับทีม 10 คน",
        "รองรับ AWS/Azure/Alibaba Cloud ไหม",
        "ระบบ PDPA & Consent ทำงานอย่างไร",
        "ขอดูฟีเจอร์เด่น",
        "ต่อ Shopee/Lazada/Facebook ได้ไหม",
        "มีแปล ไทย/อังกฤษ/จีน อัตโนมัติไหม",
      ];
  }
}

/** ---------------- Helpers ---------------- */
function getDocLang(): "th" | "en" | "zh" {
  if (typeof document === "undefined") return "th";
  const l = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  if (l.startsWith("en")) return "en";
  if (l.startsWith("zh") || l.startsWith("cn")) return "zh";
  return "th";
}

function langPrefix(lang: "th" | "en" | "zh") {
  return `/${lang}`;
}

function greeting(lang: "th" | "en" | "zh") {
  switch (lang) {
    case "en":
      return "Hi! I’m your ContentFlow AI assistant. Ask me about features, pricing, or a live demo. ✨";
    case "zh":
      return "你好！我是 ContentFlow AI 助手。欢迎咨询功能、价格或预约演示。✨";
    default:
      return "สวัสดีค่ะ ฉันคือผู้ช่วย AI ของ ContentFlow ถามเรื่องฟีเจอร์ ราคา หรือขอดูเดโมได้เลยค่ะ ✨";
  }
}

function defaultChips(lang: "th" | "en" | "zh"): Chip[] {
  switch (lang) {
    case "en":
      return [
        { label: "Feature Highlights", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Cloud", href: "#cloud" },
        { label: "Security", href: "#security" },
      ];
    case "zh":
      return [
        { label: "功能亮点", href: "#features" },
        { label: "价格", href: "#pricing" },
        { label: "云部署", href: "#cloud" },
        { label: "安全与合规", href: "#security" },
      ];
    default:
      return [
        { label: "ฟีเจอร์เด่น", href: "#features" },
        { label: "ราคา", href: "#pricing" },
        { label: "คลาวด์", href: "#cloud" },
        { label: "ความปลอดภัย", href: "#security" },
      ];
  }
}

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("/") || href.startsWith("mailto:") || href.startsWith("tel:");
}

/** Try to focus+highlight an element by id/selector; return true if success */
function focusHighlightById(id: string, headerOffset = 90): boolean {
  const el =
    document.getElementById(id) ||
    document.querySelector<HTMLElement>(`#${CSS.escape(id)}`) ||
    document.querySelector<HTMLElement>(`[data-anchor="${CSS.escape(id)}"]`);
  if (!el) return false;

  const rect = el.getBoundingClientRect();
  const top = rect.top + window.scrollY - headerOffset;
  window.scrollTo({ top, behavior: "smooth" });

  el.classList.add("cf-focus-ring");
  el.setAttribute("data-cf-highlighted", "1");
  window.setTimeout(() => {
    el.classList.remove("cf-focus-ring");
    el.removeAttribute("data-cf-highlighted");
  }, 2800);

  return true;
}

/** Smooth scroll + temporary highlight ring on target section (same-page) */
function navigateAndHighlightSamePage(href: string) {
  try {
    const id = href.replace(/^#/, "");
    focusHighlightById(id);
  } catch {
    /* noop */
  }
}

/** Decide where a chip should point to (validate anchor on current page; otherwise send to home with lang prefix) */
function resolveChipHref(href: string, lang: "th" | "en" | "zh"): string {
  try {
    if (isExternalHref(href)) return href;

    // Only an in-page anchor (e.g., "#pricing")
    const id = href.replace(/^#/, "");
    const existsHere =
      document.getElementById(id) ||
      document.querySelector<HTMLElement>(href) ||
      document.querySelector<HTMLElement>(`[data-anchor="${id}"]`);

    if (existsHere) return href;

    // not found on this page -> send to language home with the same anchor
    return `${langPrefix(lang)}${href}`;
  } catch {
    return href;
  }
}

/** If navigating cross-page with hash, stash the hash to re-highlight after navigation */
function navigateSmart(href: string, lang: "th" | "en" | "zh") {
  const resolved = resolveChipHref(href, lang);

  // on the same page with #...
  if (resolved.startsWith("#")) {
    navigateAndHighlightSamePage(resolved);
    return;
  }

  // cross-page and contains hash -> stash for post-navigation highlight
  if (resolved.includes("#")) {
    try {
      const id = resolved.split("#")[1] || "";
      if (id) sessionStorage.setItem(HIGHLIGHT_KEY, id);
    } catch {
      /* ignore */
    }
  }
  window.location.assign(resolved);
}

/** Heuristic chips when API not returning chips */
function suggestChipsByContent(content: string, lang: "th" | "en" | "zh"): Chip[] {
  const text = content.toLowerCase();

  const L = {
    features: lang === "en" ? "Feature Highlights" : lang === "zh" ? "功能亮点" : "ฟีเจอร์เด่น",
    pricing: lang === "en" ? "Pricing" : lang === "zh" ? "价格" : "ราคา",
    cloud: lang === "en" ? "Cloud" : lang === "zh" ? "云部署" : "คลาวด์",
    security: lang === "en" ? "Security" : lang === "zh" ? "安全与合规" : "ความปลอดภัย",
    demo: lang === "en" ? "Book a demo" : lang === "zh" ? "预约演示" : "ขอดูเดโม",
    contact: lang === "en" ? "Contact us" : lang === "zh" ? "联系我们" : "ติดต่อเรา",
  };

  const out: Chip[] = [];

  if (/(price|pricing|แพ็กเกจ|ราคา|費用|价格)/i.test(text)) out.push({ href: "#pricing", label: L.pricing });
  if (/(feature|ฟีเจอร์|功能|highlights)/i.test(text)) out.push({ href: "#features", label: L.features });
  if (/(cloud|aws|azure|alibaba|คลาวด์|上云|部署)/i.test(text)) out.push({ href: "#cloud", label: L.cloud });
  if (/(security|pdpa|consent|iso|ความปลอดภัย|安全|合规)/i.test(text)) out.push({ href: "#security", label: L.security });
  if (/(demo|เดโม|试用|演示)/i.test(text))
    out.push({
      href: "mailto:sales@codediva.co.th?subject=Request%20a%20demo%20(ContentFlow%20AI%20Suite)",
      label: L.demo,
    });
  if (/(contact|ติดต่อ|聯繫|联系)/i.test(text)) out.push({ href: "/contact", label: L.contact });

  // unique by href
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.href) ? false : (seen.add(c.href), true)));
}

/** Normalize arbitrary link array from API -> chips with localized labels */
function normalizeApiLinks(links: string[] | undefined, lang: "th" | "en" | "zh"): Chip[] {
  if (!links || links.length === 0) return [];
  const L = {
    features: lang === "en" ? "Feature Highlights" : lang === "zh" ? "功能亮点" : "ฟีเจอร์เด่น",
    pricing: lang === "en" ? "Pricing" : lang === "zh" ? "价格" : "ราคา",
    cloud: lang === "en" ? "Cloud" : lang === "zh" ? "云部署" : "คลาวด์",
    security: lang === "en" ? "Security" : lang === "zh" ? "安全与合规" : "ความปลอดภัย",
    learn: lang === "en" ? "Learn more" : lang === "zh" ? "了解更多" : "อ่านเพิ่มเติม",
  };
  return links.map((href) => {
    const lower = href.toLowerCase();
    let label = L.learn;
    if (lower.includes("#pricing")) label = L.pricing;
    else if (lower.includes("#features")) label = L.features;
    else if (lower.includes("#cloud")) label = L.cloud;
    else if (lower.includes("#security")) label = L.security;
    return { href, label };
  });
}

/** Filter/sanitize chips to ensure valid anchors or redirect to home with lang */
function sanitizeChips(chips: Chip[], lang: "th" | "en" | "zh"): Chip[] {
  const seen = new Set<string>();
  return chips
    .map((c) => ({ ...c, href: resolveChipHref(c.href, lang) }))
    .filter((c) => (seen.has(c.href) ? false : (seen.add(c.href), true)));
}

/** ---------------- Voice helpers (TTS) ---------------- */
function pickVoiceForLang(lang: "th" | "en" | "zh"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const want = lang === "en" ? ["en-US", "en-GB"] : lang === "zh" ? ["zh-CN", "zh-HK", "zh-TW"] : ["th-TH"];
  const voices = window.speechSynthesis.getVoices();
  const best = voices.find(v => want.some(code => (v.lang || "").toLowerCase().startsWith(code.toLowerCase())));
  return best || voices.find(v => (v.lang || "").toLowerCase().startsWith((lang === "zh" ? "zh" : lang)));
}

function speakText(text: string, lang: "th" | "en" | "zh", vol = 1) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!text) return;
  window.speechSynthesis.cancel();
  const chunks: string[] = [];
  const max = 220;
  for (let i = 0; i < text.length; i += max) chunks.push(text.slice(i, i + max));
  const voice = pickVoiceForLang(lang);
  chunks.forEach((chunk, idx) => {
    const ut = new SpeechSynthesisUtterance(chunk);
    ut.rate = 1;
    ut.pitch = 1;
    ut.volume = vol;
    if (voice) ut.voice = voice;
    if (lang === "zh") ut.lang = "zh-CN";
    if (lang === "th") ut.lang = "th-TH";
    if (lang === "en") ut.lang = "en-US";
    if (idx === 0) window.speechSynthesis.cancel(); // ensure clean start
    window.speechSynthesis.speak(ut);
  });
}

/** ---------------- Speech-to-Text helpers (STT) ---------------- */
function getSpeechRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SR ? SR : null;
}

/** ---------------- Component ---------------- */
export default function AiAgent() {
  const lang = getDocLang();
  // TTS toggle (persist)
  const [ttsOn, setTtsOn] = useState<boolean>(() => {
    try { return (localStorage.getItem(TTS_KEY) ?? "1") !== "0"; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem(TTS_KEY, ttsOn ? "1" : "0"); } catch {}
  }, [ttsOn]);

  // STT (mic) state
  const [listening, setListening] = useState(false);
  const [sttSupported, setSttSupported] = useState<boolean>(false);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = getSpeechRecognition();
    const ok = !!SR;
    setSttSupported(ok);
    try { localStorage.setItem(STT_HINT_KEY, ok ? "1" : "0"); } catch {}
  }, []);
  const [open, setOpen] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(OPEN_KEY);
      if (v === null) return true; // first visit -> open by default
      return v === "1" || v === "true";
    } catch {
      return true;
    }
  });
  const [busy, setBusy] = useState(false);

  /** default quick chips (always visible) */
  const [chips, setChips] = useState<Chip[]>(() => defaultChips(lang));

  /** dynamic chips suggested per assistant reply */
  const [replyChips, setReplyChips] = useState<Chip[]>([]);

  /** messages with persistence */
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(historyKey(lang));
        if (raw) {
          const arr = JSON.parse(raw) as Msg[];
          if (Array.isArray(arr) && arr.length > 0) return arr;
        }
      } catch {
        /* ignore */
      }
    }
    return initialMessages(lang);
  });

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [open]);

  /** auto-scroll on updates */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  /** persist messages to localStorage */
  useEffect(() => {
    try {
      // keep last N messages to avoid bloating
      const trimmed =
        messages.length > MAX_HISTORY ? messages.slice(messages.length - MAX_HISTORY) : messages;
      localStorage.setItem(historyKey(lang), JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }, [messages, lang]);

  // Auto read assistant reply when finished
  const lastSpokenIndex = useRef<number>(-1);
  useEffect(() => {
    if (!ttsOn || busy) return;
    const idx = messages.length - 1;
    if (idx <= lastSpokenIndex.current) return;
    const last = messages[idx];
    if (last?.role === "assistant") {
      speakText(last.content, lang);
      lastSpokenIndex.current = idx;
    }
  }, [messages, busy, lang, ttsOn]);
  function startListening() {
    const SR = getSpeechRecognition();
    if (!SR || listening) return;
    const rec = new SR();
    rec.lang = lang === "en" ? "en-US" : lang === "zh" ? "zh-CN" : "th-TH";
    rec.interimResults = true;
    rec.continuous = false;

    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += tr;
        else interim += tr;
      }
      if (interim) setInput(interim);
    };
    rec.onerror = () => { setListening(false); };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) {
        setInput(finalText.trim());
        // small delay to show the text in input then send
        setTimeout(() => send(finalText.trim()), 80);
      }
    };

    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  function stopListening() {
    try { recRef.current?.stop?.(); } catch {}
    setListening(false);
  }

  function toggleMic() {
    if (!sttSupported || busy) return;
    listening ? stopListening() : startListening();
  }

  /** listen for seeding from pages (chips/initialMessage) */
  useEffect(() => {
    const onSeed = (ev: Event) => {
      const detail = (ev as CustomEvent<SeedPayload>).detail || {};
      if (detail.lang) {
        setChips(defaultChips(detail.lang));
      }
      if (detail.chips && Array.isArray(detail.chips) && detail.chips.length > 0) {
        setChips(detail.chips);
      }
      if (detail.initialMessage) {
        setMessages((m) => {
          const last = m[m.length - 1];
          if (last?.role === "assistant" && last.content === detail.initialMessage) return m;
          return [...m, { role: "assistant", content: detail.initialMessage! }];
        });
      }
    };
    window.addEventListener("cf:aiagent:seed" as any, onSeed as any);
    return () => window.removeEventListener("cf:aiagent:seed" as any, onSeed as any);
  }, []);

  /** On mount after navigation: if we stashed a hash to highlight, try it */
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(HIGHLIGHT_KEY);
      const urlHash = (window.location.hash || "").replace(/^#/, "");
      const target = pending || urlHash || "";
      if (!target) return;

      let attempts = 0;
      const tryFocus = () => {
        attempts++;
        const ok = focusHighlightById(target);
        if (ok || attempts > 30) {
          clearInterval(timer);
          sessionStorage.removeItem(HIGHLIGHT_KEY);
        }
      };
      // Try immediately, then retry a few times while the page renders
      const timer = window.setInterval(tryFocus, 120);
      tryFocus();
      return () => clearInterval(timer);
    } catch {
      /* ignore */
    }
  }, []);

  /** send message to backend */
  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text) return;

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    if (!override) setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const data: AgentResponse = await res.json();
      const reply = data.reply || (lang === "en" ? "Okay." : lang === "zh" ? "好的。" : "ค่ะ");

      setMessages((m) => [...m, { role: "assistant", content: reply }]);

      // 1) Use chips from API if provided
      let suggested: Chip[] = [];
      if (Array.isArray(data.chips) && data.chips.length > 0) {
        suggested = data.chips;
      } else if (Array.isArray(data.links) && data.links.length > 0) {
        suggested = normalizeApiLinks(data.links, lang);
      } else {
        // 2) Otherwise, infer from reply content
        suggested = suggestChipsByContent(reply, lang);
      }
      setReplyChips(sanitizeChips(suggested, lang).slice(0, 6)); // cap to 6 chips and sanitize
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            lang === "en"
              ? "Sorry, I can’t respond right now. Please try again."
              : lang === "zh"
              ? "抱歉，当前无法回复，请稍后再试。"
              : "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ.",
        },
      ]);
      setReplyChips([]);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  /** handle chip click */
  function onChipClick(href: string) {
    navigateSmart(href, lang);
  }

  /** placeholder text by lang */
  const placeholder = useMemo(() => {
    switch (lang) {
      case "en":
        return "Ask e.g. Recommend a plan for 10 people";
      case "zh":
        return "例如：10人团队适合哪个方案？";
      default:
        return "พิมพ์คำถาม เช่น แนะนำแพ็กเกจสำหรับทีม 10 คน";
    }
  }, [lang]);

  const closeLabel = lang === "en" ? "Close" : lang === "zh" ? "关闭" : "ปิด";
  const sendLabel = lang === "en" ? "Send" : lang === "zh" ? "发送" : "ส่ง";
  const suggestedLabel = lang === "en" ? "Suggested" : lang === "zh" ? "推荐" : "แนะนำเพิ่มเติม";

  function clearLog() {
    const base = initialMessages(lang);
    setMessages(base);
    setReplyChips([]);
    try {
      localStorage.setItem(historyKey(lang), JSON.stringify(base));
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      {/* ===== Floating Orb Toggle ===== */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        className="ai-agent-toggle fixed bottom-6 right-6 z-[60] grid place-items-center rounded-full p-0"
        style={{
          width: 74,
          height: 74,
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "0 0 30px rgba(0,255,209,.35)",
        }}
      >
        {/* soft aura */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            filter: "blur(18px)",
            background:
              "radial-gradient(circle at 50% 55%, rgba(0,255,209,.35), rgba(255,0,171,.18) 55%, rgba(0,0,0,0) 70%)",
            animation: "aiAura 3.5s ease-in-out infinite",
          }}
        />
        <ParticleOrb2D size={10} particles={1500} intensity={1.1} />
        <span className="sr-only">
          {open
            ? lang === "en"
              ? "Close chat"
              : lang === "zh"
              ? "关闭聊天"
              : "ปิดแชต AI"
            : lang === "en"
            ? "Open chat"
            : lang === "zh"
            ? "打开聊天"
            : "เปิดแชต AI"}
        </span>
      </button>

      {/* ===== Chat Panel ===== */}
      {open && (
        <div
          role="dialog"
          aria-label="AI Chat"
          className="fixed bottom-24 right-6 z-[55] w-[360px] max-h-[72vh] rounded-2xl border border-white/10 bg-[#0d0f14]/95 backdrop-blur-lg shadow-[0_0_40px_rgba(34,211,238,.25)] flex flex-col"
        >
          <div className="px-4 py-3 border-b border-white/10 text-sm text-white/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)]" />
              ContentFlow AI Agent
            </div>
            <div className="flex items-center gap-1.5">
              {/* TTS toggle */}
              <button
                onClick={() => {
                  if (!("speechSynthesis" in window)) return alert(lang === "en" ? "Speech output not supported in this browser." : lang === "zh" ? "当前浏览器不支持语音播放。" : "เบราว์เซอร์ไม่รองรับการอ่านออกเสียง");
                  setTtsOn(v => !v);
                }}
                title={ttsOn ? (lang === "en" ? "Voice: On" : lang === "zh" ? "语音：开" : "เสียง: เปิด")
                             : (lang === "en" ? "Voice: Off" : lang === "zh" ? "语音：关" : "เสียง: ปิด")}
                className={`rounded-md p-1.5 ${ttsOn ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-white/80"} hover:bg-white/15`}
                aria-label="Toggle voice"
              >
                {/* speaker icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M3 10v4h4l5 5V5L7 10H3zM14 12c0-1.7 1-3.2 2.5-3.8v7.6A4.2 4.2 0 0 1 14 12zm2.5-7v2a7 7 0 0 1 0 10v2a9 9 0 0 0 0-14z"/>
                </svg>
              </button>

              <button
                onClick={clearLog}
                title="Clear chat"
                className="rounded-md p-1.5 bg-white/10 hover:bg-white/15 text-white/80"
                aria-label="Clear chat history"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M3 6h18v2H3zM8 8h8l-1 11H9L8 8zm1-4h6l1 2H8l1-2z"/>
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                title={closeLabel}
                className="rounded-md p-1.5 bg-white/10 hover:bg-white/15 text-white/80"
                aria-label={closeLabel}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M18.3 5.71 12 12l-6.3-6.29-1.41 1.41L10.6 13.4l-6.3 6.3 1.41 1.41L12 14.83l6.29 6.28 1.41-1.41-6.3-6.3 6.3-6.29z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Default Quick Chips */}
          {chips.length > 0 && (
            <div className="px-3 pt-3 pb-0">
              <div className="flex flex-wrap gap-2">
                {sanitizeChips(chips, lang).map((c, i) => (
                  <button
                    key={`${c.href}-${i}`}
                    onClick={() => onChipClick(c.href)}
                    className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20 hover:border-cyan-300/50"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto px-3 py-3 space-y-2 text-[13px]">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-xl ${
                    m.role === "user"
                      ? "ml-auto bg-emerald-400/20 text-emerald-100"
                      : "bg-white/5 text-white/90"
                  }`}
                >
                  {m.content}
                </div>
              ))}

            {/* Contextual suggested chips (per reply) */}
            {replyChips.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] text-white/50 mb-1">{suggestedLabel}</div>
                <div className="flex flex-wrap gap-2">
                  {replyChips.map((c, i) => (
                    <button
                      key={`reply-${c.href}-${i}`}
                      onClick={() => onChipClick(c.href)}
                      className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 hover:bg-emerald-400/20 hover:border-emerald-300/50"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div className="max-w-[70%] bg-white/5 text-white/90 rounded-xl px-3 py-2 inline-flex items-center gap-2">
                <span className="ai-dots"><span></span><span></span><span></span></span>
                <span className="text-white/70 text-xs">Thinking…</span>
              </div>
            )}
            {listening && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-100 text-xs">
                <span className="mic-dot"></span>
                {lang === "en" ? "Listening…" : lang === "zh" ? "正在聆听…" : "กำลังฟัง…"}
              </div>
            )}
            {!busy && (
              <div className="pt-2">
                <div className="text-[11px] text-white/50 mb-1">
                  {lang === "en" ? "Try asking" : lang === "zh" ? "可以试着问" : "ลองถามดู"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {ideaPrompts(lang).map((q, i) => (
                    <button
                      key={`idea-${i}`}
                      onClick={() => send(q)}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
                disabled={busy || listening}
                aria-label={placeholder}
              />
              <button
                onClick={toggleMic}
                disabled={busy || !sttSupported}
                title={sttSupported ? (listening
                  ? (lang === "en" ? "Stop listening" : lang === "zh" ? "停止聆听" : "หยุดฟัง")
                  : (lang === "en" ? "Speak" : lang === "zh" ? "语音输入" : "พูด"))
                  : (lang === "en" ? "Mic not supported" : lang === "zh" ? "不支持麦克风识别" : "เบราว์เซอร์ไม่รองรับไมค์")}
                className={`rounded-lg px-3 py-2 text-sm font-medium inline-flex items-center gap-1
                  ${listening ? "bg-rose-500/80 text-white ai-mic-pulse" : "bg-white/10 text-white hover:bg-white/15"}
                  ${(!sttSupported || busy) ? "opacity-50 cursor-not-allowed" : ""}`}
                aria-pressed={listening}
              >
                {/* mic icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V20H8v2h8v-2h-3v-2.08A7 7 0 0 0 19 11h-2z"/>
                </svg>
                <span>{listening ? (lang === "en" ? "Stop" : lang === "zh" ? "停止" : "หยุด") : (lang === "en" ? "Speak" : lang === "zh" ? "语音" : "พูด")}</span>
              </button>
              <button
                onClick={send}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-sm font-medium bg-cyan-400/90 text-black hover:bg-cyan-300 disabled:opacity-50 inline-flex items-center gap-1"
              >
                {busy ? (
                  <>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" className="opacity-25" />
                      <path d="M21 12a9 9 0 0 1-9 9" className="opacity-75" />
                    </svg>
                    <span>{sendLabel}</span>
                  </>
                ) : (
                  <>
                    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    <span>{sendLabel}</span>
                  </>
                )}
              </button>
            </div>
            <div className="mt-1 text-[11px] text-white/40">
              OpenAI powered • We won’t store personal data without consent.
            </div>
          </div>
        </div>
      )}

      {/* Global styles for orb and highlight ring */}
      <style jsx global>{`
        .ai-agent-toggle canvas,
        .ai-orb-canvas canvas {
          background: transparent !important;
          display: block;
        }
        @keyframes aiAura {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .cf-focus-ring {
          outline: 2px solid rgba(103, 232, 249, 0.9);
          box-shadow:
            0 0 0 4px rgba(103, 232, 249, 0.18),
            0 0 0 10px rgba(103, 232, 249, 0.08),
            0 8px 32px rgba(34, 211, 238, 0.25);
          border-radius: 12px;
          animation: cfPulse 1200ms ease-in-out 0s 2;
        }
        @keyframes cfPulse {
          0% { box-shadow: 0 0 0 2px rgba(103,232,249,.14), 0 0 0 10px rgba(103,232,249,.06); }
          50% { box-shadow: 0 0 0 4px rgba(103,232,249,.30), 0 0 0 14px rgba(103,232,249,.12); }
          100% { box-shadow: 0 0 0 2px rgba(103,232,249,.14), 0 0 0 10px rgba(103,232,249,.06); }
        }
        .ai-dots { display: inline-flex; gap: 6px; align-items: center; }
        .ai-dots span { width: 6px; height: 6px; border-radius: 9999px; background: rgba(255,255,255,.85); display: inline-block; animation: aiDot 1.2s ease-in-out infinite; }
        .ai-dots span:nth-child(2){ animation-delay: .15s; }
        .ai-dots span:nth-child(3){ animation-delay: .30s; }
        @keyframes aiDot {
          0%, 80%, 100% { transform: translateY(0); opacity: .35; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        .mic-dot { width:8px; height:8px; border-radius:9999px; background:#fca5a5; box-shadow:0 0 0 4px rgba(244,63,94,.2); }
        .ai-mic-pulse { animation: aiMic 1.1s ease-in-out infinite; }
        @keyframes aiMic {
          0% { box-shadow: 0 0 0 0 rgba(244,63,94,.45); transform: translateZ(0); }
          70% { box-shadow: 0 0 0 10px rgba(244,63,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(244,63,94,0); }
        }
      `}</style>
    </>
  );
}