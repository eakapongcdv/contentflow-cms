// app/widgets/SiteFooter.tsx
"use client";

import Link from "next/link";
import React from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { usePathname } from "next/navigation";

function currentLocale(pathname: string) {
  const seg = pathname.split("?")[0].split("/").filter(Boolean)[0];
  return ["th", "en", "zh"].includes(seg) ? (seg as "th" | "en" | "zh") : "th";
}

export default function SiteFooter() {
  const pathname = usePathname() || "/";
  const locale = currentLocale(pathname);

  return (
    <footer className="mt-0">
      {/* ▼ กว้างเท่ากับ Header */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* การ์ดหลัก ใช้ความกว้างเต็ม container เหมือน header */}
        <div
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8"
          style={{ minHeight: "var(--nav-h)" }}
        >
          {/* Grid เนื้อหา */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand / Intro */}
            <div>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ContentFlow AI Suite" className="h-6 w-6 rounded-md" />
                <div className="text-lg font-semibold text-white">ContentFlow AI Suite</div>
              </div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                {locale === "th"
                  ? "แพลตฟอร์มจัดการคอนเทนต์พร้อม AI สำหรับธุรกิจไทย — สร้าง เผยแพร่ และวัดผลอย่างมืออาชีพ"
                  : locale === "zh"
                  ? "面向企业的 AI 内容平台——更专业地创作、发布与分析"
                  : "AI content platform for teams — create, publish and measure like a pro."}
              </p>
              <p className="mt-3 text-xs text-white/50">
                Cloud / Hybrid • PDPA & Consent • Security Standards
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Product" className="text-sm">
              <div className="font-semibold text-white">
                {locale === "th" ? "ผลิตภัณฑ์" : locale === "zh" ? "产品" : "Product"}
              </div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="/#features">Features</a></li>
                <li><a className="hover:text-white" href="/#pricing">Pricing</a></li>
                <li><a className="hover:text-white" href="/#cloud">Cloud Support</a></li>
                <li><a className="hover:text-white" href="/#security">Security &amp; Compliance</a></li>
                <li><a className="hover:text-white" href="/docs">Docs &amp; API</a></li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company" className="text-sm">
              <div className="font-semibold text-white">
                {locale === "th" ? "บริษัท" : locale === "zh" ? "公司" : "Company"}
              </div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="/about">About us</a></li>
                <li><a className="hover:text-white" href="/contact">Contact us</a></li>
                <li><a className="hover:text-white" href="/careers">Careers</a></li>
                <li><a className="hover:text-white" href="/partners">Partners</a></li>
              </ul>
            </nav>

            {/* Newsletter / Social / Language */}
            <div className="text-sm">
              <div className="font-semibold text-white">
                {locale === "th" ? "ติดตามข่าวสาร" : locale === "zh" ? "订阅" : "Stay in the loop"}
              </div>
              <form className="mt-3 flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={locale === "th" ? "อีเมลสำหรับข่าวสาร" : locale === "zh" ? "电子邮箱" : "Email address"}
                  className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                  aria-label="Email for newsletter"
                  required
                />
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 bg-cyan-400/90 text-black hover:bg-cyan-300">
                  {/* paper-plane icon */}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><path d="M2 21l20-9L2 3v7l14 2-14 2v7z"/></svg>
                  <span>{locale === "th" ? "สมัคร" : locale === "zh" ? "订阅" : "Subscribe"}</span>
                </button>
              </form>

              <div className="mt-4 text-white/75 space-y-1.5">
                <div><span className="text-white/50">Email:</span> <a className="hover:text-white" href="mailto:contact@codediva.co.th">contact@codediva.co.th</a></div>
                <div><span className="text-white/50">Mobile:</span> <a className="hover:text-white" href="tel:+66866732111">+66 86 673 2111</a></div>
              </div>

              {/* Social icons */}
              <div className="mt-4 flex items-center gap-3">
                {[
                  { href: "https://www.facebook.com/codedivacompany", label: "Facebook", path: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.6V12h2.8V9.7c0-2.8 1.6-4.3 4-4.3 1.2 0 2.4.2 2.4.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12z" },
                  //{ href: "https://x.com", label: "X", path: "M18.9 2H21l-6.5 7.5 7.6 12.5H16l-4.7-7-5.4 7H3l7-8.7L2 2h6.1l4.3 6.4L18.9 2zM16.9 20h1.7L8.1 4H6.3l10.6 16z" },
                  { href: "https://www.linkedin.com/company/codediva", label: "LinkedIn", path: "M4.98 3.5C4.98 4.88 3.85 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8 8h3.8v2.1h.1C12.7 8.9 14.3 8 16.6 8 21.2 8 22 10.9 22 15.2V23h-4v-6.7c0-1.6 0-3.8-2.3-3.8S12.9 14 12.9 16.2V23h-4V8z" },
                  { href: "https://www.youtube.com/channel/UCaT87V15ECSvU6mxYKDUZdg", label: "YouTube", path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 1.8.2 3.6.5 5.8a3 3 0 0 0 2.1 2.1C4.4 20.5 12 20.5 12 20.5s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-2.2.5-4 .5-5.8 0-1.8-.2-3.6-.5-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z" },
                  //{ href: "https://instagram.com", label: "Instagram", path: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z" },
                ].map((s) => (
                  <a key={s.label} href={s.href} aria-label={s.label} className="text-white/70 hover:text-white">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><path d={s.path} /></svg>
                  </a>
                ))}
              </div>

              {/* ปุ่มภาษาเหมือน header */}
              <div className="mt-4">
                <LanguageSwitcher placement="top-end" />
              </div>
            </div>
          </div>

          {/* Bottom bar: ความสูงเท่า header */}
          <div className="mt-8 border-t border-white/10">
            <div
              className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55"
              style={{ height: "var(--nav-h)" }}
            >
              <div>© {new Date().getFullYear()} Codediva Co., Ltd. All rights reserved.</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link className="hover:text-white" href="/policy">Privacy Policy</Link>
                <Link className="hover:text-white" href="/terms">Terms &amp; Conditions</Link>
                <Link className="hover:text-white" href="/pdpa">PDPA &amp; Consent</Link>
                <Link className="hover:text-white" href="/security">Security</Link>
                <Link className="hover:text-white" href="/sitemap">Sitemap</Link>
              </div>
            </div>
          </div>
        </div>

        {/* ▼ เส้นแบ่งล่างสุดของฟุตเตอร์ (full width เท่าหัวเว็บ) */}
        <div className="mt-4">
          <div className="h-px w-full bg-white/10" />
        </div>
      </div>
    </footer>
  );
}