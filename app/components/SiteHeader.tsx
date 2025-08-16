"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NAV = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#cloud", label: "Cloud" },
  { href: "/#security", label: "Security" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,.7)]" />
              <span className="font-semibold tracking-tight text-white">
                ContentFlow <span className="text-white/70">AI Suite</span>
              </span>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-4">
              {NAV.map((n) => {
                const active =
                  n.href === "/careers"
                    ? pathname?.startsWith("/careers")
                    : pathname === n.href; // สำหรับลิงก์หน้าอื่น
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={
                      "text-sm px-2 py-1 rounded-md " +
                      (active
                        ? "text-white bg-white/10"
                        : "text-white/70 hover:text-white")
                    }
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="hidden sm:inline-flex rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:text-white"
              >
                Sign in
              </Link>
              <a
                href="mailto:sales@codediva.co.th?subject=Request%20a%20demo%20(ContentFlow%20AI%20Suite)"
                className="rounded-lg bg-cyan-400/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-300"
              >
                Get demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
