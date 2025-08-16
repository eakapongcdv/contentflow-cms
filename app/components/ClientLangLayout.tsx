// app/ClientLangLayout.tsx
"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
export type Lang = "TH" | "EN" | "CN";

function getLangFromPath(pathname: string | null): Lang {
  const seg = (pathname || "/").split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "EN";
  if (seg === "cn") return "CN";
  return "TH";
}

export default function ClientLangLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lang = getLangFromPath(pathname);

  // ปรับ <html lang="..."> ตามภาษา
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang === "TH" ? "th" : lang === "EN" ? "en" : "zh";
  }, [lang]);

  return (
    <>
      {/* ให้ header/footer รับ prop lang เดียวกับหน้า */}
      <SiteHeader key={`header-${lang}`} lang={lang} />
      {children}
      <SiteFooter key={`footer-${lang}`} lang={lang} />
    </>
  );
}