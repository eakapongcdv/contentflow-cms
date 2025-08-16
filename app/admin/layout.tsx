// app/admin/layout.tsx
import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";

const noto = Noto_Sans_Thai({
  subsets: ["thai","latin"],
  weight: ["300","400","500","600","700"],
  variable: "--font-noto",
});

export const metadata = { title: "Admin • ContentFlow" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={noto.variable}>
      <body className="min-h-screen bg-[#0b0f14] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
