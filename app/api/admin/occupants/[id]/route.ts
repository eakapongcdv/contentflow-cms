// app/api/admin/occupants/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function toStringArray(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(String).filter(Boolean);
  if (typeof x === "string") return x.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}
function normalizeSeo(raw: any) {
  if (!raw) return null;
  const sd = typeof raw.structuredData === "string" && raw.structuredData.trim()
    ? (() => { try { return JSON.parse(raw.structuredData); } catch { return null; } })()
    : (raw.structuredData ?? null);
  return {
    metaTitleTh: raw.metaTitleTh ?? null,
    metaTitleEn: raw.metaTitleEn ?? null,
    metaDescriptionTh: raw.metaDescriptionTh ?? null,
    metaDescriptionEn: raw.metaDescriptionEn ?? null,
    metaKeywords: raw.metaKeywords ?? null,
    ogTitle: raw.ogTitle ?? null,
    ogDescription: raw.ogDescription ?? null,
    ogImageUrl: raw.ogImageUrl ?? null,
    canonicalUrl: raw.canonicalUrl ?? null,
    robotsNoindex: !!raw.robotsNoindex,
    robotsNofollow: !!raw.robotsNofollow,
    structuredData: sd,
  };
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.occupant.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const seo = await prisma.seoMeta.findUnique({
    where: { contentType_targetId: { contentType: "occupant", targetId: params.id } },
  });

  return NextResponse.json({ item, seo });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();

    const data: any = {
      externalId: String(body.externalId),
      nameTh: String(body.nameTh),
      nameEn: String(body.nameEn),
      shortName: body.shortName ?? null,
      category: body.category ?? null,
      phone: body.phone ?? null,
      venueId: body.venueId ?? null,
      anchorId: body.anchorId ?? null,
      unitId: body.unitId ?? null,
      kioskId: body.kioskId ?? null,

      unitIds: toStringArray(body.unitIds),
      kioskIds: toStringArray(body.kioskIds),
      promotionIds: toStringArray(body.promotionIds),
      privilegeIds: toStringArray(body.privilegeIds),
      localCategoryIds: toStringArray(body.localCategoryIds),
      groupIds: toStringArray(body.groupIds),
      keywords: toStringArray(body.keywords),

      renderPriority: Number(body.renderPriority) || 0,
      renderType: body.renderType ?? null,
      canReserve: !!body.canReserve,
      isFeatured: !!body.isFeatured,
      isLandmark: !!body.isLandmark,
      websiteLink: body.websiteLink ?? null,

      descriptionEn: body.descriptionEn ?? null,
      descriptionTh: body.descriptionTh ?? null,
      roomNo: body.roomNo ?? null,
      style: body.style ?? null,
      hours: body.hours ?? null,

      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
      isMaintenance: !!body.isMaintenance,
      maintenanceStartDate: body.maintenanceStartDate ? new Date(body.maintenanceStartDate) : null,
      maintenanceEndDate: body.maintenanceEndDate ? new Date(body.maintenanceEndDate) : null,

      logoUrl: body.logoUrl ?? null,
      coverImageUrl: body.coverImageUrl ?? null,
      featuredImageUrl: body.featuredImageUrl ?? null,

      createdAtRaw: body.createdAtRaw ? new Date(body.createdAtRaw) : null,
      updatedAtRaw: body.updatedAtRaw ? new Date(body.updatedAtRaw) : null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,

      latitude: body.latitude != null ? Number(body.latitude) : null,
      longitude: body.longitude != null ? Number(body.longitude) : null,
    };

    const item = await prisma.occupant.update({ where: { id: params.id }, data });

    const seo = normalizeSeo(body.seo);
    if (seo) {
      await prisma.seoMeta.upsert({
        where: { contentType_targetId: { contentType: "occupant", targetId: params.id } },
        create: { ...seo, contentType: "occupant", targetId: params.id },
        update: seo,
      });
    }

    return NextResponse.json({ item });
  } catch (e: any) {
    return NextResponse.json({ error: "update_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction([
      prisma.seoMeta.deleteMany({ where: { contentType: "occupant", targetId: params.id } }),
      prisma.occupant.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "delete_failed", detail: String(e?.message || e) }, { status: 500 });
  }
}
