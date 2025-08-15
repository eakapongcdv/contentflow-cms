// app/api/admin/articles/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ArticleStatus, Locale3 } from "@prisma/client";
import { cookies } from "next/headers";

/* ----------------------------- utils ----------------------------- */
function slugify(s?: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\- ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

/** อ่าน websiteId: header > query > cookie */
function readWebsiteId(req: Request) {
  const url = new URL(req.url);
  const fromHeader = req.headers.get("x-website-id") || undefined;
  const fromQuery = url.searchParams.get("websiteId") || undefined;
  let fromCookie: string | undefined;
  try {
    fromCookie = cookies().get("websiteId")?.value || undefined;
  } catch {
    fromCookie = undefined;
  }
  return fromHeader || fromQuery || fromCookie;
}

function asLocale3(x?: string | null): Locale3 {
  const v = (x || "TH").toUpperCase();
  return v === "EN" ? Locale3.EN : v === "CN" ? Locale3.CN : Locale3.TH;
}

function readLocale(req: Request) {
  const url = new URL(req.url);
  const fromHeader = req.headers.get("x-locale");
  const fromQuery = url.searchParams.get("locale");
  let fromCookie: string | undefined;
  try {
    fromCookie = cookies().get("locale")?.value || undefined;
  } catch {
    fromCookie = undefined;
  }
  return asLocale3(fromHeader || fromQuery || fromCookie || "TH");
}

function parseStatus(s?: string | null): ArticleStatus | undefined {
  if (!s) return undefined;
  const up = s.toUpperCase();
  return (["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const).includes(up as any)
    ? (up as ArticleStatus)
    : undefined;
}

/* =================================================================
   GET /api/admin/articles
   - list ตามเว็บไซต์ + locale
   - ค้นหาจาก ArticleI18n (title/slug/excerpt)
   ================================================================= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const websiteId = readWebsiteId(req);
  if (!websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });

  const q = (url.searchParams.get("q") || "").trim();
  const take = Math.min(Number(url.searchParams.get("take") || 20), 100);
  const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
  const skip = (page - 1) * take;
  const status = parseStatus(url.searchParams.get("status"));
  const locale = readLocale(req);

  const where = {
    websiteId,
    ...(status ? { status } : {}),
    ...(q
      ? {
          i18n: {
            some: {
              locale,
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
                { excerpt: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        }
      : {}),
  } as const;

  const orderBy = [
    { status: "asc" as const },
    { publishedAt: "desc" as const },
    { createdAt: "desc" as const },
  ];

  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        status: true,
        coverImageUrl: true,
        authorName: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
        i18n: { where: { locale }, take: 1, select: { title: true, slug: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const items = rows.map((r) => {
    const i = r.i18n[0];
    return {
      id: r.id,
      title: i?.title || "",
      slug: i?.slug || "",
      status: r.status,
      coverImageUrl: r.coverImageUrl,
      authorName: r.authorName,
      readingTime: r.readingTime,
      publishedAt: r.publishedAt,
      createdAt: r.createdAt,
    };
  });

  return NextResponse.json({ items, total, page, take });
}

/* =================================================================
   POST /api/admin/articles
   - สร้าง Article + แปลต่อภาษาใน ArticleI18n (TH/EN/CN)
   - รองรับ tags / categories และ SeoMeta
   ================================================================= */
export async function POST(req: Request) {
  const body = await req.json();
  const websiteId: string | undefined = readWebsiteId(req) || body.websiteId;
  if (!websiteId) return NextResponse.json({ error: "websiteId required" }, { status: 400 });

  const status: ArticleStatus = parseStatus(body.status) || ArticleStatus.DRAFT;

  const th = body.i18n?.th || body.translations?.th || {};
  const en = body.i18n?.en || body.translations?.en || {};
  const cn = body.i18n?.cn || body.translations?.cn || {};

  const toCreateI18n = (
    [
      [Locale3.TH, th],
      [Locale3.EN, en],
      [Locale3.CN, cn],
    ] as const
  )
    .filter(([, v]) => v && (v.title || v.slug || v.subtitle || v.excerpt || v.contentMd || v.contentHtml))
    .map(([locale, v]) => ({
      websiteId,
      locale,
      title: v.title || "",
      slug: v.slug ? String(v.slug) : slugify(v.title || ""),
      subtitle: v.subtitle ?? null,
      excerpt: v.excerpt ?? null,
      contentMd: v.contentMd ?? null,
      contentHtml: v.contentHtml ?? null,
    }));

  const created = await prisma.article.create({
    data: {
      websiteId,
      status,
      coverImageUrl: body.coverImageUrl ?? null,
      coverImageW: body.coverImageW ?? null,
      coverImageH: body.coverImageH ?? null,
      authorName: body.authorName ?? null,
      readingTime: body.readingTime ?? null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      reference: body.reference ?? null,
      order: body.order ?? 0,

      i18n: toCreateI18n.length ? { create: toCreateI18n } : undefined,

      tags:
        Array.isArray(body.tagIds) && body.tagIds.length
          ? { createMany: { data: body.tagIds.map((tagId: string) => ({ tagId })) } }
          : undefined,
      categories:
        Array.isArray(body.categoryIds) && body.categoryIds.length
          ? { createMany: { data: body.categoryIds.map((categoryId: string) => ({ categoryId })) } }
          : undefined,
    },
    select: { id: true },
  });

  if (body.seo) {
    const s = body.seo;
    await prisma.seoMeta.upsert({
      where: { contentType_targetId: { contentType: "article", targetId: created.id } },
      create: {
        contentType: "article",
        targetId: created.id,
        metaTitleTh: s.metaTitleTh ?? null,
        metaTitleEn: s.metaTitleEn ?? null,
        metaDescriptionTh: s.metaDescriptionTh ?? null,
        metaDescriptionEn: s.metaDescriptionEn ?? null,
        metaKeywordsTh: s.metaKeywordsTh ?? null,
        metaKeywordsEn: s.metaKeywordsEn ?? null,
        ogTitle: s.ogTitle ?? null,
        ogDescription: s.ogDescription ?? null,
        ogImageUrl: s.ogImageUrl ?? null,
        canonicalUrl: s.canonicalUrl ?? null,
        robotsNoindex: !!s.robotsNoindex,
        robotsNofollow: !!s.robotsNofollow,
        structuredData: s.structuredData ?? null,
      },
      update: {
        metaTitleTh: s.metaTitleTh ?? null,
        metaTitleEn: s.metaTitleEn ?? null,
        metaDescriptionTh: s.metaDescriptionTh ?? null,
        metaDescriptionEn: s.metaDescriptionEn ?? null,
        metaKeywordsTh: s.metaKeywordsTh ?? null,
        metaKeywordsEn: s.metaKeywordsEn ?? null,
        ogTitle: s.ogTitle ?? null,
        ogDescription: s.ogDescription ?? null,
        ogImageUrl: s.ogImageUrl ?? null,
        canonicalUrl: s.canonicalUrl ?? null,
        robotsNoindex: !!s.robotsNoindex,
        robotsNofollow: !!s.robotsNofollow,
        structuredData: s.structuredData ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
