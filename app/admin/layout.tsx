// app/admin/layout.tsx
import "./globals.css";
import { Noto_Sans_Thai } from "next/font/google";
import AuroraParallax from "./aurora-parallax"; // ⟵ เพิ่มบรรทัดนี้

const noto = Noto_Sans_Thai({
  subsets: ["thai","latin"],
  weight: ["300","400","500","600","700"],
  variable: "--font-noto",
});

export const metadata = { title: "Admin • ContentFlow" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={noto.variable}>
      <body className="admin-body min-h-screen bg-[#0b0f14] text-white antialiased">
        {/* พื้นหลังขยับตามเมาส์ */}
        <AuroraParallax />
        {children}
      </body>
    </html>
  );
}
