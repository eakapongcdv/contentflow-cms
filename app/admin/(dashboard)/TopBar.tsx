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
    <div className="admin-card px-4 py-3 md:px-5 md:py-4 mb-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: website chooser + welcome */}
        <div className="min-w-0">
          <div className="admin-subtle text-sm">Current website</div>

          {/* Website selector (ดึงจาก WebsiteProvider) */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select
              aria-label="Select website"
              className="admin-select cursor-pointer min-w-[220px]"
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

            <span className="admin-badge neon text-xs">Dashboard</span>
          </div>

          {/* Welcome */}
          <div className="text-[13px] admin-muted mt-1">
            Welcome, <span className="text-white/90">{displayName}</span>
            {userRole ? <span className="admin-subtle"> — {userRole}</span> : null}
          </div>
        </div>

        {/* Right: language + profile */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <select
            aria-label="Language"
            className="admin-select cursor-pointer"
            defaultValue={locale}
            onChange={(e) => setLang(e.target.value as "th" | "en" | "cn")}
          >
            <option value="th">ไทย (TH)</option>
            <option value="en">English (EN)</option>
            <option value="cn">中文 (CN)</option>
          </select>

          {/* Profile menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 px-2.5 py-1.5 rounded-xl"
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
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-[#0b0f14]/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,.4)] overflow-hidden z-10"
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
