"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

const NAV = [
  { href: "/#features", label: { th: "ฟีเจอร์", en: "Features", zh: "功能" } },
  { href: "/#pricing",  label: { th: "ราคา",   en: "Pricing",  zh: "定价" } },
  { href: "/#cloud",    label: { th: "คลาวด์", en: "Cloud",    zh: "云" } },
  { href: "/#security", label: { th: "ความปลอดภัย", en: "Security", zh: "安全" } },
  { href: "/docs",      label: { th: "เอกสาร", en: "Docs",     zh: "文档" } },
  { href: "/about",     label: { th: "เกี่ยวกับ", en: "About",  zh: "关于" } },
  { href: "/careers",   label: { th: "ร่วมงาน", en: "Careers", zh: "招聘" } },
];

function currentLocale(pathname: string) {
  const seg = pathname.split("?")[0].split("/").filter(Boolean)[0];
  return ["th", "en", "zh"].includes(seg) ? (seg as "th"|"en"|"zh") : "th";
}

export default function SiteHeader() {
  const pathname = usePathname() || "/";
  const locale = currentLocale(pathname);
  const [activeHash, setActiveHash] = useState<string>("");

  // scroll-spy (ไฮไลต์เมนูเมื่อเลื่อน)
  useEffect(() => {
    const ids = ["features", "pricing", "cloud", "security"];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveHash("#" + (visible.target as HTMLElement).id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return activeHash === href.replace("/", "");
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4" style={{ height: "var(--nav-h)" }}>
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2">
              {/* ใช้โลโก้ไฟล์จริง */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ContentFlow AI Suite" className="h-6 w-6 rounded-md" />
              <span className="font-semibold tracking-tight text-white">
                ContentFlow <span className="text-white/70">AI Suite</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    "text-sm px-2 py-1 rounded-md transition-colors " +
                    (isActive(n.href) ? "text-white bg-white/10" : "text-white/70 hover:text-white")
                  }
                >
                  {n.label[locale]}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* ปุ่มเปลี่ยนภาษา (ปุ่มเดียว + overlay) */}
              <LanguageSwitcher placement="bottom-end" />

              <Link
                href="/admin/login"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:text-white"
              >
                {/* lock icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5zm-3 8V6a3 3 0 1 1 6 0v3H9z"/></svg>
                <span>{locale === "th" ? "เข้าสู่ระบบ" : locale === "zh" ? "登录" : "Sign in"}</span>
              </Link>

              <a
                href="mailto:sales@codediva.co.th?subject=Request%20a%20demo%20(ContentFlow%20AI%20Suite)"
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-300"
              >
                {/* sparkles icon */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M12 2l1.8 4.6L18 8.4l-4.2 1.8L12 15l-1.8-4.8L6 8.4l4.2-1.8L12 2zm7 10l1.2 3 3 1.2-3 1.2L19 20l-1.2-3-3-1.2 3-1.2L19 12zM4 12l.9 2.2L7 15l-2.1.8L4 18l-.9-2.2L1 15l2.1-.8L4 12z"/></svg>
                <span>{locale === "th" ? "ขอเดโม" : locale === "zh" ? "申请演示" : "Get demo"}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}