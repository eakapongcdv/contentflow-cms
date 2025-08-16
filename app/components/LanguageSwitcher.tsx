"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Placement = "bottom-end" | "top-end";
type Props = {
  placement?: Placement;       // header ใช้ "bottom-end", footer ใช้ "top-end"
  size?: number;               // ขนาดปุ่มกลม
  className?: string;
};

const LOCALES = ["th", "en", "cn"] as const;
type Locale = typeof LOCALES[number];

function FlagTH() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full rounded-full" aria-hidden>
      <defs>
        <clipPath id="r"><circle cx="12" cy="12" r="12"/></clipPath>
      </defs>
      <g clipPath="url(#r)">
        <rect width="24" height="24" fill="#ED1C24"/>
        <rect y="6" width="24" height="12" fill="#fff"/>
        <rect y="8" width="24" height="8" fill="#241D4F"/>
      </g>
    </svg>
  );
}
function FlagEN() {
  // ใช้โทนธง UK-style simplified
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full rounded-full" aria-hidden>
      <defs>
        <clipPath id="r2"><circle cx="12" cy="12" r="12"/></clipPath>
      </defs>
      <g clipPath="url(#r2)">
        <rect width="24" height="24" fill="#0A369D"/>
        <path d="M0 10h24v4H0z" fill="#fff"/>
        <path d="M10 0h4v24h-4z" fill="#fff"/>
        <path d="M0 11h24v2H0z" fill="#D7263D"/>
        <path d="M11 0h2v24h-2z" fill="#D7263D"/>
      </g>
    </svg>
  );
}
function FlagCN() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full rounded-full" aria-hidden>
      <defs>
        <clipPath id="r3"><circle cx="12" cy="12" r="12"/></clipPath>
      </defs>
      <g clipPath="url(#r3)">
        <rect width="24" height="24" fill="#DE2910"/>
        <g fill="#FFDE00" transform="translate(4,4)">
          <path d="M4 0l.95 2.9h3.05L5.5 4.7 6.45 7.6 4 5.9 1.55 7.6 2.5 4.7 0 2.9h3.05z"/>
          <circle cx="10.5" cy="1.5" r=".8"/>
          <circle cx="12.5" cy="3.5" r=".7"/>
          <circle cx="12" cy="6.2" r=".7"/>
          <circle cx="10" cy="7.8" r=".7"/>
        </g>
      </g>
    </svg>
  );
}

function currentLocaleFromPath(pathname: string): Locale {
  const seg = pathname.split("?")[0].split("/").filter(Boolean)[0];
  return (LOCALES as readonly string[]).includes(seg) ? (seg as Locale) : "th";
}

function pathWithLocale(pathname: string, next: Locale) {
  const segs = pathname.split("?")[0].split("/").filter(Boolean);
  if (LOCALES.includes(segs[0] as Locale)) segs[0] = next;
  else segs.unshift(next);
  return "/" + segs.join("/");
}

export default function LanguageSwitcher({ placement = "bottom-end", size = 28, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const initial = currentLocaleFromPath(pathname);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current || !btnRef.current) return;
      if (!panelRef.current.contains(e.target as Node) && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const Flag = initial === "th" ? FlagTH : initial === "en" ? FlagEN : FlagCN;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid place-items-center rounded-full border border-white/15 bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        style={{ width: size, height: size }}
        title="Change language"
      >
        <Flag />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          {/* panel */}
          <div
            ref={panelRef}
            className={`absolute z-[70] min-w-[180px] rounded-xl border border-white/10 bg-[#0d0f14]/95 backdrop-blur-xl p-2 shadow-[0_10px_30px_rgba(34,211,238,.25)] ${
              placement === "bottom-end" ? "right-0 top-[calc(100%+8px)]" : "right-0 bottom-[calc(100%+8px)]"
            }`}
          >
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "th", label: "ไทย", Icon: FlagTH },
                { code: "en", label: "English", Icon: FlagEN },
                { code: "cn", label: "中文", Icon: FlagCN },
              ].map(({ code, label, Icon }) => (
                <button
                  key={code}
                  onClick={() => router.push(pathWithLocale(pathname, code as Locale))}
                  className={`flex flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/80 hover:text-white ${
                    currentLocaleFromPath(pathname) === code ? "ring-1 ring-cyan-400/60" : ""
                  }`}
                >
                  <span className="grid place-items-center rounded-full overflow-hidden" style={{ width: 28, height: 28 }}>
                    <Icon />
                  </span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}