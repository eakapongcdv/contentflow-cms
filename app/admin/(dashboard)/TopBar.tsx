"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useWebsite } from "./website-provider";

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

  const displayName = userName || userEmail || "User";
  const initials =
    (userName || userEmail || "U")
      .split(/[.\s@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  function setLang(lc: "th" | "en" | "cn") {
    document.cookie = `locale=${lc}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <div className="admin-card px-3 py-2 md:px-4 md:py-2 mb-3">
      <div className="flex items-center justify-between gap-3">
        {/* Left: website chooser + welcome */}
        <div className="min-w-0">

          {/* Website selector (ดึงจาก WebsiteProvider) */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select
              aria-label="Select website"
              className="admin-select text-sm cursor-pointer min-w-[180px]"
              disabled={loading || (websites?.length ?? 0) === 0}
              value={websiteId || ""}
              onChange={(e) => setWebsiteId(e.target.value)}
            >
              {(!websiteId || websites.length === 0) && (
                <option value="" disabled>
                  {loading ? "Loading websites…" : "Select a website…"}
                </option>
              )}
              {websites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: language + profile */}
        <div className="flex items-center gap-3">
          {/* Language switcher (compact segmented) */}
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 overflow-hidden h-8">
            {([
              { id: "th", label: "TH" },
              { id: "en", label: "EN" },
              { id: "cn", label: "CN" },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLang(opt.id)}
                className={`px-2.5 text-xs transition-colors ${
                  locale === opt.id
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10"
                }`}
                aria-pressed={locale === opt.id}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Profile menu */}
          <div className="relative z-[1100]">
            <button
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
            {open && (
              <div
                className="fixed inset-0 z-[1150]"
                onClick={() => setOpen(false)}
                aria-hidden
              />
            )}
            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b0f14]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,.4)] overflow-hidden z-[2000] pointer-events-auto"
              >
                <div className="px-3 py-2 text-xs admin-subtle">
                  Signed in as
                  <div className="text-white/90 truncate">{userEmail || displayName}</div>
                </div>
                <div className="h-px bg-white/10" />
                <a href="/admin/(dashboard)/profile" className="block px-3 py-2 text-sm hover:bg-white/5">
                  Profile
                </a>
                <a href="/admin/(dashboard)/settings" className="block px-3 py-2 text-sm hover:bg-white/5">
                  Settings
                </a>
                <div className="h-px bg-white/10" />
                <button
                  onClick={() => signOut({ callbackUrl: "/admin" })}
                  className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-white/5"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
