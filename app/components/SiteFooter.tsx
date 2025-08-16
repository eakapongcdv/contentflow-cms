"use client";

import Link from "next/link";
import React from "react";

type Lang = "TH" | "EN" | "CN";
const prefixFor = (lang: Lang) => (lang === "TH" ? "" : `/${lang.toLowerCase()}`);

const T = {
  TH: {
    product: "สินค้า",
    company: "บริษัท",
    loop: "รับข่าวสาร",
    emailPH: "อีเมลสำหรับข่าวสาร",
    subscribe: "สมัคร",
    privacy: "นโยบายความเป็นส่วนตัว",
    terms: "เงื่อนไขการใช้บริการ",
    pdpa: "PDPA & ความยินยอม",
    security: "ความปลอดภัย",
    sitemap: "แผนผังเว็บไซต์",
    about: "เกี่ยวกับเรา",
    contact: "ติดต่อเรา",
    careers: "ร่วมงาน",
    partners: "พาร์ทเนอร์",
    features: "ฟีเจอร์",
    pricing: "ราคา",
    cloud: "คลาวด์",
    secMenu: "Security & Compliance",
  },
  EN: {
    product: "Product",
    company: "Company",
    loop: "Stay in the loop",
    emailPH: "Email for newsletter",
    subscribe: "Subscribe",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    pdpa: "PDPA & Consent",
    security: "Security",
    sitemap: "Sitemap",
    about: "About us",
    contact: "Contact us",
    careers: "Careers",
    partners: "Partners",
    features: "Features",
    pricing: "Pricing",
    cloud: "Cloud",
    secMenu: "Security & Compliance",
  },
  CN: {
    product: "产品",
    company: "公司",
    loop: "订阅资讯",
    emailPH: "订阅邮箱",
    subscribe: "订阅",
    privacy: "隐私政策",
    terms: "条款与条件",
    pdpa: "PDPA 与同意",
    security: "安全",
    sitemap: "网站地图",
    about: "关于我们",
    contact: "联系我们",
    careers: "加入我们",
    partners: "合作伙伴",
    features: "功能",
    pricing: "价格",
    cloud: "云端",
    secMenu: "安全与合规",
  },
} as const;

export default function SiteFooter({ lang }: { lang: Lang }) {
  const P = prefixFor(lang);
  const L = T[lang];

  return (
    <footer className="mt-0 border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ContentFlow" className="h-6 w-6 rounded-lg" />
                <div className="text-lg font-semibold text-white">ContentFlow AI Suite</div>
              </div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                AI content platform for teams — create, publish and measure like a pro.
              </p>
              <p className="mt-3 text-xs text-white/50">
                Cloud / Hybrid • PDPA &amp; Consent • Security reviews on request
              </p>
            </div>

            <nav aria-label="Product" className="text-sm">
              <div className="font-semibold text-white">{L.product}</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href={`${P}/#features`}>{L.features}</a></li>
                <li><a className="hover:text-white" href={`${P}/#pricing`}>{L.pricing}</a></li>
                <li><a className="hover:text-white" href={`${P}/#cloud`}>{L.cloud}</a></li>
                <li><a className="hover:text-white" href={`${P}/#security`}>{L.secMenu}</a></li>
                <li><Link className="hover:text-white" href={`${P}/docs`}>Docs &amp; API</Link></li>
              </ul>
            </nav>

            <nav aria-label="Company" className="text-sm">
              <div className="font-semibold text-white">{L.company}</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><Link className="hover:text-white" href={`${P}/about`}>{L.about}</Link></li>
                <li><Link className="hover:text-white" href={`${P}/contact`}>{L.contact}</Link></li>
                <li><Link className="hover:text-white" href={`${P}/careers`}>{L.careers}</Link></li>
                <li><Link className="hover:text-white" href={`${P}/partners`}>{L.partners}</Link></li>
              </ul>
            </nav>

            <div className="text-sm">
              <div className="font-semibold text-white">{L.loop}</div>
              <form className="mt-3 flex items-center gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={L.emailPH}
                  className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                  aria-label={L.emailPH}
                  required
                />
                <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 bg-cyan-400/90 text-black hover:bg-cyan-300">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M2 6h20v12H2z" opacity=".3" />
                    <path d="M2 6l10 7L22 6" />
                  </svg>
                  {L.subscribe}
                </button>
              </form>

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
              </div>
            </div>
          </div>

          <div className="mt-8 border-top border-white/10"></div>
          {/* Bottom bar */}
          <div className="mt-4 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <div>© {new Date().getFullYear()} Codediva Co., Ltd. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link className="hover:text-white" href={`${P}/policy`}>{L.privacy}</Link>
              <Link className="hover:text-white" href={`${P}/terms`}>{L.terms}</Link>
              <Link className="hover:text-white" href={`${P}/pdpa`}>{L.pdpa}</Link>
              <Link className="hover:text-white" href={`${P}/security`}>{L.security}</Link>
              <Link className="hover:text-white" href={`${P}/sitemap`}>{L.sitemap}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}