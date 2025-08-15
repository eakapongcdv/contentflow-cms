"use client";

import React, { useEffect, useRef, useState } from "react";

/** โหลดอนุภาคทรงกลมแบบ 3D (ต้องมีไฟล์ ParticleOrb3D.tsx ตามที่ให้ไปก่อนหน้า) */
// const ParticleOrb3D = dynamic(() => import("./ParticleOrb3D"), { ssr: false });
import ParticleOrb2D from "@/app/widgets/ParticleOrb2D";

type MsgRole = "system" | "user" | "assistant";
type Msg = { role: MsgRole; content: string };

export default function AiAgent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "system", content: "You are ContentFlow AI Suite assistant for Thai SMEs & Enterprises." },
    { role: "assistant", content: "สวัสดีค่ะ ฉันคือผู้ช่วย AI ถามฉันเรื่องแพ็กเกจ ฟีเจอร์ หรือเดโมได้เลยนะคะ ✨" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    // ต่อท้ายข้อความผู้ใช้ด้วย type ที่เข้มงวด
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: { reply?: string } = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "ค่ะ" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ.",
        },
      ]);
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* ===== Floating 3D Orb Toggle ===== */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        className="ai-agent-toggle fixed bottom-6 right-6 z-[60] grid place-items-center rounded-full p-0"
        style={{
          width: 60,
          height: 60,
          background: "transparent",
          border: "none",
          outline: "none",
          boxShadow: "0 0 30px rgba(0,255,209,.35)",
        }}
      >
        {/* Aura ที่ไหลเวียนรอบ orb */}
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
        <div className="fixed bottom-2 right-2">
          <ParticleOrb2D size={80} particles={1500} intensity={1.1} />
        </div>
        <span className="sr-only">{open ? "ปิดแชต AI" : "เปิดแชต AI"}</span>
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
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs bg-white/10 hover:bg-white/15 text-white/80"
            >
              ปิด
            </button>
          </div>

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
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                placeholder="พิมพ์คำถาม เช่น แนะนำแพ็กเกจสำหรับทีม 10 คน"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? send() : undefined)}
                disabled={busy}
                aria-label="พิมพ์ข้อความ"
              />
              <button
                onClick={send}
                disabled={busy}
                className="rounded-lg px-3 py-2 text-sm font-medium bg-cyan-400/90 text-black hover:bg-cyan-300 disabled:opacity-50"
              >
                ส่ง
              </button>
            </div>
            <div className="mt-1 text-[11px] text-white/40">
              ขับเคลื่อนโดย OpenAI • ไม่เก็บข้อมูลส่วนตัวโดยไม่ได้รับอนุญาต
            </div>
          </div>
        </div>
      )}

      {/* บังคับ Canvas โปร่งใส + keyframes aura */}
      <style jsx global>{`
        .ai-agent-toggle canvas,
        .ai-orb-canvas canvas {
          background: transparent !important;
          display: block;
        }
        @keyframes aiAura {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.08);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
        }
      `}</style>
    </>
  );
}
