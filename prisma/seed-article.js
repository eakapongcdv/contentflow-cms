/* prisma/seed-article.js */
/* Run: node prisma/seed-article.js   (ต้องมี DATABASE_URL พร้อมใช้งาน) */
const { PrismaClient, ArticleStatus, Locale3 } = require("@prisma/client");

const prisma = new PrismaClient();

// ---------- helpers ----------
function pickWebsiteId(websites) {
  const envId = process.env.SEED_WEBSITE_ID && process.env.SEED_WEBSITE_ID.trim();
  if (envId && websites.some(w => w.id === envId)) return envId;
  return websites[0]?.id;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** slug ASCII เรียบง่าย + ป้องกันซ้ำด้วย suffix สั้นจาก id */
function slugify(s) {
  return (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")      // strip diacritics
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .slice(0, 80);
}

/** เนื้อหา HTML อย่างง่ายจากข้อความ */
function toHtml(p) {
  return `<p>${String(p).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
}

function titleSet(i) {
  // ตัวอย่างหัวข้อ 3 ภาษา (ให้ดูจริงและยาวพอสำหรับ SEO)
  return {
    th: `คู่มือช้อปปิ้งประจำฤดูกาล #${pad2(i)}`,
    en: `Seasonal Shopping Guide #${pad2(i)}`,
    cn: `季节购物指南 #${pad2(i)}`,
  };
}

function excerptSet(i) {
  return {
    th: `สรุปไฮไลต์โปรโมชันและร้านแนะนำประจำฤดูกาล ครั้งที่ ${i}.`,
    en: `Highlights of promotions and recommended stores for the season, edition ${i}.`,
    cn: `当季促销亮点与推荐门店，第 ${i} 期。`,
  };
}

function bodySet(i) {
  return {
    th: `นี่คือบทความตัวอย่างลำดับที่ ${i} สำหรับภาษาไทย รวมลิสต์ร้าน โปรโมชัน และเคล็ดลับการช้อป.`,
    en: `This is sample article #${i} in English with store lists, promotions and shopping tips.`,
    cn: `这是第 ${i} 篇中文示例文章，包含门店清单、促销与购物技巧。`,
  };
}

function author(i) {
  const names = ["Editorial Team", "Lifestyle Editor", "Productivity Expert", "Mall Insider"];
  return names[i % names.length];
}

async function ensureUniqueSlug(websiteId, locale, base, idSuffix) {
  // ทำให้ไม่ชนภายใต้ unique([websiteId, locale, slug])
  let slug = slugify(base) || `article-${Date.now()}`;
  let final = `${slug}`;
  let n = 0;
  // ลองเพิ่ม suffix จาก id/article + running number เล็กน้อย
  while (true) {
    const exist = await prisma.articleI18n.findFirst({
      where: { websiteId, locale, slug: final },
      select: { id: true },
    });
    if (!exist) return final;
    n += 1;
    final = `${slug}-${idSuffix.slice(0, 6)}-${n}`;
  }
}

async function main() {
  const websites = await prisma.website.findMany({ select: { id: true, name: true } });
  if (!websites.length) {
    throw new Error("No websites found. Seed websites first.");
  }
  const websiteId = pickWebsiteId(websites);
  console.log("▶ Target website:", websiteId);

  const TOTAL = 20;

  // เวลาเผยแพร่กระจายตัวเล็กน้อย
  const now = new Date();

  for (let i = 1; i <= TOTAL; i++) {
    // สร้าง core Article
    const core = await prisma.article.create({
      data: {
        websiteId,
        status: i % 4 === 0 ? ArticleStatus.DRAFT : ArticleStatus.PUBLISHED,
        coverImageUrl: `https://picsum.photos/seed/cms-${i}/1200/630`,
        coverImageW: 1200,
        coverImageH: 630,
        authorName: author(i),
        readingTime: 3 + (i % 6),
        publishedAt: i % 4 === 0 ? null : new Date(now.getTime() - i * 3600_000),
        scheduledAt: null,
        order: i,
      },
      select: { id: true },
    });

    // สร้าง i18n (TH / EN / CN)
    const titles = titleSet(i);
    const excerpts = excerptSet(i);
    const bodies = bodySet(i);

    // TH
    {
      const base = titles.th;
      const slug = await ensureUniqueSlug(websiteId, Locale3.TH, base, core.id);
      await prisma.articleI18n.upsert({
        where: { articleId_locale: { articleId: core.id, locale: Locale3.TH } },
        create: {
          articleId: core.id,
          websiteId,
          locale: Locale3.TH,
          title: titles.th,
          slug,
          subtitle: null,
          excerpt: excerpts.th,
          contentMd: bodies.th,
          contentHtml: toHtml(bodies.th),
        },
        update: {
          title: titles.th,
          slug,
          excerpt: excerpts.th,
          contentMd: bodies.th,
          contentHtml: toHtml(bodies.th),
        },
      });
    }

    // EN
    {
      const base = titles.en;
      const slug = await ensureUniqueSlug(websiteId, Locale3.EN, base, core.id);
      await prisma.articleI18n.upsert({
        where: { articleId_locale: { articleId: core.id, locale: Locale3.EN } },
        create: {
          articleId: core.id,
          websiteId,
          locale: Locale3.EN,
          title: titles.en,
          slug,
          subtitle: null,
          excerpt: excerpts.en,
          contentMd: bodies.en,
          contentHtml: toHtml(bodies.en),
        },
        update: {
          title: titles.en,
          slug,
          excerpt: excerpts.en,
          contentMd: bodies.en,
          contentHtml: toHtml(bodies.en),
        },
      });
    }

    // CN
    {
      const base = titles.cn;
      const slug = await ensureUniqueSlug(websiteId, Locale3.CN, base, core.id);
      await prisma.articleI18n.upsert({
        where: { articleId_locale: { articleId: core.id, locale: Locale3.CN } },
        create: {
          articleId: core.id,
          websiteId,
          locale: Locale3.CN,
          title: titles.cn,
          slug,
          subtitle: null,
          excerpt: excerpts.cn,
          contentMd: bodies.cn,
          contentHtml: toHtml(bodies.cn),
        },
        update: {
          title: titles.cn,
          slug,
          excerpt: excerpts.cn,
          contentMd: bodies.cn,
          contentHtml: toHtml(bodies.cn),
        },
      });
    }

    // (ถ้าต้องการ Tag/Category เสริม สามารถเพิ่มตรงนี้)
    console.log(`✓ Article ${i}/${TOTAL}  id=${core.id}`);
  }

  console.log("✅ Seeded 20 articles with TH/EN/CN i18n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
