// scripts/backfill-seo-keywords.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  // หาก schema ปัจจุบันยังมี metaKeywords อยู่ ให้ดึงมา backfill
  const rows = await prisma.$queryRaw<
    Array<{ id: string; contentType: string; targetId: string; metaKeywords: string | null }>
  >`SELECT id, "contentType", "targetId", "metaKeywords" FROM "SeoMeta"`;

  for (const r of rows) {
    if (!r.metaKeywords) continue;

    // รูปแบบที่เคยใช้: "th: ... | en: ..." → แยกภาษา
    let th = "";
    let en = "";

    const src = r.metaKeywords.trim();
    const mTh = src.match(/th:\s*([^|]+)/i);
    const mEn = src.match(/en:\s*([^|]+)/i);

    if (mTh) th = mTh[1].trim();
    if (mEn) en = mEn[1].trim();

    // ถ้าไม่ได้ใช้รูปแบบข้างบน: โยนค่าลง TH เป็นดีฟอลต์
    if (!mTh && !mEn) {
      th = src;
    }

    await prisma.seoMeta.update({
      where: { id: r.id },
      data: {
        metaKeywordsTh: th || null,
        metaKeywordsEn: en || null,
      },
    });
  }
}

run()
  .then(() => console.log("Backfill keywords done"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
