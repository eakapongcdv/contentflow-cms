"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useWebsite } from "./website-provider";

/* -------------------- Lang Picker -------------------- */
function LangPicker({ lang, toLangPath }: { lang: "th" | "en" | "zh"; toLangPath: (l: string) => string }) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  React.useEffect(() => {
    function updatePos() {
      if (!open || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const width = 144; // w-36
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.right - width));
      const top = Math.min(window.innerHeight - 8, r.bottom + 8);
      setPos({ top, left, width });
    }
    updatePos();
    if (!open) return;
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  const flags: { code: "th" | "en" | "zh"; label: string; emoji: string }[] = [
    { code: "th", label: "ไทย", emoji: "🇹🇭" },
    { code: "en", label: "English", emoji: "🇺🇸" },
    { code: "zh", label: "中文", emoji: "🇨🇳" },
  ];

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2 py-1 text-xs text-white/80 hover:text-white"
        title="Change language"
      >
        <span className="text-base leading-none">{flags.find((f) => f.code === lang)?.emoji}</span>
        <span className="hidden sm:inline">{lang.toUpperCase()}</span>
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
          <path d="M5.5 7.5 10 12l4.5-4.5H5.5Z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            {/* optional backdrop to allow outside click */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="menu"
              className="fixed z-[9999] w-36 rounded-xl border border-white/10 bg-[#0b0f16]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,.45)] p-2"
              style={{
                top: (pos?.top ?? 80) + "px",
                left: (pos?.left ?? (typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 144 - 8) : 8)) + "px",
              }}
            >
              {flags.map((f) => (
                <Link
                  role="menuitem"
                  key={f.code}
                  href={toLangPath(f.code)}
                  onClick={() => {
                    const cookieLang = f.code === "zh" ? "cn" : f.code;
                    document.cookie = `locale=${cookieLang}; path=/; max-age=31536000; SameSite=Lax`;
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/5"
                >
                  <span className="text-lg leading-none">{f.emoji}</span>
                  <span>{f.label}</span>
                  {f.code === lang && <span className="ml-auto text-cyan-300">•</span>}
                </Link>
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

/* -------------------- Website Picker -------------------- */
function WebsitePicker({
  websites,
  websiteId,
  setWebsiteId,
  loading,
}: {
  websites: Array<{ id: string; name: string }>;
  websiteId?: string | null;
  setWebsiteId: (id: string) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);

  const current = websites.find((w) => w.id === websiteId) || null;

  React.useEffect(() => {
    function updatePos() {
      if (!open || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const width = 260; // ~ w-64
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.left));
      const top = Math.min(window.innerHeight - 8, r.bottom + 8);
      setPos({ top, left, width });
    }
    updatePos();
    if (!open) return;
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-sm text-white/85 hover:text-white hover:bg-white/15 min-w-[180px]"
        title="Select website"
        disabled={loading || (websites?.length ?? 0) === 0}
      >
        <span className="i-website-icon hidden sm:inline-block h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,.6)]" />
        <span className="truncate max-w-[200px]">{current ? current.name : (loading ? "Loading websites…" : "Select a website…")}</span>
        <svg viewBox="0 0 20 20" className="h-3 w-3 opacity-80 ml-auto" fill="currentColor"><path d="M5.5 7.5 10 12l4.5-4.5H5.5Z"/></svg>
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="menu"
              className="fixed z-[9999] w-[260px] max-h-[60vh] overflow-auto rounded-xl border border-white/10 bg-[#0b0f16]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,.45)] p-2"
              style={{ top: (pos?.top ?? 80) + "px", left: (pos?.left ?? 12) + "px" }}
            >
              {(websites?.length ?? 0) === 0 ? (
                <div className="px-2 py-2 text-sm text-white/60">No websites</div>
              ) : (
                websites.map((w) => (
                  <button
                    key={w.id}
                    role="menuitemradio"
                    aria-checked={w.id === websiteId}
                    onClick={() => {
                      setWebsiteId(w.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:text-white hover:bg-white/5 ${
                      w.id === websiteId ? "text-white" : "text-white/80"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${w.id === websiteId ? "bg-cyan-300" : "bg-white/40"}`} />
                    <span className="truncate">{w.name}</span>
                    {w.id === websiteId && <span className="ml-auto text-cyan-300">•</span>}
                  </button>
                ))
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}

type Props = {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  userRole?: string | null;
  locale?: "th" | "en" | "cn";
};

export default function TopBar({
  userName,
  userEmail,
  userImage,
  userRole,
  locale = "th",
}: Props) {
  const [open, setOpen] = useState(false);
  const { website, websites, websiteId, setWebsiteId, loading } = useWebsite();

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Recalculate position when opening and when window resizes/scrolls
  useEffect(() => {
    function updatePos() {
      if (!open || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      // Menu width is w-56 (224px). Align right edge with button right.
      const width = 224;
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.right - width));
      const top = Math.min(window.innerHeight - 8, r.bottom + 8);
      setMenuPos({ top, left, width });
    }
    updatePos();
    if (!open) return;
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  const displayName = userName || userEmail || "User";
  const initials =
    (userName || userEmail || "U")
      .split(/[.\s@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="admin-card px-3 py-2 md:px-4 md:py-2 mb-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: website chooser + welcome */}
        <div className="min-w-0">

          {/* Website selector (LangPicker style) */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <WebsitePicker
              websites={websites}
              websiteId={websiteId}
              setWebsiteId={setWebsiteId}
              loading={loading}
            />
          </div>
        </div>

        {/* Right: language + profile */}
        <div className="flex items-center gap-3">
          {/* Language picker */}
          {(() => {
            // Map admin locale (th|en|cn) to picker lang (th|en|zh)
            const lang = (locale === "cn" ? "zh" : locale) as "th" | "en" | "zh";
            const pathname = typeof window !== "undefined" ? window.location.pathname : "/admin";
            const search = typeof window !== "undefined" ? window.location.search : "";
            const toLangPath = (l: string) => `${pathname}${search}`;
            return <LangPicker lang={lang} toLangPath={toLangPath} />;
          })()}

          {/* Profile menu */}
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-2 py-1 rounded-xl"
              aria-haspopup="menu"
              aria-expanded={open}
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={userImage} alt="avatar" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-emerald-400/80 text-black font-semibold grid place-items-center">
                  {initials}
                </div>
              )}
              <span className="hidden md:inline text-sm text-white/90 max-w-[180px] truncate">
                {displayName}
              </span>
              <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-80">
                <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5" />
              </svg>
            </button>
            {open &&
              createPortal(
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setOpen(false)}
                    aria-hidden
                  />

                  {/* Floating menu (fixed, above everything) */}
                  <div
                    role="menu"
                    className="fixed z-[9999] w-56 rounded-xl border border-white/10 bg-[#0b0f14]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,.5)] overflow-hidden pointer-events-auto"
                    style={{
                      top: (menuPos?.top ?? 80) + "px",
                      left: (menuPos?.left ?? (typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 224 - 8) : 8)) + "px",
                    }}
                  >
                    <div className="px-3 py-2 text-xs admin-subtle">
                      Signed in as
                      <div className="text-white/90 truncate">{userEmail || displayName}</div>
                    </div>
                    <div className="h-px bg-white/10" />
                    <a href="/admin/(dashboard)/profile" className="block px-3 py-2 text-sm hover:bg-white/5">
                      Profile
                    </a>
                    <div className="h-px bg-white/10" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/admin" })}
                      className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/5"
                    >
                      Logout
                    </button>
                  </div>
                </>,
                document.body
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
