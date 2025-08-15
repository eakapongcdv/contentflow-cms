// app/api/admin/promotions/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

/* -------- Utils (reuse) -------- */
function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function normalizeKeywords(v: unknown): string | null {
  // รองรับทั้ง array หรือ string -> แปลงเป็น comma-separated
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

  // รูปแบบเดิม: "th: รองเท้า, เสื้อผ้า | en: shoes, fashion"
  const mTh = src.match(/th:\s*([^|]+)/i);
  const mEn = src.match(/en:\s*([^|]+)/i);
  if (mTh || mEn) {
    const th = mTh ? mTh[1].trim() : null;
    const en = mEn ? mEn[1].trim() : null;
    return { th: th || null, en: en || null };
  }
  // ถ้าไม่มี prefix ภาษา → โยนให้ TH เป็นดีฟอลต์เพื่อความเข้ากันได้ย้อนหลัง
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
        try { structuredData = JSON.parse(s); }
        catch { structuredData = s as any; }
      }
    } else if (typeof seo.structuredData === "object") {
      structuredData = seo.structuredData;
    }
  }

  // 🔹 คีย์เวิร์ดแบบใหม่ (แยกภาษา)
  let metaKeywordsTh = normalizeKeywords(seo.metaKeywordsTh);
  let metaKeywordsEn = normalizeKeywords(seo.metaKeywordsEn);

  // 🔸 backward-compat: ถ้าบอดี้ยังส่ง metaKeywords มาช่องเดียว → แตกเป็น TH/EN
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

    // ✅ ใช้ฟิลด์ใหม่
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

/* -------- Handlers -------- */

// GET /api/admin/promotions/[id] -> คืน promotion + seo
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.promotion.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const seo = await prisma.seoMeta.findUnique({
      where: { contentType_targetId: { contentType: "promotion", targetId: params.id } },
    });
    return NextResponse.json({ ...item, seo: seo ?? null });
  } catch (e) {
    console.error("GET /api/admin/promotions/[id] error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// PUT /api/admin/promotions/[id] -> อัปเดต promotion + upsert seo
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = buildPromotionData(body);
    const seoData = buildSeoData(body?.seo);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.promotion.update({ where: { id: params.id }, data });

      let updatedSeo = null as any;
      if (seoData) {
        updatedSeo = await tx.seoMeta.upsert({
          where: { contentType_targetId: { contentType: "promotion", targetId: params.id } },
          create: { contentType: "promotion", targetId: params.id, ...seoData },
          update: seoData,
        });
      }
      return { updated, updatedSeo };
    });

    return NextResponse.json({ ...result.updated, seo: result.updatedSeo ?? null });
  } catch (e) {
    console.error("PUT /api/admin/promotions/[id] error:", e);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

// DELETE /api/admin/promotions/[id] -> ลบ seo ก่อน แล้วลบตัว promotion
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction([
      prisma.seoMeta.deleteMany({ where: { contentType: "promotion", targetId: params.id } }),
      prisma.promotion.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/promotions/[id] error:", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
