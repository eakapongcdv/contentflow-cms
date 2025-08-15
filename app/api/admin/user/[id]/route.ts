// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";
import bcrypt from "bcryptjs";

async function getGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const websiteId = cookies().get("websiteId")?.value || null;

  const me = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, role: true },
  });
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  if (me.role === "ADMIN" && !websiteId) {
    return { me, websiteId: null, can: () => true };
  }

  let rules: any[] = [];
  if (me.role === "ADMIN") {
    rules = [{ resource: "*", action: "ALL", effect: "ALLOW" }];
  } else if (websiteId) {
    rules = await getEffectiveRulesForUser({ userId: me.id, userRole: me.role, websiteId });
  }
  const can = makeCan(rules as any);
  return { me, websiteId, can };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const guard = await getGuard();
  // @ts-ignore
  if (guard.error) return guard.error;
  const { can, websiteId } = guard as any;

  if (!can("READ", "res:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      groups: {
        where: websiteId ? { group: { websiteId } } : undefined,
        select: { group: { select: { id: true, name: true, websiteId: true } } },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...user,
    groups: user.groups.map((m) => m.group),
  });
}

// PUT /api/admin/users/[id]
// body: { name?, role?, password?, groupIds?: string[] }  => groupIds apply to *current website* only
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const guard = await getGuard();
  // @ts-ignore
  if (guard.error) return guard.error;
  const { can, websiteId, me } = guard as any;

  if (!can("UPDATE", "res:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.role === "string") data.role = body.role;

  if (body.password && typeof body.password === "string") {
    if (body.password.length < 6) return NextResponse.json({ error: "Password too short" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(body.password, 10);
  }

  // Update user basic fields
  const updated = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Update group membership for current website (if groupIds provided)
  if (Array.isArray(body.groupIds)) {
    if (!websiteId) {
      // If ADMIN without website, skip group update (no scope)
    } else {
      const groups = await prisma.userGroup.findMany({
        where: { websiteId },
        select: { id: true },
      });
      const allowedGroupIds = new Set(groups.map((g) => g.id));
      const next = (body.groupIds as string[]).filter((g) => allowedGroupIds.has(g));

      // remove memberships under this website not in 'next'
      await prisma.userGroupMember.deleteMany({
        where: {
          userId: params.id,
          group: { websiteId },
          NOT: { groupId: { in: next } },
        },
      });
      // add missing
      for (const gid of next) {
        await prisma.userGroupMember.upsert({
          where: { groupId_userId: { groupId: gid, userId: params.id } },
          create: { groupId: gid, userId: params.id },
          update: {},
        });
      }
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const guard = await getGuard();
  // @ts-ignore
  if (guard.error) return guard.error;
  const { can, me } = guard as any;

  if (!can("DELETE", "res:users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (me.id === params.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
