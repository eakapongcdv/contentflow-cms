"use client";

import React, { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";
type Msg = { role: Role; content: string };

export default function AiAgent() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [messages, setMessages] = useState<Msg[]>(() => [
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

    // ✅ กำหนดชนิด message ชัดเจน เพื่อกันการกว้างเป็น string
    const userMsg: Msg = { role: "user", content: text };
    const next: Msg[] = [...messages, userMsg];

    setMessages(next);      // <-- OK แล้ว (Msg[])
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const data: { reply?: string; error?: string } = await res.json();

      // ✅ ใส่ assistant ด้วยชนิด Msg ชัดเจน
      const assistantMsg: Msg = {
        role: "assistant",
        content: data.reply ?? "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้ค่ะ",
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      console.error(e);
      const fallback: Msg = {
        role: "assistant",
        content: "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้งค่ะ.",
      };
      setMessages((m) => [...m, fallback]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 rounded-full px-4 py-3 text-sm font-medium text-black bg-emerald-300 hover:bg-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,.45)]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {open ? "ปิดแชต" : "Chat with AI"}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="AI Chat"
          className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[70vh] rounded-2xl border border-white/10 bg-[#0d0f14]/95 backdrop-blur-lg shadow-[0_0_40px_rgba(34,211,238,.25)] flex flex-col"
        >
          <div className="px-4 py-3 border-b border-white/10 text-sm text-white/80">
            🤖 ContentFlow AI Agent
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
    </>
  );
}
