// app/components/ui/ai-prompt-panel.tsx
"use client";

import React from "react";
import { Sparkles, Wand2, Bot, Lightbulb, Mic, Square, Eraser } from "lucide-react";
import { Button, IconButton } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils"; // ถ้าไม่มี util นี้ ให้ลบ cn() แล้วใช้ className raw ได้

function ChipButton({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={props.type ?? "button"}
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 border text-sm",
        "bg-white/5 border-white/12 text-white/80 hover:bg-white/10 hover:text-white",
        "shadow-[0_0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_12px_rgba(59,130,246,.25)]",
        "whitespace-nowrap",
        className
      )}
    >
      {children}
    </button>
  );
}

type Sample = { label: string; prompt: string };

export function AiPromptPanel({
  title = "AI Generation",
  subtitle = "พิมพ์คำสั่งเพื่อให้ระบบช่วยสร้างบทความหลายภาษา (TH/EN/CN) และ SEO ให้ครบอัตโนมัติ",
  value,
  onChange,
  onGenerate,
  onClear,
  loading,
  samples = [],
  derivedPrompt,
  onUseDerived,
  className,
}: {
  title?: string;
  subtitle?: string;
  value: string;
  onChange: (v: string) => void;
  onGenerate: () => void;
  onClear?: () => void;
  loading?: boolean;
  samples?: Sample[];
  derivedPrompt?: string;          // auto-derive จาก title (TH) หรืออย่างอื่น
  onUseDerived?: () => void;       // ถ้าอยากจัดการเองเมื่อกดปุ่ม Use title
  className?: string;
}) {
  const [isRecording, setIsRecording] = React.useState(false);
  const recRef = React.useRef<any>(null);
  const areaRef = React.useRef<HTMLTextAreaElement | null>(null);

  function startVoice() {
    if (isRecording) return;
    const SR: any = (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;
    if (!SR) {
      alert("This browser doesn't support Speech Recognition");
      return;
    }
    const rec = new SR();
    rec.lang = "th-TH"; // default TH; browser may fallback. You can change dynamically if needed.
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results)
        .map((r: any) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      if (txt) {
        // append with a space
        onChange(value ? value + (value.endsWith(" ") ? "" : " ") + txt : txt);
      }
    };
    rec.onerror = () => {
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    try {
      rec.start();
      recRef.current = rec;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  }

  function stopVoice() {
    try {
      recRef.current?.stop?.();
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#0b0f16] text-white shadow-card",
        "p-4",
        className
      )}
    >
      {/* Header: title + subtitle + chips on one block (left), actions on right */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Left: Title & subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="grid place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 h-10 w-10 shadow">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold truncate">{title}</h3>
                <span className="chip bg-white/5 hover:bg-white/10 text-white/80 inline-flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> AI
                </span>
              </div>
              <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>

              {/* Chips row: single line, horizontal scroll if overflow */}
              {(samples.length > 0 || derivedPrompt) && (
                <div className="mt-2 -ml-1 overflow-x-auto">
                  <div className="flex items-center gap-2 whitespace-nowrap px-1">
                    {derivedPrompt && (
                      <ChipButton
                        onClick={() => {
                          if (onUseDerived) onUseDerived();
                          else onChange(derivedPrompt);
                        }}
                        title="สร้างจากหัวข้อภาษาไทย"
                      >
                        <Wand2 className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[18ch] md:max-w-none">ใช้หัวข้อ (TH)</span>
                      </ChipButton>
                    )}
                    {samples.map((s) => (
                      <ChipButton
                        key={s.label}
                        onClick={() => onChange(s.prompt)}
                        title="เติมตัวอย่าง Prompt"
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[24ch] md:max-w-none">{s.label}</span>
                      </ChipButton>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 md:ml-auto">
          {onClear && (
            <IconButton
              variant="outlineZspell"
              onClick={onClear}
              disabled={loading}
              aria-label="Clear"
              className="bg-[#1a1f2e] text-gray-300 hover:bg-[#232a3a] rounded-xl"
            >
              <Eraser className="h-4 w-4" />
            </IconButton>
          )}
          <ChipButton
            onClick={onGenerate}
            title="AI Content Generation"
            disabled={loading}
            className="border-emerald-400/60 text-emerald-300 hover:text-white hover:shadow-[0_0_16px_rgba(16,185,129,.35)]"
          >
            <Sparkles className="h-4 w-4" />
            <span className="truncate">{loading ? "Generating…" : "Generate with AI"}</span>
          </ChipButton>
        </div>
      </div>

      {/* Textarea */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-white/70">Prompt</label>
          <div className="flex items-center gap-2">
            <div className="text-xs text-white/50">Tip: กด Voice เพื่อพูด Prompt แทนการพิมพ์</div>
            {!isRecording ? (
              <IconButton
                onClick={startVoice}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/80"
                title="Voice input"
              >
                <Mic className="h-4 w-4" />
              </IconButton>
            ) : (
              <IconButton
                onClick={stopVoice}
                className="bg-red-500/15 hover:bg-red-500/20 border border-red-500/30 text-red-300"
                title="Stop recording"
              >
                <Square className="h-4 w-4" />
              </IconButton>
            )}
            
          </div>
        </div>
        <textarea
          ref={areaRef}
          className={cn(
            "mt-1 font-[450] bg-[#0f141d] border border-white/10 text-white placeholder-white/40 rounded-xl w-full",
            "h-20"
          )}
          placeholder='เช่น: "เขียนบทความหัวข้อ ... โทนเป็นกันเอง มีหัวข้อย่อย bullet, เนื้อหาครอบคลุม keyword เหล่านี้ ... สร้าง TH/EN/CN และ SEO ให้ครบ"'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </section>
  );
}
