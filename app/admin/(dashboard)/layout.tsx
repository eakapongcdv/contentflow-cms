// app/admin/(dashboard)/layout.tsx
import AdminNav from "./admin-nav";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { WebsiteProvider } from "./website-provider";

// ⬇️ RBAC: ดึงเซสชัน + คำนวณสิทธิ์ของผู้ใช้บนเว็บไซต์ปัจจุบัน
import { getServerSession } from "next-auth";
// ปรับ path นี้ให้ตรงกับโปรเจกต์ของคุณ หากไฟล์ auth-options อยู่ตำแหน่งอื่น
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser } from "@/app/lib/perm";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // อ่าน websiteId จากคุกกี้
  const websiteId = cookies().get("websiteId")?.value || null;

  // ดึงชื่อ/ข้อมูลเว็บไซต์จาก DB (ถ้ามี websiteId)
  const website = websiteId
    ? await prisma.website.findUnique({
        where: { id: websiteId },
        select: { id: true, name: true },
      })
    : null;

  const websiteName = website?.name ?? null;

  // RBAC: หา user + rules ที่มีผลสำหรับเว็บไซต์นี้
  const session = await getServerSession(authOptions).catch(() => null);

  let rules:
    | Array<{ resource: string; action: string; effect: "ALLOW" | "DENY" }>
    | [] = [];

  if (session?.user?.id && website?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { role: true },
    });

    if (user) {
      rules = await getEffectiveRulesForUser({
        userId: session.user.id as string,
        userRole: user.role,
        websiteId: website.id,
      });
    }
  }

  return (
    <WebsiteProvider>
      <div className="container-narrow section min-h-full">
        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          {/* Left nav (ส่ง website + rules ให้เมนูกรองตามสิทธิ์) */}
          <aside className="card p-2 self-start md:sticky md:top-6 h-max">
            <AdminNav
              websiteId={website?.id || ""}
              websiteName={websiteName || undefined}
              initialRules={rules}
            />
          </aside>

          {/* Main */}
          <main className="min-h-full">
            {children}
          </main>
        </div>
      </div>
    </WebsiteProvider>
  );
}
