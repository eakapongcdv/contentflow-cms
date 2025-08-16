"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type Lang = "TH" | "EN" | "CN";

const T = {
  TH: {
    brand: "ContentFlow",
    brandSub: "AI Suite",
    features: "ฟีเจอร์",
    pricing: "ราคา",
    cloud: "คลาวด์",
    security: "ความปลอดภัย",
    docs: "เอกสาร",
    about: "เกี่ยวกับ",
    careers: "ร่วมงาน",
    signin: "เข้าสู่ระบบ",
    demo: "ขอเดโม",
  },
  EN: {
    brand: "ContentFlow",
    brandSub: "AI Suite",
    features: "Features",
    pricing: "Pricing",
    cloud: "Cloud",
    security: "Security",
    docs: "Docs",
    about: "About",
    careers: "Careers",
    signin: "Sign in",
    demo: "Get demo",
  },
  CN: {
    brand: "ContentFlow",
    brandSub: "AI 套件",
    features: "功能",
    pricing: "价格",
    cloud: "云端",
    security: "安全",
    docs: "文档",
    about: "关于我们",
    careers: "加入我们",
    signin: "登录",
    demo: "申请演示",
  },
} as const;

const prefixFor = (lang: Lang) => (lang === "TH" ? "" : `/${lang.toLowerCase()}`);

export default function SiteHeader({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const update = () => setHash(typeof window !== "undefined" ? window.location.hash : "");
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  const P = prefixFor(lang);
  const L = T[lang];

  const NAV = useMemo(
    () => [
      { href: `${P}/#features`, label: L.features, kind: "hash" as const, hash: "#features" },
      { href: `${P}/#pricing`, label: L.pricing, kind: "hash" as const, hash: "#pricing" },
      { href: `${P}/#cloud`, label: L.cloud, kind: "hash" as const, hash: "#cloud" },
      { href: `${P}/#security`, label: L.security, kind: "hash" as const, hash: "#security" },
      { href: `${P}/docs`, label: L.docs, kind: "page" as const },
      { href: `${P}/about`, label: L.about, kind: "page" as const },
      { href: `${P}/careers`, label: L.careers, kind: "page" as const },
    ],
    [P, L]
  );

  const isActive = (item: { href: string; kind: "hash" | "page"; hash?: string }) =>
    item.kind === "hash" ? hash === (item.hash ?? "") : pathname === item.href;

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Brand */}
            <Link href={P || "/"} className="flex items-center gap-2">
              {/* ใช้โลโก้ไฟล์จริง ถ้ามีที่ /public/logo.png */}
              <div className="h-6 w-6 overflow-hidden rounded-lg bg-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,.7)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ContentFlow" className="h-6 w-6 object-cover" />
              </div>
              <span className="font-semibold tracking-tight text-white">
                {L.brand} <span className="text-white/70">{L.brandSub}</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    "text-sm px-2 py-1 rounded-md " +
                    (isActive(n) ? "text-white bg-white/10" : "text-white/70 hover:text-white")
                  }
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`${P}/admin/login`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:text-white"
              >
                {/* icon: user */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                </svg>
                {L.signin}
              </Link>
              <a
                href="mailto:sales@codediva.co.th?subject=Request%20a%20demo%20(ContentFlow%20AI%20Suite)"
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-300"
              >
                {/* icon: mail */}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path d="M2 6h20v12H2z" opacity=".3" />
                  <path d="M2 6l10 7L22 6" />
                </svg>
                {L.demo}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}