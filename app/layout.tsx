// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";
import ClientLangLayout from "./../app/components/ClientLangLayout"; // ⬅️ client wrapper

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "ContentFlow AI Suite",
  description: "AI-Powered Content Suite for Thailand (Dark-Neon)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // หมายเหตุ: lang ที่ <html> ตั้งเป็น th ไว้ก่อน
  // แล้วให้ ClientLangLayout ปรับ document.documentElement.lang แบบ runtime ตาม path
  return (
    <html lang="th" className={noto.variable}>
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        <ClientLangLayout>{children}</ClientLangLayout>
      </body>
    </html>
  );
}