// app/components/SiteFooter.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

/* -------------------- i18n Dict -------------------- */
const DICT: Record<"th" | "en" | "zh", any> = {
  th: {
    brandLead: "แพลตฟอร์มจัดการคอนเทนต์พร้อม AI สำหรับธุรกิจไทย — สร้าง เผยแพร่ และวัดผลอย่างมืออาชีพ",
    brandNote: "รองรับ Cloud / Hybrid • PDPA & Consent • Security Controls",
    product: "สินค้า",
    features: "ฟีเจอร์",
    pricing: "ราคา",
    cloud: "คลาวด์",
    security: "ความปลอดภัย",
    docs: "เอกสาร / API",
    company: "บริษัท",
    about: "เกี่ยวกับเรา",
    contact: "ติดต่อเรา",
    careers: "ร่วมงานกับเรา",
    partners: "พาร์ตเนอร์",
    stayLoop: "รับข่าวสาร",
    emailPh: "อีเมลสำหรับข่าวสาร",
    subscribe: "สมัคร",
    email: "อีเมล",
    mobile: "โทร",
    allRights: "สงวนลิขสิทธิ์",
    privacy: "นโยบายความเป็นส่วนตัว",
    terms: "ข้อกำหนดและเงื่อนไข",
    pdpa: "PDPA & Consent",
    securityOnly: "ความปลอดภัย",
    sitemap: "แผนผังเว็บไซต์",
  },
  en: {
    brandLead: "AI-powered content platform for modern teams — create, publish, and measure with confidence.",
    brandNote: "Cloud / Hybrid ready • PDPA & Consent • Security Controls",
    product: "Product",
    features: "Features",
    pricing: "Pricing",
    cloud: "Cloud",
    security: "Security",
    docs: "Docs / API",
    company: "Company",
    about: "About us",
    contact: "Contact us",
    careers: "Careers",
    partners: "Partners",
    stayLoop: "Stay in the loop",
    emailPh: "Email for newsletter",
    subscribe: "Subscribe",
    email: "Email",
    mobile: "Mobile",
    allRights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    pdpa: "PDPA & Consent",
    securityOnly: "Security",
    sitemap: "Sitemap",
  },
  zh: {
    brandLead: "面向团队的 AI 内容平台 —— 更快创建、发布与评估成效。",
    brandNote: "支持云 / 混合云 • PDPA 与同意 • 安全控制",
    product: "产品",
    features: "功能",
    pricing: "价格",
    cloud: "云",
    security: "安全",
    docs: "文档 / API",
    company: "公司",
    about: "关于我们",
    contact: "联系我们",
    careers: "招聘",
    partners: "合作伙伴",
    stayLoop: "订阅更新",
    emailPh: "订阅邮箱",
    subscribe: "订阅",
    email: "邮箱",
    mobile: "电话",
    allRights: "版权所有。",
    privacy: "隐私政策",
    terms: "条款与条件",
    pdpa: "PDPA 与同意",
    securityOnly: "安全",
    sitemap: "网站地图",
  },
};

/* ปรับภาษาให้ยืดหยุ่น & มี fallback */
function normalizeLang(input?: string): "th" | "en" | "zh" {
  const s = (input || "th").toLowerCase();
  if (s.startsWith("en")) return "en";
  if (s.startsWith("zh") || s.startsWith("cn")) return "zh";
  return "th";
}

export default function SiteFooter({ lang: langProp }: { lang?: string }) {
  const pathname = usePathname();
  const lang = normalizeLang(langProp);
  const t = DICT[lang] ?? DICT.th; // 🔒 กันพัง

  // เปลี่ยนเส้นทางตามภาษา (prefix /th, /en, /zh)
  function toLangPath(nextRaw: string) {
    const next = normalizeLang(nextRaw);
    const p = pathname || "/";
    const m = p.match(/^\/(th|en|zh)(\/.*)?$/i);
    const rest = m ? (m[2] || "") : (p === "/" ? "" : p); // เก็บ path ต่อท้าย
    return `/${next}${rest}`;
  }

  return (
    <footer className="mt-12">
      {/* ความกว้างเท่ากับ Header */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
          {/* Grid 4 คอลัมน์บน md+ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand / Intro */}
            <div>
              <Link href={toLangPath(lang)} className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ContentFlow AI Suite" className="h-7 w-7 rounded-md object-contain" />
                <span className="text-white font-semibold tracking-tight">
                  ContentFlow <span className="text-white/70">AI Suite</span>
                </span>
              </Link>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">{t.brandLead}</p>
              <p className="mt-3 text-xs text-white/50">{t.brandNote}</p>
            </div>

            {/* Product */}
            <nav aria-label="Product" className="text-sm">
              <div className="font-semibold text-white">{t.product}</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><Link className="hover:text-white" href={`/${lang}#features`}>{t.features}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}#pricing`}>{t.pricing}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}#cloud`}>{t.cloud}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}#security`}>{t.security}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}/docs`}>{t.docs}</Link></li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company" className="text-sm">
              <div className="font-semibold text-white">{t.company}</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><Link className="hover:text-white" href={`/${lang}/about`}>{t.about}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}/contact`}>{t.contact}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}/careers`}>{t.careers}</Link></li>
                <li><Link className="hover:text-white" href={`/${lang}/partners`}>{t.partners}</Link></li>
              </ul>
            </nav>

            {/* Newsletter / Social / Contact */}
            <div className="text-sm">
              <div className="font-semibold text-white">{t.stayLoop}</div>

              <form className="mt-3 flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <div className="relative flex-1">
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t.emailPh}
                    aria-label={t.emailPh}
                    required
                    className="w-full rounded-lg bg-black/40 border border-white/15 pl-9 pr-3 py-2 text-white placeholder:text-white/40"
                  />
                  {/* mail icon */}
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z"/></svg>
                  </span>
                </div>
                <button className="inline-flex items-center gap-1 rounded-lg px-3 py-2 bg-cyan-400/90 text-black hover:bg-cyan-300">
                  {/* send icon */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M2 21 23 12 2 3v7l15 2-15 2v7Z"/></svg>
                  <span>{t.subscribe}</span>
                </button>
              </form>

              <div className="mt-4 text-white/75 space-y-1.5">
                <div><span className="text-white/50">{t.email}:</span> <a className="hover:text-white" href="mailto:support@codediva.co.th">support@codediva.co.th</a></div>
                <div><span className="text-white/50">{t.mobile}:</span> <a className="hover:text-white" href="tel:+66999999999">+66 99 999 9999</a></div>
              </div>

              {/* Social + Lang picker */}
              <div className="mt-4 flex items-center gap-3">
                <a href="https://facebook.com" aria-label="Facebook" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.6V12h2.8V9.7c0-2.8 1.6-4.3 4-4.3 1.2 0 2.4.2 2.4.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12z"/></svg>
                </a>
                <a href="https://x.com" aria-label="X / Twitter" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.9 2H21l-6.5 7.5 7.6 12.5H16l-4.7-7-5.4 7H3l7-8.7L2 2h6.1l4.3 6.4L18.9 2zM16.9 20h1.7L8.1 4H6.3l10.6 16z"/></svg>
                </a>
                <a href="https://www.linkedin.com" aria-label="LinkedIn" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.85 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8 8h3.8v2.1h.1C12.7 8.9 14.3 8 16.6 8 21.2 8 22 10.9 22 15.2V23h-4v-6.7c0-1.6 0-3.8-2.3-3.8S12.9 14 12.9 16.2V23h-4V8z"/></svg>
                </a>
                <a href="https://youtube.com" aria-label="YouTube" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 1.8.2 3.6.5 5.8a3 3 0 0 0 2.1 2.1C4.4 20.5 12 20.5 12 20.5s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-2.2.5-4 .5-5.8 0-1.8-.2-3.6-.5-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z"/></svg>
                </a>

                <LangPicker lang={lang} toLangPath={toLangPath} />
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <div>© {new Date().getFullYear()} Codediva Co., Ltd. {t.allRights}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link className="hover:text-white" href={`/${lang}/policy`}>{t.privacy}</Link>
              <Link className="hover:text-white" href={`/${lang}/terms`}>{t.terms}</Link>
              <Link className="hover:text-white" href={`/${lang}/pdpa`}>{t.pdpa}</Link>
              <Link className="hover:text-white" href={`/${lang}/security`}>{t.securityOnly}</Link>
              <Link className="hover:text-white" href={`/${lang}/sitemap`}>{t.sitemap}</Link>
            </div>
          </div>
        </div>
      </div>

      {/* เส้นแบ่งล่างสุด */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="h-px bg-white/10 mt-4" />
      </div>
    </footer>
  );
}

/* -------------------- Lang Picker -------------------- */
function LangPicker({ lang, toLangPath }: { lang: "th" | "en" | "zh"; toLangPath: (l: string) => string }) {
  const [open, setOpen] = React.useState(false);

  const flags: { code: "th" | "en" | "zh"; label: string; emoji: string }[] = [
    { code: "th", label: "ไทย", emoji: "🇹🇭" },
    { code: "en", label: "English", emoji: "🇺🇸" },
    { code: "zh", label: "中文", emoji: "🇨🇳" },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/15 px-2 py-1 text-xs text-white/80 hover:text-white"
        title="Change language"
      >
        <span className="text-base leading-none">{flags.find(f => f.code === lang)?.emoji}</span>
        <span className="hidden sm:inline">{lang.toUpperCase()}</span>
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor"><path d="M5.5 7.5 10 12l4.5-4.5H5.5Z"/></svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-36 rounded-xl border border-white/10 bg-[#0b0f16]/95 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,.45)] z-10 p-2"
        >
          {flags.map((f) => (
            <Link
              role="menuitem"
              key={f.code}
              href={toLangPath(f.code)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/5"
            >
              <span className="text-lg leading-none">{f.emoji}</span>
              <span>{f.label}</span>
              {f.code === lang && <span className="ml-auto text-cyan-300">•</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}