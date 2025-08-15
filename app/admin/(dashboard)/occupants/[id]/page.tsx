// app/admin/(dashboard)/occupants/[id]/page.tsx
import { prisma } from "@/app/lib/prisma";
import OccupantForm from "../OccupantForm";

export default async function EditOccupantPage({ params }: { params: { id: string } }) {
  const i = await prisma.occupant.findUnique({ where: { id: params.id } });
  if (!i) return <div className="card p-6"><h1 className="text-xl font-semibold">Not found</h1></div>;

  const seo = await prisma.seoMeta.findUnique({
    where: { contentType_targetId: { contentType: "occupant", targetId: params.id } },
  });

  return (
    <div className="card p-6">
      <div className="mt-4">
        <OccupantForm
          mode="edit"
          id={i.id}
          initial={{
            externalId: i.externalId,
            nameTh: i.nameTh,
            nameEn: i.nameEn,
            shortName: i.shortName ?? "",
            category: i.category ?? "",
            phone: i.phone ?? "",
            venueId: i.venueId ?? "",
            anchorId: i.anchorId ?? "",
            unitId: i.unitId ?? "",
            kioskId: i.kioskId ?? "",
            unitIds: (i.unitIds || []).join(", "),
            kioskIds: (i.kioskIds || []).join(", "),
            promotionIds: (i.promotionIds || []).join(", "),
            privilegeIds: (i.privilegeIds || []).join(", "),
            localCategoryIds: (i.localCategoryIds || []).join(", "),
            groupIds: (i.groupIds || []).join(", "),
            keywords: (i.keywords || []).join(", "),
            renderPriority: i.renderPriority,
            renderType: i.renderType ?? "",
            canReserve: i.canReserve,
            isFeatured: i.isFeatured,
            isLandmark: i.isLandmark,
            websiteLink: i.websiteLink ?? "",
            descriptionEn: i.descriptionEn ?? "",
            descriptionTh: i.descriptionTh ?? "",
            roomNo: i.roomNo ?? "",
            style: i.style ?? "",
            hours: i.hours ?? "",
            startDate: i.startDate ? new Date(i.startDate).toISOString().slice(0,10) : "",
            endDate: i.endDate ? new Date(i.endDate).toISOString().slice(0,10) : "",
            isMaintenance: i.isMaintenance,
            maintenanceStartDate: i.maintenanceStartDate ? new Date(i.maintenanceStartDate).toISOString().slice(0,10) : "",
            maintenanceEndDate: i.maintenanceEndDate ? new Date(i.maintenanceEndDate).toISOString().slice(0,10) : "",
            logoUrl: i.logoUrl ?? "",
            coverImageUrl: i.coverImageUrl ?? "",
            featuredImageUrl: i.featuredImageUrl ?? "",
            createdAtRaw: i.createdAtRaw ? new Date(i.createdAtRaw).toISOString().slice(0,16) : "",
            updatedAtRaw: i.updatedAtRaw ? new Date(i.updatedAtRaw).toISOString().slice(0,16) : "",
            publishedAt: i.publishedAt ? new Date(i.publishedAt).toISOString().slice(0,16) : "",
            latitude: i.latitude != null ? String(i.latitude) : "",
            longitude: i.longitude != null ? String(i.longitude) : "",
            // ⬇️ SEO initial
            seo: {
              metaTitleTh: seo?.metaTitleTh ?? "",
              metaTitleEn: seo?.metaTitleEn ?? "",
              metaDescriptionTh: seo?.metaDescriptionTh ?? "",
              metaDescriptionEn: seo?.metaDescriptionEn ?? "",
              metaKeywords: seo?.metaKeywords ?? "",
              ogTitle: seo?.ogTitle ?? "",
              ogDescription: seo?.ogDescription ?? "",
              ogImageUrl: seo?.ogImageUrl ?? "",
              canonicalUrl: seo?.canonicalUrl ?? "",
              robotsNoindex: !!seo?.robotsNoindex,
              robotsNofollow: !!seo?.robotsNofollow,
              structuredData: seo?.structuredData ? JSON.stringify(seo.structuredData, null, 2) : "",
            },
          }}
        />
      </div>
    </div>
  );
}
