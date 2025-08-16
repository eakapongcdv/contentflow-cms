// app/components/SiteFooter.tsx
"use client";

import React from "react";

export default function SiteFooter() {
  return (
    <footer className="mt-16">
      {/* แถบพื้นหลังเต็มความกว้าง เหมือน header */}
      <div className="w-full border-t border-white/10 bg-white/[0.04] backdrop-blur-sm">
        {/* คอนเทนต์กว้างเท่ากับ Header */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
          {/* Grid 4 คอลัมน์ บน md+ (ชิดเส้นเดียวกับ content/header) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand / Intro */}
            <div>
              <div className="text-lg font-semibold text-white">
                ContentFlow AI Suite
              </div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                แพลตฟอร์มจัดการคอนเทนต์พร้อม AI สำหรับธุรกิจไทย — สร้าง
                เผยแพร่ และวัดผลอย่างมืออาชีพ
              </p>
              <p className="mt-3 text-xs text-white/50">
                รองรับ Cloud / Hybrid • PDPA & Consent • Security Standards
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Product" className="text-sm">
              <div className="font-semibold text-white">Product</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="#features">Features</a></li>
                <li><a className="hover:text-white" href="#pricing">Pricing</a></li>
                <li><a className="hover:text-white" href="#cloud">Cloud Support</a></li>
                <li><a className="hover:text-white" href="#security">Security & Compliance</a></li>
                <li><a className="hover:text-white" href="/docs">Docs & API</a></li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company" className="text-sm">
              <div className="font-semibold text-white">Company</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="/about">About us</a></li>
                <li><a className="hover:text-white" href="/contact">Contact us</a></li>
                <li><a className="hover:text-white" href="/careers">Careers</a></li>
                <li><a className="hover:text-white" href="/partners">Partners</a></li>
              </ul>
            </nav>

            {/* Newsletter / Social / Contact */}
            <div className="text-sm">
              <div className="font-semibold text-white">Stay in the loop</div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); /* wire-up later */ }}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="อีเมลสำหรับข่าวสาร"
                  className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                  aria-label="Email for newsletter"
                  required
                />
                <button className="rounded-lg px-3 py-2 bg-cyan-400/90 text-black hover:bg-cyan-300">
                  สมัคร
                </button>
              </form>

              <div className="mt-4 text-white/75 space-y-1.5">
                <div>
                  <span className="text-white/50">Email:</span>{" "}
                  <a className="hover:text-white" href="mailto:support@codediva.co.th">
                    support@codediva.co.th
                  </a>
                </div>
                <div>
                  <span className="text-white/50">Mobile:</span>{" "}
                  <a className="hover:text-white" href="tel:+66999999999">
                    +66 99 999 9999
                  </a>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <a href="https://facebook.com" aria-label="Facebook" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.6V12h2.8V9.7c0-2.8 1.6-4.3 4-4.3 1.2 0 2.4.2 2.4.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12z"/>
                  </svg>
                </a>
                <a href="https://x.com" aria-label="X / Twitter" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M18.9 2H21l-6.5 7.5 7.6 12.5H16l-4.7-7-5.4 7H3l7-8.7L2 2h6.1l4.3 6.4L18.9 2zM16.9 20h1.7L8.1 4H6.3l10.6 16z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com" aria-label="LinkedIn" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M4.98 3.5C4.98 4.88 3.85 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8 8h3.8v2.1h.1C12.7 8.9 14.3 8 16.6 8 21.2 8 22 10.9 22 15.2V23h-4v-6.7c0-1.6 0-3.8-2.3-3.8S12.9 14 12.9 16.2V23h-4V8z"/>
                  </svg>
                </a>
                <a href="https://youtube.com" aria-label="YouTube" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 1.8.2 3.6.5 5.8a3 3 0 0 0 2.1 2.1C4.4 20.5 12 20.5 12 20.5s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-2.2.5-4 .5-5.8 0-1.8-.2-3.6-.5-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar (full width เท่ากับ header container) */}
          <div className="mt-8 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <div>© {new Date().getFullYear()} Codediva Co., Ltd. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a className="hover:text-white" href="/policy">Privacy Policy</a>
              <a className="hover:text-white" href="/terms">Terms & Conditions</a>
              <a className="hover:text-white" href="/pdpa">PDPA & Consent</a>
              <a className="hover:text-white" href="/security">Security</a>
              <a className="hover:text-white" href="/sitemap">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
