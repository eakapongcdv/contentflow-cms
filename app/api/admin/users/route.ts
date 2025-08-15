// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";
import bcrypt from "bcryptjs";

/** Safely resolve current user (by id or email) */
async function getMe() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const sid = (session.user as any).id as string | undefined;
  const email = session.user.email as string | undefined;

  let me: { id: string; role: "USER" | "ADMIN" } | null = null;
  if (sid) {
    me = await prisma.user.findUnique({ where: { id: sid }, select: { id: true, role: true } });
  }
  if (!me && email) {
    me = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
  }
  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  return { me };
}

/** Guard with ADMIN allow-all (even if no website selected) */
async function getGuard() {
  const base = await getMe();
  // @ts-ignore
  if (base.error) return base;
  const { me } = base as { me: { id: string; role: "USER" | "ADMIN" } };

  const websiteId = cookies().get("websiteId")?.value || null;

  if (me.role === "ADMIN") {
    return { me, websiteId, can: () => true };
  }
  if (!websiteId) {
    return { error: NextResponse.json({ error: "No website selected" }, { status: 400 }) };
  }

  const rules = await getEffectiveRulesForUser({ userId: me.id, userRole: me.role, websiteId });
  const can = makeCan(rules as any);
  return { me, websiteId, can };
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/** GET /api/admin/users?q=&page=&take= */
export async function GET(req: Request) {
  try {
    const guard = await getGuard();
    // @ts-ignore
    if (guard.error) return guard.error;
    const { can, websiteId } = guard as any;

    if (!can("READ", "res:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const take = Math.min(Number(url.searchParams.get("take") || 20), 100);
    const skip = (page - 1) * take;

    const where = q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
      : {};

    // 1) Load users (no nested groups)
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    // 2) Load memberships separately and join
    let groupMap = new Map<string, { id: string; name: string; websiteId: string | null }[]>();
    if (websiteId) {
      const ids = users.map((u) => u.id);
      if (ids.length) {
        const memberships = await prisma.userGroupMember.findMany({
          where: { userId: { in: ids }, group: { websiteId } },
          select: { userId: true, group: { select: { id: true, name: true, websiteId: true } } },
        });
        groupMap = memberships.reduce((m, row) => {
          const arr = m.get(row.userId) || [];
          arr.push(row.group);
          m.set(row.userId, arr);
          return m;
        }, new Map<string, { id: string; name: string; websiteId: string | null }[]>());
      }
    }

    const items = users.map((u) => ({
      ...u,
      groups: groupMap.get(u.id) || [],
    }));

    return NextResponse.json({ items, total, page, take });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: e?.message || String(e) }, { status: 500 });
  }
}

/** POST /api/admin/users  { name, email, role?, password? } */
export async function POST(req: Request) {
  try {
    const guard = await getGuard();
    // @ts-ignore
    if (guard.error) return guard.error;
    const { can } = guard as any;

    if (!can("CREATE", "res:users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, role = "USER", password } = body || {};
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    let passwordHash: string | undefined = undefined;
    if (password && typeof password === "string" && password.length >= 6) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const created = await prisma.user.create({
      data: { name: name || null, email, role, passwordHash: passwordHash || "" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal Server Error", detail: e?.message || String(e) }, { status: 500 });
  }
}
