// app/api/admin/website/stylesheet/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getEffectiveRulesForUser, makeCan } from "@/app/lib/perm";

type Tokens = {
  primary: string;
  navy: string;
  link: string;
  bg: string;
  surface: string;
  muted: string;
  darkBg: string;
  darkSurface: string;
  darkMuted: string;
};

const DEFAULT_TOKENS: Tokens = {
  primary: "#34bcb1",
  navy: "#0f2d53",
  link: "#6d6d6d",
  bg: "#ffffff",
  surface: "#ffffff",
  muted: "#6b7280",
  darkBg: "#0b1424",
  darkSurface: "#0f1b31",
  darkMuted: "#92a0b5",
};

const DEFAULT_RAW = `/* Variables only (generated from defaults) */
:root{
  --zp-primary: ${DEFAULT_TOKENS.primary};
  --zp-navy: ${DEFAULT_TOKENS.navy};
  --zp-link: ${DEFAULT_TOKENS.link};
  --zp-bg: ${DEFAULT_TOKENS.bg};
  --zp-surface: ${DEFAULT_TOKENS.surface};
  --zp-muted: ${DEFAULT_TOKENS.muted};
}
@media (prefers-color-scheme: dark){
  :root{
    --zp-bg:${DEFAULT_TOKENS.darkBg};
    --zp-surface:${DEFAULT_TOKENS.darkSurface};
    --zp-muted:${DEFAULT_TOKENS.darkMuted};
  }
}`.trim();

function deepMerge<T extends Record<string, any>>(base: T, override?: Partial<T>): T {
  if (!override) return base;
  const out: any = { ...base };
  for (const k of Object.keys(override)) {
    const bv = (base as any)[k];
    const ov = (override as any)[k];
    out[k] = typeof bv === "object" && bv && typeof ov === "object" && ov ? deepMerge(bv, ov) : ov;
  }
  return out as T;
}

async function guard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const sid = (session.user as any).id as string | undefined;
  const email = session.user.email || undefined;
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

// build CSS from tokens
function cssFromTokens(tokens: Tokens) {
  return `:root{
  --zp-primary: ${tokens.primary};
  --zp-navy: ${tokens.navy};
  --zp-link: ${tokens.link};
  --zp-bg: ${tokens.bg};
  --zp-surface: ${tokens.surface};
  --zp-muted: ${tokens.muted};
}
@media (prefers-color-scheme: dark){
  :root{
    --zp-bg:${tokens.darkBg};
    --zp-surface:${tokens.darkSurface};
    --zp-muted:${tokens.darkMuted};
  }
}`.trim();
}

export async function GET() {
  const g = await guard();
  // @ts-ignore
  if (g.error) return g.error;
  const { websiteId, can } = g as any;

  if (!can("READ", "res:website")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!websiteId) {
    // ไม่มีเว็บไซต์ → ส่ง defaults
    return NextResponse.json({
      websiteId: null,
      style: {
        mode: "tokens",
        templateName: "Default",
        tokens: DEFAULT_TOKENS,
        rawCss: DEFAULT_RAW,
      },
      defaults: { tokens: DEFAULT_TOKENS, rawCss: DEFAULT_RAW },
      note: "No website selected. Showing defaults.",
    });
  }

  const site = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true, settings: true, name: true },
  });
  if (!site) return NextResponse.json({ error: "Website not found" }, { status: 404 });

  const style = ((site.settings as any)?.stylesheet || {}) as {
    mode?: "tokens" | "css";
    templateName?: string;
    tokens?: Partial<Tokens>;
    rawCss?: string;
  };

  const mergedTokens = deepMerge(DEFAULT_TOKENS, style.tokens || {});
  const effectiveCss = style.mode === "css" && style.rawCss ? style.rawCss : cssFromTokens(mergedTokens);

  return NextResponse.json({
    websiteId: site.id,
    name: site.name,
    style: {
      mode: style.mode || "tokens",
      templateName: style.templateName || "Custom",
      tokens: mergedTokens,
      rawCss: style.rawCss || effectiveCss,
    },
    defaults: { tokens: DEFAULT_TOKENS, rawCss: DEFAULT_RAW },
  });
}

export async function PUT(req: Request) {
  const g = await guard();
  // @ts-ignore
  if (g.error) return g.error;
  const { websiteId, can } = g as any;

  if (!can("UPDATE", "res:website")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!websiteId) {
    return NextResponse.json({ error: "No website selected" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  let { mode, templateName, tokens, rawCss } = body || {};
  if (mode !== "tokens" && mode !== "css") {
    return NextResponse.json({ error: "Invalid mode (tokens|css)" }, { status: 400 });
  }
  if (mode === "tokens") {
    tokens = { ...DEFAULT_TOKENS, ...(tokens || {}) };
  } else {
    rawCss = typeof rawCss === "string" ? rawCss : DEFAULT_RAW;
  }

  const site = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true, settings: true },
  });
  if (!site) return NextResponse.json({ error: "Website not found" }, { status: 404 });

  const current = (site.settings as any) || {};
  const nextSettings = {
    ...current,
    stylesheet: {
      ...(current.stylesheet || {}),
      mode,
      templateName: templateName || (current.stylesheet?.templateName ?? "Custom"),
      tokens: mode === "tokens" ? tokens : (current.stylesheet?.tokens ?? DEFAULT_TOKENS),
      rawCss: mode === "css" ? rawCss : cssFromTokens(tokens || DEFAULT_TOKENS),
    },
  };

  await prisma.website.update({
    where: { id: websiteId },
    data: { settings: nextSettings },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, websiteId });
}
