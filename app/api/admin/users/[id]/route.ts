// app/api/admin/users/[id]/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";
import bcrypt from "bcryptjs";

async function getMe() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const sid = (session.user as any).id as string | undefined;
  const email = session.user.email as string | undefined;

  let me: { id: string; role: "USER" | "ADMIN" } | null = null;
  if (sid) me = await prisma.user.findUnique({ where: { id: sid }, select: { id: true, role: true } });
  if (!me && email) me = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  return { me };
}

async function getGuard() {
  const base = await getMe();
  // @ts-ignore
  if (base.error) return base;
  const { me } = base as { me: { id: string; role: "USER" | "ADMIN" } };

  const websiteId = cookies().get("websiteId")?.value || null;

  if (me.role === "ADMIN") return { me, websiteId, can: () => true };
  if (!websiteId) return { error: NextResponse.json({ error: "No website selected" }, { status: 400 }) };

  const rules = await getEffectiveRulesForUser({ userId: me.id, userRole: me.role, websiteId });
  const can = makeCan(rules as any);
  return { me, websiteId, can };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await getGuard();
    // @ts-ignore
    if (guard.error) return guard.error;
    const { can, websiteId } = guard as any;

    if (!can("READ", "res:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const u = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let groups: { id: string; name: string; websiteId: string | null }[] = [];
    if (websiteId) {
      const memberships = await prisma.userGroupMember.findMany({
        where: { userId: params.id, group: { websiteId } },
        select: { group: { select: { id: true, name: true, websiteId: true } } },
      });
      groups = memberships.map((m) => m.group);
    }

    return NextResponse.json({ ...u, groups });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await getGuard();
    // @ts-ignore
    if (guard.error) return guard.error;
    const { can, websiteId } = guard as any;

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

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (Array.isArray(body.groupIds) && websiteId) {
      const groups = await prisma.userGroup.findMany({ where: { websiteId }, select: { id: true } });
      const allowed = new Set(groups.map((g) => g.id));
      const next = (body.groupIds as string[]).filter((g) => allowed.has(g));

      await prisma.userGroupMember.deleteMany({
        where: { userId: params.id, group: { websiteId }, NOT: { groupId: { in: next } } },
      });
      for (const gid of next) {
        await prisma.userGroupMember.upsert({
          where: { groupId_userId: { groupId: gid, userId: params.id } },
          create: { groupId: gid, userId: params.id },
          update: {},
        });
      }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
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
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: e?.message || String(e) }, { status: 500 });
  }
}
