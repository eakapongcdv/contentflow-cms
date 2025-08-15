// prisma/seed.js (CommonJS)
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

(async () => {
  try {
    // ปรับ path ตามที่คุณวาง event.json:
    // - ถ้าไว้ที่รากโปรเจกต์: path.resolve(process.cwd(), "event.json")
    // - ถ้าไว้ใน prisma/: path.resolve(__dirname, "event.json")
    const filePath = path.join(process.cwd(), "prisma", "data", "event.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);

    if (!json || !Array.isArray(json.features)) {
      console.error("event.json รูปแบบไม่ถูกต้อง: ต้องมี { features: [...] }");
      process.exit(1);
    }

    const ops = json.features.map((f) => {
      const p = f.properties || {};
      const cover = p.cover_image || null;

      return prisma.event.upsert({
        where: { externalId: f.id },
        create: {
          externalId: f.id,
          venueId: p.venue_id ?? null,
          localCategoryIds: p.local_category_ids ?? [],
          nameEn: (p.name && p.name.en) || "",
          nameTh: (p.name && p.name.th) || null,
          descriptionEn: (p.description && p.description.en) || null,
          descriptionTh: (p.description && p.description.th) || null,
          startDate: parseDate(p.start_date) || new Date(),
          endDate: parseDate(p.end_date) || new Date(),
          dailyStartTime: p.daily_start_time ?? null,
          dailyEndTime: p.daily_end_time ?? null,
          isFeatured: !!p.is_featured,
          websiteLink: p.website_link ?? null,
          coverImageUrl: cover?.url ?? null,
          coverImageW: cover?.width ?? null,
          coverImageH: cover?.height ?? null,
          coverThumbUrl: cover?.formats?.thumbnail?.url ?? null,
          coverSmallUrl: cover?.formats?.small?.url ?? null,
          logoUrl: p.logo?.url ?? null,
          galleryJson: p.gallery ?? undefined, // Prisma.Json | undefined
          locale: p.locale ?? null,
          order: p.order ?? null,
          reference: p.reference ?? null,
          style: p.style ?? null,
          createdAtRaw: parseDate(p.createdAt),
          updatedAtRaw: parseDate(p.updatedAt),
          publishedAt: parseDate(p.publishedAt),
        },
        update: {
          venueId: p.venue_id ?? null,
          localCategoryIds: p.local_category_ids ?? [],
          nameEn: (p.name && p.name.en) || "",
          nameTh: (p.name && p.name.th) || null,
          descriptionEn: (p.description && p.description.en) || null,
          descriptionTh: (p.description && p.description.th) || null,
          startDate: parseDate(p.start_date) || new Date(),
          endDate: parseDate(p.end_date) || new Date(),
          dailyStartTime: p.daily_start_time ?? null,
          dailyEndTime: p.daily_end_time ?? null,
          isFeatured: !!p.is_featured,
          websiteLink: p.website_link ?? null,
          coverImageUrl: cover?.url ?? null,
          coverImageW: cover?.width ?? null,
          coverImageH: cover?.height ?? null,
          coverThumbUrl: cover?.formats?.thumbnail?.url ?? null,
          coverSmallUrl: cover?.formats?.small?.url ?? null,
          logoUrl: p.logo?.url ?? null,
          galleryJson: p.gallery ?? undefined,
          locale: p.locale ?? null,
          order: p.order ?? null,
          reference: p.reference ?? null,
          style: p.style ?? null,
          createdAtRaw: parseDate(p.createdAt),
          updatedAtRaw: parseDate(p.updatedAt),
          publishedAt: parseDate(p.publishedAt),
        },
      });
    });

    // ใช้ transaction ถ้าข้อมูลไม่ใหญ่มากนัก
    const chunkSize = 100;
    for (let i = 0; i < ops.length; i += chunkSize) {
      const chunk = ops.slice(i, i + chunkSize);
      await prisma.$transaction(chunk);
      console.log(`Seed events: ${Math.min(i + chunkSize, ops.length)} / ${ops.length}`);
    }

    console.log("Seed events: done");
    process.exit(0);
  } catch (e) {
    console.error("Seed error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
