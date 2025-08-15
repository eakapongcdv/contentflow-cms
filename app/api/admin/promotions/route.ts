// app/api/admin/promotions/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/* ---------------- Utils ---------------- */
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeKeywords(v: unknown): string | null {
  // รับได้ทั้ง array หรือ string -> แปลงเป็น comma-separated string
  if (Array.isArray(v)) {
    const out = v.map((x) => String(x).trim()).filter(Boolean).join(", ");
    return out || null;
  }
  if (typeof v === "string") {
    const out = v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");
    return out || null;
  }
  return null;
}

function parseLegacyKeywords(legacy: string | null | undefined): {
  th: string | null;
  en: string | null;
} {
  if (!legacy || typeof legacy !== "string") return { th: null, en: null };
  const src = legacy.trim();
  if (!src) return { th: null, en: null };

  // รองรับรูปแบบเดิม: "th: รองเท้า, เสื้อผ้า | en: shoes, fashion"
  const mTh = src.match(/th:\s*([^|]+)/i);
  const mEn = src.match(/en:\s*([^|]+)/i);

  if (mTh || mEn) {
    const th = mTh ? mTh[1].trim() : null;
    const en = mEn ? mEn[1].trim() : null;
    return { th: th || null, en: en || null };
  }

  // ถ้าไม่มี prefix ภาษา ให้โยนเข้า TH เป็นดีฟอลต์ (เพื่อความเข้ากันได้ย้อนหลัง)
  return { th: src, en: null };
}

function buildPromotionData(input: any) {
  return {
    externalId: input?.externalId ?? null,
    occupantId: input?.occupantId ?? null,
    featureId: input?.featureId ?? null,
    category: input?.category ?? null,
    venueId: input?.venueId ?? null,
    localCategoryIds: toArray(input?.localCategoryIds),

    nameEn: input?.nameEn ?? "",
    nameTh: input?.nameTh ?? null,
    descriptionEn: input?.descriptionEn ?? null,
    descriptionTh: input?.descriptionTh ?? null,

    startDate: input?.startDate ? new Date(input.startDate) : new Date(),
    endDate: input?.endDate ? new Date(input.endDate) : new Date(),
    dailyStartTime: input?.dailyStartTime || null,
    dailyEndTime: input?.dailyEndTime || null,

    isFeatured: !!input?.isFeatured,
    websiteLink: input?.websiteLink || null,

    coverImageUrl: input?.coverImageUrl || null,
    coverImageW: Number.isFinite(+input?.coverImageW) ? +input.coverImageW : null,
    coverImageH: Number.isFinite(+input?.coverImageH) ? +input.coverImageH : null,
    coverThumbUrl: input?.coverThumbUrl || null,
    coverSmallUrl: input?.coverSmallUrl || null,
    logoUrl: input?.logoUrl || null,
    galleryJson: input?.galleryJson ?? null,

    locale: input?.locale || null,
    order: Number.isFinite(+input?.order) ? +input.order : null,
    reference: input?.reference || null,
    style: input?.style || null,

    createdAtRaw: input?.createdAtRaw ? new Date(input.createdAtRaw) : null,
    updatedAtRaw: input?.updatedAtRaw ? new Date(input.updatedAtRaw) : null,
    publishedAt: input?.publishedAt ? new Date(input.publishedAt) : null,
  };
}

function buildSeoData(seo: any) {
  if (!seo) return null;

  // structuredData รองรับทั้ง string (JSON) และ object
  let structuredData: any = null;
  if (seo.structuredData != null) {
    if (typeof seo.structuredData === "string") {
      const s = seo.structuredData.trim();
      if (s) {
        try {
          structuredData = JSON.parse(s);
        } catch {
          // ถ้า parse ไม่ได้ เก็บ string เดิมไว้ (เผื่อจะ handle ต่อภายหลัง)
          structuredData = s as any;
        }
      }
    } else if (typeof seo.structuredData === "object") {
      structuredData = seo.structuredData;
    }
  }

  // 🔹 คีย์เวิร์ดแบบใหม่ (แยกภาษา)
  let metaKeywordsTh = normalizeKeywords(seo.metaKeywordsTh);
  let metaKeywordsEn = normalizeKeywords(seo.metaKeywordsEn);

  // 🔸 backward-compat: ถ้ามีฟิลด์ legacy metaKeywords ให้พยายามแตกเป็น TH/EN
  if (!metaKeywordsTh && !metaKeywordsEn && seo.metaKeywords) {
    const legacy = parseLegacyKeywords(seo.metaKeywords);
    metaKeywordsTh = normalizeKeywords(legacy.th);
    metaKeywordsEn = normalizeKeywords(legacy.en);
  }

  return {
    metaTitleTh: seo.metaTitleTh ?? null,
    metaTitleEn: seo.metaTitleEn ?? null,
    metaDescriptionTh: seo.metaDescriptionTh ?? null,
    metaDescriptionEn: seo.metaDescriptionEn ?? null,

    // ✅ ใช้ช่องใหม่
    metaKeywordsTh,
    metaKeywordsEn,

    ogTitle: seo.ogTitle ?? null,
    ogDescription: seo.ogDescription ?? null,
    ogImageUrl: seo.ogImageUrl ?? null,
    canonicalUrl: seo.canonicalUrl ?? null,
    robotsNoindex: !!seo.robotsNoindex,
    robotsNofollow: !!seo.robotsNofollow,
    structuredData: structuredData ?? null,
  };
}

/* ---------------- GET (list) ---------------- */
/**
 * GET /api/admin/promotions
 * Query:
 *  - q, venueId, occupantId, featured, from, to, locale
 *  - page (default 1), per (default 20, max 100)
 *  - sort: startDate | endDate | createdAt | order (default startDate)
 *  - dir:  asc | desc (default desc)
 *  - includeSeo: "1" | "true"  -> แนบ seo ของแต่ละแถว (จะมี metaKeywordsTh/metaKeywordsEn)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const venueId = url.searchParams.get("venueId") || undefined;
    const occupantId = url.searchParams.get("occupantId") || undefined;
    const featured = url.searchParams.get("featured");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const locale = url.searchParams.get("locale") || undefined;
    const includeSeo = /^(1|true)$/i.test(url.searchParams.get("includeSeo") || "");

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const per = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per") || "20", 10)));

    const sort = (url.searchParams.get("sort") || "startDate") as
      | "startDate"
      | "endDate"
      | "createdAt"
      | "order";
    const dir = (url.searchParams.get("dir") || "desc") as "asc" | "desc";

    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    const where: any = {};
    if (q) {
      where.OR = [
        { nameEn: { contains: q, mode: "insensitive" } },
        { nameTh: { contains: q, mode: "insensitive" } },
        { descriptionEn: { contains: q, mode: "insensitive" } },
        { descriptionTh: { contains: q, mode: "insensitive" } },
        { venueId: { contains: q, mode: "insensitive" } },
        ...(tokens.length ? [{ localCategoryIds: { hasSome: tokens } } as any] : []),
      ];
    }
    if (venueId) where.venueId = venueId;
    if (occupantId) where.occupantId = occupantId;
    if (featured) where.isFeatured = /^(1|true)$/i.test(featured);
    if (from) where.startDate = { ...(where.startDate || {}), gte: new Date(from) };
    if (to) where.endDate = { ...(where.endDate || {}), lte: new Date(to) };
    if (locale) where.locale = locale;

    const orderBy =
      sort === "endDate" ? { endDate: dir } :
      sort === "createdAt" ? { createdAt: dir } :
      sort === "order" ? { order: dir } :
      { startDate: dir };

    const [total, items] = await Promise.all([
      prisma.promotion.count({ where }),
      prisma.promotion.findMany({
        where,
        orderBy,
        skip: (page - 1) * per,
        take: per,
      }),
    ]);

    let out = items as any[];

    if (includeSeo && items.length) {
      const ids = items.map((i) => i.id);
      const seoList = await prisma.seoMeta.findMany({
        where: { contentType: "promotion", targetId: { in: ids } },
        // Prisma จะคืนทุกฟิลด์รวม metaKeywordsTh/En ให้อยู่แล้ว
      });
      const map = new Map(seoList.map((s) => [s.targetId, s]));
      out = items.map((it) => ({ ...it, seo: map.get(it.id) ?? null }));
    }

    return NextResponse.json({
      items: out,
      page,
      per,
      total,
      pageCount: Math.max(1, Math.ceil(total / per)),
      sortBy: sort,
      dir,
    });
  } catch (e) {
    console.error("GET /api/admin/promotions error:", e);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

/* ---------------- POST (create + SEO) ---------------- */
/** POST /api/admin/promotions  -> Body: Promotion fields + { seo?: SeoMetaPayload } */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = buildPromotionData(body);
    const seoData = buildSeoData(body?.seo);

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({ data });

      let createdSeo = null as any;
      if (seoData) {
        createdSeo = await tx.seoMeta.upsert({
          where: { contentType_targetId: { contentType: "promotion", targetId: created.id } },
          create: { contentType: "promotion", targetId: created.id, ...seoData },
          update: seoData,
        });
      }

      return { created, createdSeo };
    });

    return NextResponse.json({ ...result.created, seo: result.createdSeo ?? null }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/promotions error:", e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
