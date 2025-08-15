// app/api/admin/users/route.ts
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

  // ADMIN fallback (even if no website selected)
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

// GET /api/admin/users?q=&page=&take=
export async function GET(req: Request) {
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

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
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
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  const mapped = items.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    groups: u.groups.map((m) => m.group),
  }));

  return NextResponse.json({ items: mapped, total, page, take });
}

// POST /api/admin/users  { name, email, role?, password? }
export async function POST(req: Request) {
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
}
