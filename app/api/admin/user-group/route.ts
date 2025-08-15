import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const websiteId = cookies().get("websiteId")?.value || null;

  const me = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, role: true },
  });
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ FIX: กำหนดชนิดให้ตรงกับฟังก์ชันที่ makeCan คืนมา (action, resource) => boolean
  let can: ReturnType<typeof makeCan> = (_action, _resource) => false;

  if (me.role === "ADMIN" && !websiteId) {
    // super admin (ไม่ผูก website) → allow ทั้งหมด
    can = (_action, _resource) => true;
  } else {
    let rules: any[] = [];
    if (me.role === "ADMIN") {
      rules = [{ resource: "*", action: "ALL", effect: "ALLOW" }];
    } else if (websiteId) {
      rules = await getEffectiveRulesForUser({
        userId: me.id,
        userRole: me.role,
        websiteId,
      });
    }
    can = makeCan(rules as any);
  }

  if (!can("READ", "res:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!websiteId) {
    // ADMIN ไม่ระบุ website: คืนทั้งหมด
    const groups = await prisma.userGroup.findMany({
      select: { id: true, name: true, websiteId: true },
      orderBy: [{ name: "asc" }],
    });
    return NextResponse.json({ items: groups });
  }

  const groups = await prisma.userGroup.findMany({
    where: { websiteId },
    select: { id: true, name: true, websiteId: true },
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json({ items: groups });
}
