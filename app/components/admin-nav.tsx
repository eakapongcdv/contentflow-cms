"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type Rule = { resource: string; action: string; effect: "ALLOW" | "DENY" };

export interface AdminNavProps {
  websiteId?: string;
  websiteName?: string;
  initialRules?: Rule[];
}

export default function AdminNav({
  websiteId,
  websiteName,
  initialRules = [],
}: AdminNavProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav>
      <div className="section-title">Website</div>
      <div className="text-xs admin-subtle mb-2">
        {websiteName ?? "— ไม่ได้เลือกเว็บไซต์ —"}
      </div>

      <ul className="flex flex-col gap-1">
        <li>
          <Link
            href="/admin/(dashboard)/overview"
            className="text-current"
            aria-current={isActive("/admin/(dashboard)/overview") ? "page" : undefined}
          >
            Overview
          </Link>
        </li>
        {/* …เมนูอื่น ๆ … */}
      </ul>
    </nav>
  );
}
