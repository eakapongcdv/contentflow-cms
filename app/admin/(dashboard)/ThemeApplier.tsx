"use client";

import { useEffect } from "react";
import { useWebsite } from "./website-provider";

/**
 * รองรับค่า theme จาก website.theme หรือ website.theme.admin (JSON)
 * ตัวอย่างที่รองรับ:
 * {
 *   "admin": {
 *     "mode": "light" | "dark",
 *     "contentBg": "linear-gradient(...) หรือ #hex",
 *     "contentText": "#0a0a0f",
 *     "accent": "rgba(...) หรือ #hex"
 *   }
 * }
 */
export default function ThemeApplier() {
  const { website } = useWebsite();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".admin-body");
    if (!root) return;

    const t = (website?.theme?.admin ?? website?.theme ?? {}) as any;

    // โหมด: ถ้า light ให้คงค่า default พื้นสว่าง, ถ้า dark ให้ลบค่าพิเศษ (กลับไปดาร์ก)
    const mode = t.mode as "light" | "dark" | undefined;

    // surface (อนุญาตให้ override)
    const contentBg = t.contentBg as string | undefined;
    const contentText = t.contentText as string | undefined;

    // accent ของปุ่มหลัก (ถ้าอยากปรับตามแบรนด์เว็บ)
    const accent = t.accent as string | undefined;

    // Apply
    if (mode === "dark") {
      // โหมดดาร์ก: เอา surface ออกจากตัวแปรเพื่อให้กลับค่าดีฟอลต์ของธีมดาร์ก (หรือคุณกำหนดเอง)
      root.style.removeProperty("--content-bg");
      root.style.removeProperty("--content-text");
    } else {
      // โหมดไลท์ (หรือไม่ได้ระบุ): ใช้ค่า default pastel ถ้าไม่มีการ override
      if (contentBg)   root.style.setProperty("--content-bg", contentBg);
      if (contentText) root.style.setProperty("--content-text", contentText);
    }
    if (accent) {
      root.style.setProperty("--brand-cyan", accent);
      root.style.setProperty("--brand-cyan-shadow", "rgba(34,211,238,.20)"); // เงาอ่อนลงเล็กน้อย
    }
  }, [website?.id, website?.theme]);

  return null;
}
