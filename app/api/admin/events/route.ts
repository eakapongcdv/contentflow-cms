// app/api/events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/* ---------------- Utils ---------------- */
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function buildEventData(input: any) {
  return {
    externalId: input?.externalId ?? null,

    // names/descriptions
    nameEn: input?.nameEn ?? "",
    nameTh: input?.nameTh ?? null,
    descriptionEn: input?.descriptionEn ?? null,
    descriptionTh: input?.descriptionTh ?? null,

    // dates
    startDate: input?.startDate ? new Date(input.startDate) : new Date(),
    endDate: input?.endDate ? new Date(input.endDate) : new Date(),

    // daily time windows
    dailyStartTime: input?.dailyStartTime || null, // "HH:mm:ss"
    dailyEndTime: input?.dailyEndTime || null,

    // flags/links
    isFeatured: !!input?.isFeatured,
    websiteLink: input?.websiteLink || null,

    // relations/tags
    venueId: input?.venueId || null,
    localCategoryIds: toArray(input?.localCategoryIds),

    // images
    coverImageUrl: input?.coverImageUrl || null,
    coverImageW: Number.isFinite(+input?.coverImageW) ? +input.coverImageW : null,
    coverImageH: Number.isFinite(+input?.coverImageH) ? +input.coverImageH : null,
    coverThumbUrl: input?.coverThumbUrl || null,
    coverSmallUrl: input?.coverSmallUrl || null,
    logoUrl: input?.logoUrl || null,
    galleryJson: input?.galleryJson ?? null,

    // meta
    locale: input?.locale || null,
    order: Number.isFinite(+input?.order) ? +input.order : null,
    reference: input?.reference || null,
    style: input?.style || null,

    // raw timestamps
    createdAtRaw: input?.createdAtRaw ? new Date(input.createdAtRaw) : null,
    updatedAtRaw: input?.updatedAtRaw ? new Date(input.updatedAtRaw) : null,
    publishedAt: input?.publishedAt ? new Date(input.publishedAt) : null,
  };
}

function buildSeoData(seo: any) {
  if (!seo) return null;

  // structuredData: รับทั้ง string(JSON) หรือ object
  let structuredData: any = null;
  if (seo.structuredData != null) {
    if (typeof seo.structuredData === "string") {
      const s = seo.structuredData.trim();
      if (s) {
        try { structuredData = JSON.parse(s); }
        catch { structuredData = s as any; }
      }
    } else if (typeof seo.structuredData === "object") {
      structuredData = seo.structuredData;
    }
  }

  return {
    metaTitleTh: seo.metaTitleTh ?? null,
    metaTitleEn: seo.metaTitleEn ?? null,
    metaDescriptionTh: seo.metaDescriptionTh ?? null,
    metaDescriptionEn: seo.metaDescriptionEn ?? null,
    metaKeywords: seo.metaKeywords ?? null,
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
 * GET /api/events
 * Query:
 *  - q: string (ค้นหา name/description/venueId/localCategoryIds)
 *  - venueId: string
 *  - featured: "1" | "true"
 *  - from: ISO date (startDate >=)
 *  - to:   ISO date (endDate   <=)
 *  - locale: string
 *  - page: number (default 1)
 *  - per: number  (default 20)
 *  - sort: "startDate" | "endDate" | "createdAt" | "order"  (default "startDate")
 *  - dir:  "asc" | "desc" (default "desc")
 *  - includeSeo: "1" | "true" (แนบ seo ของแต่ละรายการ; อาจช้าลง)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const venueId = url.searchParams.get("venueId") || undefined;
    const featured = url.searchParams.get("featured");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const locale = url.searchParams.get("locale") || undefined;
    const includeSeo = /^(1|true)$/i.test(url.searchParams.get("includeSeo") || "");

    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const per = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per") || "20", 10)));

    const sort = (url.searchParams.get("sort") || "startDate") as
      | "startDate" | "endDate" | "createdAt" | "order";
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
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * per,
        take: per,
      }),
    ]);

    let out = items as any[];

    // include SEO (ถ้าขอมา)
    if (includeSeo && items.length) {
      const ids = items.map((i) => i.id);
      const seoList = await prisma.seoMeta.findMany({
        where: { contentType: "event", targetId: { in: ids } },
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
    console.error("GET /api/events error:", e);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

/* ---------------- POST (create with SEO) ---------------- */
/**
 * POST /api/events
 * Body: Event fields + { seo?: SeoMetaPayload }
 * Response: { ...event, seo }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const eventData = buildEventData(body);
    const seoData = buildSeoData(body?.seo);

    const result = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({ data: eventData });

      let createdSeo = null as any;
      if (seoData) {
        createdSeo = await tx.seoMeta.upsert({
          where: {
            contentType_targetId: { contentType: "event", targetId: createdEvent.id },
          },
          create: { contentType: "event", targetId: createdEvent.id, ...seoData },
          update: seoData,
        });
      }

      return { createdEvent, createdSeo };
    });

    return NextResponse.json(
      { ...result.createdEvent, seo: result.createdSeo ?? null },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/events error:", e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
