// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";

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
  return (
    <html lang="th" className={noto.variable}>
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
