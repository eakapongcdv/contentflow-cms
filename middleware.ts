// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/** -------- Path-based i18n settings -------- */
const LOCALES = ["en", "th", "cn"] as const;
const QUERY2PATH: Record<string, (typeof LOCALES)[number]> = {
  en: "en", EN: "en",
  th: "th", TH: "th",
  cn: "cn", CN: "cn",
};

export default withAuth(function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, searchParams } = url;

  // ข้ามงาน i18n สำหรับโซน admin และ asset ภายใน
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isInternal =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public");

  if (isAdminArea || isInternal) {
    return NextResponse.next();
  }

  /** 1) ถ้ามี ?lang=EN → redirect เป็น path /en (canonical) */
  const langParam = searchParams.get("lang");
  if (langParam) {
    const loc = QUERY2PATH[langParam] ?? "th";
    const seg = pathname.split("/");
    const hasPrefix = LOCALES.includes(seg[1] as any);
    if (hasPrefix) seg[1] = loc; else seg.splice(1, 0, loc);

    // เอา lang ออกจาก query อื่น ๆ คงไว้
    searchParams.delete("lang");
    const redir = new URL(url.origin);
    redir.pathname = seg.join("/") || "/";
    redir.search = searchParams.toString();
    return NextResponse.redirect(redir, { status: 308 });
  }

  /** 2) ถ้ามาเป็น /en/... → rewrite เป็น ...?lang=EN ให้แอปเดิมทำงานได้ */
  const m = pathname.match(/^\/(en|th|cn)(\/.*)?$/i);
  if (m) {
    const loc = m[1].toUpperCase(); // EN/TH/CN
    const rest = m[2] || "/";
    const rewriteUrl = new URL(url.origin);
    rewriteUrl.pathname = rest;
    const sp = new URLSearchParams(searchParams);
    sp.set("lang", loc);
    rewriteUrl.search = sp.toString();
    return NextResponse.rewrite(rewriteUrl);
  }

  /** 3) เข้าหน้า root ตรง ๆ → ไปที่ /th เป็นค่าเริ่มต้น */
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/th", url), { status: 308 });
  }

  return NextResponse.next();
}, {
  pages: { signIn: "/admin/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      const p = req.nextUrl.pathname;

      // อนุญาตหน้า login เสมอ ป้องกัน loop
      if (p.startsWith("/admin/login")) return true;

      // บังคับเฉพาะ /admin และ /api/admin ให้มี token
      const isAdmin = p.startsWith("/admin") || p.startsWith("/api/admin");
      return isAdmin ? !!token : true;
    },
  },
});

/** -------- Matcher: ให้ middleware ทำงานทั้งเว็บ (ยกเว้นไฟล์ภายใน/สตาติก)
 *  และเพิ่ม /api/admin แยก เพื่อให้ auth กับ admin API ใช้ได้
 */
export const config = {
  matcher: [
    // ทั้งหมด ยกเว้น _next, รูปสตาติก, และ /api (นอกจาก admin จะเพิ่มบรรทัดถัดไป)
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|images|assets|public|api).*)",
    // รวม admin API เพื่อเช็คสิทธิ์
    "/api/admin/:path*",
  ],
};
