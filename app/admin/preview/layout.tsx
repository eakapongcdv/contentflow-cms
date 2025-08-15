// app/preview/layout.tsx
import "@/app/globals.css";                 // ✅ ใช้สไตล์หลักทั้งโปรเจกต์
import type { Metadata } from "next";
import { dbx } from "@/app/fonts";          // ถ้ามีไฟล์ fonts เดิม

export const metadata: Metadata = {
  robots: { index: false, follow: false },  // ปลอดภัย: ไม่ให้บอทเก็บหน้า preview
  title: "Preview",
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={dbx.variable}>
      <body className="min-h-[100svh] bg-[var(--zp-bg)]">
        {children}
      </body>
    </html>
  );
}
