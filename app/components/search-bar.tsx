"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import VoiceSearchModal from "@/app/components/voice-search-modal";

type Lang = "TH" | "EN" | "CN";

type SearchBarProps = {
  /** ค่าเริ่มต้นของคำค้น (เช่น ส่งมาจาก server) */
  defaultQuery?: string;
  /** ค่าเริ่มต้นของภาษา (ถ้าไม่ส่ง จะอ่านจาก URL lang) */
  defaultLang?: Lang;
};

export default function SearchBar({ defaultQuery, defaultLang }: SearchBarProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // อ่าน q/lang ปัจจุบันจาก URL (ฝั่ง client)
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const langFromUrl = (sp.get("lang") ?? "TH").toUpperCase() as Lang;

  // ใช้ค่าที่มากับ props ก่อน ถ้าไม่มีก็ใช้ของ URL
  const effectiveQ = (defaultQuery ?? qFromUrl) as string;
  const effectiveLang = (defaultLang ?? langFromUrl) as Lang;

  // sync ค่า input หาก URL หรือ prop defaultQuery เปลี่ยน
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = effectiveQ;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qFromUrl, defaultQuery]);

  const handleVoiceResult = (text: string) => {
    if (inputRef.current) inputRef.current.value = text;
    formRef.current?.requestSubmit();
  };

  return (
    <>
      <form action="/" method="GET" ref={formRef} className="relative mx-auto max-w-2xl">
        <div className="flex items-stretch gap-2">
          {/* Lang flag selector (TH/EN/CN) */}
          <select
            name="lang"
            defaultValue={effectiveLang}
            className="px-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-700"
            title="ภาษาสำหรับการค้นหา"
            aria-label="เลือกภาษา"
          >
            <option value="TH">TH</option>
            <option value="EN">EN</option>
            <option value="CN">CN</option>
          </select>

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            name="q"
            defaultValue={effectiveQ}
            placeholder="พิมพ์หรือพูดสิ่งที่อยากหา…"
            className="flex-1 inp text-base md:text-lg"
            autoComplete="off"
            enterKeyHint="search"
            aria-label="ช่องค้นหา"
          />

          {/* ปุ่มเสียง → เปิดโมดัล */}
          <button
            id="voice-btn"
            type="button"
            onClick={() => setVoiceOpen(true)}
            className="btn bg-gray-100 hover:bg-gray-200"
            title="ค้นหาด้วยเสียง"
            aria-label="ค้นหาด้วยเสียง"
          >
            <MicIcon />
          </button>

          <button type="submit" className="btn btn-zpell">ค้นหา</button>
        </div>
      </form>

      {/* Voice Modal */}
      <VoiceSearchModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={handleVoiceResult}
        lang={effectiveLang}  /* ✅ ส่ง prop ที่จำเป็นให้โมดัล */
      />
    </>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/>
    </svg>
  );
}
