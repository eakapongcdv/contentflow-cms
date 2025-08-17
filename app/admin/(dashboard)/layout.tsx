// app/admin/(dashboard)/layout.tsx
import AdminNav from "@/app/components/admin-nav";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { WebsiteProvider } from "./website-provider";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser } from "@/app/lib/perm";

import AdminTopBar from "./AdminTopBar";

export default async function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const ck = cookies();
  const websiteId = ck.get("websiteId")?.value || null;
  const locale = (ck.get("locale")?.value || "th") as "th" | "en" | "cn";

  // เว็บไซต์ (สำหรับ RBAC server-side เท่านั้น)
  const website = websiteId
    ? await prisma.website.findUnique({ where: { id: websiteId }, select: { id: true, name: true } })
    : null;

  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id as string | undefined;

  let rules: Array<{ resource: string; action: string; effect: "ALLOW" | "DENY" }> = [];
  let userRole: string | null = null;

  if (userId && website?.id) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    userRole = user?.role ?? null;
    if (user) {
      rules = await getEffectiveRulesForUser({
        userId,
        userRole: user.role,
        websiteId: website.id,
      });
    }
  }

  return (
    <WebsiteProvider>
      <div className="mx-auto px-4 py-8">
        <AdminTopBar
          userName={(session?.user?.name as string) || null}
          userEmail={(session?.user?.email as string) || null}
          userImage={(session?.user?.image as string) || null}
          userRole={userRole}
          locale={locale}
        />

        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          <aside className="admin-card admin-sidenav p-3 h-max md:sticky md:top-6 self-start" role="navigation" aria-label="Admin navigation">
            <AdminNav
              websiteId={website?.id || ""}
              websiteName={website?.name || undefined}
              initialRules={rules}
            />
          </aside>

          {/* คอนเทนต์สว่าง + ตัวอักษรเข้ม */}
          <main id="main" className="admin-content min-h-[60vh] space-y-6">
            {children}
          </main>
        </div>
      </div>
    </WebsiteProvider>
  );
}
