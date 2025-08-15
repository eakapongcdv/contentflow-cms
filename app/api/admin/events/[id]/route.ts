// app/api/admin/events/[id]/route.ts
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

  // structuredData: รับได้ทั้ง string (JSON) หรือ object
  let structuredData: any = null;
  if (seo.structuredData != null) {
    if (typeof seo.structuredData === "string") {
      const s = seo.structuredData.trim();
      if (s) {
        try {
          structuredData = JSON.parse(s);
        } catch {
          // ถ้า parse ไม่ผ่าน เก็บเป็น string เดิมในฟิลด์ JSON ก็ยังได้ (Prisma จะ serialize ให้)
          structuredData = s as any;
        }
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

/* ---------------- Handlers ---------------- */

// GET /api/admin/events/[id] -> คืน event + seo
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const seo = await prisma.seoMeta.findUnique({
      where: { contentType_targetId: { contentType: "event", targetId: params.id } },
    });

    return NextResponse.json({ ...event, seo: seo ?? null });
  } catch (e) {
    console.error("GET /api/admin/events/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PUT /api/admin/events/[id] -> อัปเดต event + upsert seo (ถ้าส่งมา)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const eventData = buildEventData(body);
    const seoData = buildSeoData(body?.seo);

    const result = await prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: { id: params.id },
        data: eventData,
      });

      let updatedSeo = null as any;
      if (seoData) {
        updatedSeo = await tx.seoMeta.upsert({
          where: { contentType_targetId: { contentType: "event", targetId: params.id } },
          create: { contentType: "event", targetId: params.id, ...seoData },
          update: seoData,
        });
      }

      return { updatedEvent, updatedSeo };
    });

    return NextResponse.json({ ...result.updatedEvent, seo: result.updatedSeo ?? null });
  } catch (e) {
    console.error("PUT /api/admin/events/[id] error:", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

// DELETE /api/admin/events/[id] -> ลบ seo ของ event นั้น แล้วลบ event
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction([
      prisma.seoMeta.deleteMany({ where: { contentType: "event", targetId: params.id } }),
      prisma.event.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/events/[id] error:", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
