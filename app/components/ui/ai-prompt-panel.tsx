// app/components/ui/ai-prompt-panel.tsx
"use client";

import { Sparkles, Wand2, Bot, Lightbulb } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils"; // ถ้าไม่มี util นี้ ให้ลบ cn() แล้วใช้ className raw ได้

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
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100",
        "shadow-card p-4",
        className
      )}
    >
      {/* header */}
      <div className="flex items-start gap-3">
        <div className="grid place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 h-10 w-10 shadow">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className="chip chip-emerald inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* samples */}
      {(samples.length > 0 || derivedPrompt) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {derivedPrompt && (
            <button
              type="button"
              className="chip bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/40 transition-colors"
              onClick={() => {
                if (onUseDerived) onUseDerived();
                else onChange(derivedPrompt);
              }}
              title="สร้างจากหัวข้อภาษาไทย"
            >
              <Wand2 className="h-3.5 w-3.5" /> ใช้หัวข้อ (TH)
            </button>
          )}
          {samples.map((s) => (
            <button
              key={s.label}
              type="button"
              className="chip bg-gray-700/50 hover:bg-gray-600 text-gray-200 transition-colors"
              onClick={() => onChange(s.prompt)}
              title="เติมตัวอย่าง Prompt"
            >
              <Lightbulb className="h-3.5 w-3.5" /> {s.label}
            </button>
          ))}
        </div>
      )}

      {/* textarea */}
      <div className="mt-3">
        <label className="text-sm font-medium text-gray-300">Prompt</label>
        <textarea
          className="inp mt-1 font-[450] bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500"
          rows={4}
          placeholder='เช่น: "เขียนบทความหัวข้อ ... โทนเป็นกันเอง มีหัวข้อย่อย bullet, เนื้อหาครอบคลุม keyword เหล่านี้ ... สร้าง TH/EN/CN และ SEO ให้ครบ"'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {/* actions */}
      <div className="mt-3 flex items-center justify-end gap-2">
        {onClear && (
          <Button
            variant="outlineZspell"
            onClick={onClear}
            disabled={loading}
            className="bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            Clear
          </Button>
        )}
        <Button
          type="button"
          variant="zspell"
          leftIcon={<Sparkles className="h-4 w-4" />}
          onClick={onGenerate}
          loading={loading}
          title="AI Content Generation"
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {loading ? "Generating…" : "Generate with AI"}
        </Button>
      </div>

      {/* bg sparkle */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl"
      />
    </section>
  );
}
