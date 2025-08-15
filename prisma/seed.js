// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPass = process.env.ADMIN_PASSWORD || "Admin@123";
  const passwordHash = await bcrypt.hash(adminPass, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "Administrator", role: "ADMIN", passwordHash },
  });
}

function pickStr(v) { return typeof v === "string" ? v : null; }
function pickName(p) {
  const en = p?.name?.en ?? "";
  const th = p?.name?.th ?? "";
  return { en: String(en || ""), th: String(th || "") };
}
function pickDesc(p) {
  const en = typeof p?.description === "object" ? p?.description?.en : null;
  const th = typeof p?.description === "object" ? p?.description?.th : null;
  return { en: pickStr(en), th: pickStr(th) };
}
function toArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(String);
  // บางไฟล์เก็บรวมด้วยเครื่องหมาย ; ให้แยก
  if (typeof x === "string") return x.split(/[;,]\s*/).filter(Boolean);
  return [];
}

async function seedOccupants() {
  const filePath = path.join(process.cwd(), "prisma", "data", "occupant.json");
  if (!fs.existsSync(filePath)) {
    console.warn("⚠️  prisma/data/occupant.json not found — skip occupant seeding");
    return;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const features = raw?.features ?? [];
  console.log(`Seeding occupants: ${features.length}`);

  for (const f of features) {
    // หลังจากอ่าน feature f
    const coords = f?.geometry?.type === "Point" ? f.geometry.coordinates : null;
    // GeoJSON = [lon, lat]
    const longitude = Array.isArray(coords) ? Number(coords[0]) : null;
    const latitude  = Array.isArray(coords) ? Number(coords[1]) : null;

    const p = f?.properties || {};
    const name = pickName(p);               // name.en/th  เช่น "ID OPTIC" / "ไอดี ออพติก" :contentReference[oaicite:6]{index=6}
    const desc = pickDesc(p);

    const logoUrl = p?.logo?.url || null;   // logo.url ถ้ามี (บางรายการไม่มี) :contentReference[oaicite:7]{index=7}
    const coverImageUrl = p?.cover_image?.url || null;
    const featuredImageUrl = p?.featured_image?.url || null;

    await prisma.occupant.upsert({
      where: { externalId: String(f.id) },
      update: {
        nameEn: name.en,
        nameTh: name.th,
        shortName: pickStr(p.short_name),
        category: pickStr(p.category),
        phone: pickStr(p.phone),
        venueId: pickStr(p.venue_id),
        anchorId: pickStr(p.anchor_id),
        unitId: pickStr(p.unit_id),
        kioskId: pickStr(p.kiosk_id),

        unitIds: toArray(p.unit_ids),
        kioskIds: toArray(p.kiosk_ids),
        promotionIds: toArray(p.promotion_ids),
        privilegeIds: toArray(p.privilege_ids),
        localCategoryIds: toArray(p.local_category_ids),
        groupIds: toArray(p.group_ids),

        keywords: toArray(p.keywords?.length ? p.keywords : p.keyword), // ไฟล์มีทั้ง keywords/keyword :contentReference[oaicite:8]{index=8}

        renderPriority: Number(p.render_priority ?? 0),
        renderType: pickStr(p.render_type),
        canReserve: !!p.can_reserve,

        descriptionEn: desc.en,
        descriptionTh: desc.th,
        roomNo: pickStr(p.room_no),
        style: pickStr(p.style),
        hours: pickStr(p.hours), // บางรายการเป็น string เวลาเปิด-ปิด :contentReference[oaicite:9]{index=9}

        startDate: p.start_date ? new Date(p.start_date) : null,  // :contentReference[oaicite:10]{index=10}
        endDate: p.end_date ? new Date(p.end_date) : null,        // :contentReference[oaicite:11]{index=11}

        isFeatured: !!p.is_featured,
        isLandmark: !!p.is_landmark,
        websiteLink: pickStr(p.website_link),

        isMaintenance: !!p.is_maintenance,
        maintenanceStartDate: p.maintenance_start_date ? new Date(p.maintenance_start_date) : null,
        maintenanceEndDate: p.maintenance_end_date ? new Date(p.maintenance_end_date) : null,

        logoUrl,
        coverImageUrl,
        featuredImageUrl,

        createdAtRaw: p.createdAt ? new Date(p.createdAt) : null,
        updatedAtRaw: p.updatedAt ? new Date(p.updatedAt) : null,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        latitude, 
        longitude 
      },
      create: {
        externalId: String(f.id),
        nameEn: name.en,
        nameTh: name.th,
        shortName: pickStr(p.short_name),
        category: pickStr(p.category),
        phone: pickStr(p.phone),
        venueId: pickStr(p.venue_id),
        anchorId: pickStr(p.anchor_id),
        unitId: pickStr(p.unit_id),
        kioskId: pickStr(p.kiosk_id),
        unitIds: toArray(p.unit_ids),
        kioskIds: toArray(p.kiosk_ids),
        promotionIds: toArray(p.promotion_ids),
        privilegeIds: toArray(p.privilege_ids),
        localCategoryIds: toArray(p.local_category_ids),
        groupIds: toArray(p.group_ids),
        keywords: toArray(p.keywords?.length ? p.keywords : p.keyword),
        renderPriority: Number(p.render_priority ?? 0),
        renderType: pickStr(p.render_type),
        canReserve: !!p.can_reserve,
        descriptionEn: desc.en,
        descriptionTh: desc.th,
        roomNo: pickStr(p.room_no),
        style: pickStr(p.style),
        hours: pickStr(p.hours),
        startDate: p.start_date ? new Date(p.start_date) : null,
        endDate: p.end_date ? new Date(p.end_date) : null,
        isFeatured: !!p.is_featured,
        isLandmark: !!p.is_landmark,
        websiteLink: pickStr(p.website_link),
        isMaintenance: !!p.is_maintenance,
        maintenanceStartDate: p.maintenance_start_date ? new Date(p.maintenance_start_date) : null,
        maintenanceEndDate: p.maintenance_end_date ? new Date(p.maintenance_end_date) : null,
        logoUrl,
        coverImageUrl,
        featuredImageUrl,
        createdAtRaw: p.createdAt ? new Date(p.createdAt) : null,
        updatedAtRaw: p.updatedAt ? new Date(p.updatedAt) : null,
        publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
        latitude,
        longitude 
      },
    });
  }

  console.log("✅ Occupant seeding done.");
}

async function main() {
  await seedAdmin();
  //await seedOccupants();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
