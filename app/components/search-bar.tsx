"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import VoiceSearchModal from "@/app/components/voice-search-modal";

export default function SearchBar() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  // read q & lang from current URL
  const sp = useSearchParams();
  const qFromUrl = sp.get("q") ?? "";
  const langFromUrl = (sp.get("lang") ?? "TH").toUpperCase() as "TH" | "EN" | "CN";

  // keep input value in sync when URL changes (e.g., back/forward nav)
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = qFromUrl;
  }, [qFromUrl]);

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
            defaultValue={langFromUrl}
            className="px-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-700"
            title="ภาษาสำหรับการค้นหา"
            aria-label="เลือกภาษา"
          >
            <option value="TH">TH</option>
            <option value="EN">EN</option>
            <option value="CN">CN</option>
          </select>

          {/* Search input (auto-filled from URL) */}
          <input
            ref={inputRef}
            type="text"
            name="q"
            defaultValue={qFromUrl}
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
