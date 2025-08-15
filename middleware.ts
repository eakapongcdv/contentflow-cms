// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  // (ไม่ต้องมีฟังก์ชัน middleware เพิ่ม หากไม่ต้องแตะ request)
  {
    pages: { signIn: "/admin/login" },
    callbacks: {
      authorized: ({ token, req }) => {
        const p = req.nextUrl.pathname;

        // อนุญาตหน้าล็อกอินเสมอ เพื่อกัน redirect loop
        if (p.startsWith("/admin/login")) return true;

        // ตรวจสิทธิ์เฉพาะส่วนแอดมิน
        const isAdmin = p.startsWith("/admin") || p.startsWith("/api/admin");
        return isAdmin ? !!token : true;
      },
    },
  }
);

export const config = {
  // บังคับเฉพาะเส้นทางแอดมิน (ทั้งเพจและ API)
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
