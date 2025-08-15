// app/api/admin/website/config/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";
import { cmsTemplate as defaultCmsTemplate } from "@/app/cms.config";

// --- guard (ADMIN allow-all; otherwise require website + RBAC) ---
async function getGuard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  // id or email
  const sid = (session.user as any).id as string | undefined;
  const email = session.user.email as string | undefined;
  const me =
    (sid && (await prisma.user.findUnique({ where: { id: sid }, select: { id: true, role: true } }))) ||
    (email && (await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } })));

  if (!me) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

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

function deepMerge<T>(base: any, override: any): T {
  if (!override) return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const k of Object.keys(override)) {
    const bv = (base as any)?.[k];
    const ov = override[k];
    (out as any)[k] =
      bv && typeof bv === "object" && !Array.isArray(bv) && ov && typeof ov === "object" && !Array.isArray(ov)
        ? deepMerge(bv, ov)
        : ov;
  }
  return out as T;
}

export async function GET() {
  const guard = await getGuard();
  // @ts-ignore
  if (guard.error) return guard.error;
  const { websiteId, can } = guard as any;

  if (!can("READ", "res:website")) {
    // ADMIN ผ่านได้อยู่แล้ว
    // ผู้ใช้ทั่วไปต้องมี READ website
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!websiteId) {
    return NextResponse.json({
      websiteId: null,
      name: null,
      cmsTemplate: defaultCmsTemplate,
      note: "No website selected. Showing defaults.",
    });
  }

  const site = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true, name: true, settings: true },
  });
  if (!site) return NextResponse.json({ error: "Website not found" }, { status: 404 });

  const overrides = (site.settings as any)?.cmsTemplate || null;
  const effective = deepMerge<typeof defaultCmsTemplate>(defaultCmsTemplate, overrides || {});

  return NextResponse.json({
    websiteId: site.id,
    name: site.name,
    cmsTemplate: effective,
    overrides: overrides || {},
  });
}

export async function PUT(req: Request) {
  const guard = await getGuard();
  // @ts-ignore
  if (guard.error) return guard.error;
  const { websiteId, can } = guard as any;

  if (!can("UPDATE", "res:website")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!websiteId) {
    return NextResponse.json({ error: "No website selected" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const nextCmsTemplate = body?.cmsTemplate;
  if (!nextCmsTemplate || typeof nextCmsTemplate !== "object") {
    return NextResponse.json({ error: "Invalid payload (cmsTemplate object required)" }, { status: 400 });
  }

  // merge into Website.settings.cmsTemplate
  const site = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true, settings: true },
  });
  if (!site) return NextResponse.json({ error: "Website not found" }, { status: 404 });

  const currentSettings = (site.settings as any) || {};
  const mergedSettings = {
    ...currentSettings,
    cmsTemplate: { ...(currentSettings.cmsTemplate || {}), ...nextCmsTemplate },
  };

  await prisma.website.update({
    where: { id: websiteId },
    data: { settings: mergedSettings },
    select: { id: true },
  });

  // return effective after update
  const effective = deepMerge(defaultCmsTemplate, mergedSettings.cmsTemplate);
  return NextResponse.json({ ok: true, websiteId, cmsTemplate: effective, overrides: mergedSettings.cmsTemplate });
}
