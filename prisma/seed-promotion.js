// prisma/seed-promotions.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");


const prisma = new PrismaClient();

function getImageFields(img) {
  if (!img) return {};
  return {
    coverImageUrl: img.url ?? null,
    coverImageW: img.width ?? null,
    coverImageH: img.height ?? null,
    coverThumbUrl: img.formats?.thumbnail?.url ?? null,
    coverSmallUrl: img.formats?.small?.url ?? null,
  };
}

(async () => {
  try {
    const filePath = path.join(process.cwd(), "prisma", "data", "promotion.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);

    const feats = Array.isArray(json.features) ? json.features : [];
    for (const f of feats) {
      const p = f.properties || {};
      const cover = p.cover_image;

      const data = {
        externalId: f.id || null,
        occupantId: p.occupant_id || null,
        featureId: p.feature_id || null,
        category: p.category || null,
        venueId: p.venue_id || null,
        localCategoryIds: Array.isArray(p.local_category_ids) ? p.local_category_ids : [],

        nameEn: p.name?.en ?? "",
        nameTh: p.name?.th ?? null,
        descriptionEn: p.description?.en ?? null,
        descriptionTh: p.description?.th ?? null,

        startDate: p.start_date ? new Date(p.start_date) : new Date(),
        endDate: p.end_date ? new Date(p.end_date) : new Date(),
        dailyStartTime: p.daily_start_time ?? null,
        dailyEndTime: p.daily_end_time ?? null,

        isFeatured: !!p.is_featured,
        websiteLink: p.website_link ?? null,

        ...getImageFields(cover),
        logoUrl: p.logo?.url ?? null,
        galleryJson: p.gallery ?? null,

        locale: p.locale ?? null,
        order: p.order ?? null,
        reference: p.reference ?? null,
        style: p.style ?? null,

        createdAtRaw: p.createdAt ? new Date(p.createdAt) : null,
        updatedAtRaw: p.updatedAt ? new Date(p.updatedAt) : null,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
      };

      await prisma.promotion.upsert({
        where: { externalId: data.externalId || "__none__" },
        update: data,
        create: data,
      });
    }

    console.log("Seed promotions: done");
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
