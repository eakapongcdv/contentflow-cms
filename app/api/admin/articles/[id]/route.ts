// app/api/admin/articles/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type Lang = "th" | "en" | "cn";

const EMPTY_I18N = () => ({
  th: { title: "", subtitle: "", excerpt: "", contentMd: "", contentHtml: "" },
  en: { title: "", subtitle: "", excerpt: "", contentMd: "", contentHtml: "" },
  cn: { title: "", subtitle: "", excerpt: "", contentMd: "", contentHtml: "" },
});

function normalizeLang(v: string | null | undefined): Lang | undefined {
  const s = (v || "").toLowerCase();
  if (s.startsWith("th")) return "th";
  if (s.startsWith("en")) return "en";
  if (s.startsWith("cn") || s.startsWith("zh")) return "cn";
  return undefined;
}

/** อ่าน i18n ได้ทั้งจาก “ตาราง” (articleI18n / articleTranslation / articleLocale) และ “ฟิลด์ JSON” (i18n / translations) */
async function readI18n(articleId: string) {
  const out = EMPTY_I18N();

  // 1) ตาราง
  const tryModels = ["articleI18n", "articleTranslation", "articleLocale"] as const;
  for (const m of tryModels) {
    const model: any = (prisma as any)[m];
    if (!model?.findMany) continue;

    try {
      const rows = await model.findMany({ where: { articleId } });
      if (rows && rows.length) {
        for (const r of rows) {
          const key = normalizeLang((r as any).locale ?? (r as any).lang);
          if (!key) continue;
          (out as any)[key] = {
            title: r.title ?? "",
            subtitle: r.subtitle ?? "",
            excerpt: r.excerpt ?? "",
            contentMd: r.contentMd ?? "",
            contentHtml: r.contentHtml ?? "",
          };
        }
        return out;
      }
    } catch {
      /* try next */
    }
  }

  // 2) JSON field บน Article
  const jsonCandidates = ["i18n", "i18nJson", "translations", "translationsJson"] as const;
  for (const f of jsonCandidates) {
    try {
      const a: any = await prisma.article.findUnique({
        where: { id: articleId },
        select: { [f]: true },
      });
      const v = a?.[f];
      if (v && typeof v === "object") {
        return {
          th: { ...(EMPTY_I18N().th), ...(v.th || {}) },
          en: { ...(EMPTY_I18N().en), ...(v.en || {}) },
          cn: { ...(EMPTY_I18N().cn), ...(v.cn || {}) },
        };
      }
    } catch {
      /* ignore */
    }
  }

  return out;
}

/** บันทึก i18n: รองรับทั้ง locale และ lang + ทั้ง upsert แบบคีย์ผสมและ find+update/create */
async function saveI18n(
  tx: any,
  articleId: string,
  websiteId: string | null,
  input: Record<Lang, any>
) {
  const p: any = tx;
  const langs: Lang[] = ["th", "en", "cn"];
  const tryModels = ["articleI18n", "articleTranslation", "articleLocale"];

  // helper: upsert ด้วย composite key (ลอง articleId_locale -> articleId_lang)
  async function tryUpsert(model: any, L: Lang, data: any) {
    if (!model?.upsert) throw new Error("no upsert");
    // 1) คีย์ผสมแบบ locale
    try {
      await model.upsert({
        where: { articleId_locale: { articleId, locale: L } },
        create: { ...data, locale: L },
        update: {
          title: data.title,
          subtitle: data.subtitle,
          excerpt: data.excerpt,
          contentMd: data.contentMd,
          contentHtml: data.contentHtml,
          ...(websiteId ? { websiteId } : {}),
        },
      });
      return true;
    } catch {
      /* try lang */
    }
    // 2) คีย์ผสมแบบ lang
    try {
      await model.upsert({
        where: { articleId_lang: { articleId, lang: L } },
        create: { ...data, lang: L },
        update: {
          title: data.title,
          subtitle: data.subtitle,
          excerpt: data.excerpt,
          contentMd: data.contentMd,
          contentHtml: data.contentHtml,
          ...(websiteId ? { websiteId } : {}),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  // helper: findFirst+update หรือ create (ลอง locale ก่อน แล้วค่อย lang)
  async function findUpdateOrCreate(model: any, L: Lang, data: any) {
    // 1) locale
    try {
      const found = await model.findFirst({ where: { articleId, locale: L }, select: { id: true } });
      if (found?.id) {
        await model.update({
          where: { id: found.id },
          data: { ...data, locale: L, ...(websiteId ? { websiteId } : {}) },
        });
      } else {
        // create: ลองพร้อม websiteId ก่อน
        try {
          await model.create({ data: { ...data, locale: L, ...(websiteId ? { websiteId } : {}) } });
        } catch {
          await model.create({ data: { ...data, locale: L } });
        }
      }
      return true;
    } catch {
      /* try lang */
    }

    // 2) lang
    try {
      const found = await model.findFirst({ where: { articleId, lang: L }, select: { id: true } });
      if (found?.id) {
        await model.update({
          where: { id: found.id },
          data: { ...data, lang: L, ...(websiteId ? { websiteId } : {}) },
        });
      } else {
        try {
          await model.create({ data: { ...data, lang: L, ...(websiteId ? { websiteId } : {}) } });
        } catch {
          await model.create({ data: { ...data, lang: L } });
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  for (const m of tryModels) {
    const model = p?.[m];
    if (!model) continue;

    let okAtLeastOnce = false;

    for (const L of langs) {
      const t = input[L] || {};
      const base = {
        articleId,
        title: t.title || "",
        subtitle: t.subtitle || "",
        excerpt: t.excerpt || "",
        contentMd: t.contentMd || "",
        contentHtml: t.contentHtml || "",
      };

      // 1) พยายาม upsert ด้วยคีย์ผสม
      let wrote = false;
      try {
        wrote = await tryUpsert(model, L, { ...base, ...(websiteId ? { websiteId } : {}) });
      } catch {
        wrote = false;
      }

      // 2) ถ้า upsert ไม่ได้ ลอง find+update/create
      if (!wrote) {
        wrote = await findUpdateOrCreate(model, L, base);
      }

      okAtLeastOnce = okAtLeastOnce || wrote;
    }

    if (okAtLeastOnce) return; // ใช้โมเดลนี้สำเร็จแล้ว
  }

  // 3) เก็บลงฟิลด์ JSON ถ้าไม่มีโมเดลตาราง
  const jsonFieldNames = ["i18n", "i18nJson", "translations", "translationsJson"];
  for (const f of jsonFieldNames) {
    try {
      await p.article.update({
        where: { id: articleId },
        data: { [f]: input },
      });
      return;
    } catch {
      /* try next */
    }
  }
}

// ──────────────── GET /api/admin/articles/[id]
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const a: any = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      tags: { include: { tag: true } },
      categories: { include: { category: true } },
    },
  });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const i18n = await readI18n(params.id);

  // SEO (optional)
  let seo: any = null;
  try {
    if ((prisma as any).seoMeta?.findUnique) {
      seo = await (prisma as any).seoMeta.findUnique({
        where: { contentType_targetId: { contentType: "article", targetId: params.id } },
      });
    }
  } catch {}

  const tagIds = (a.tags || []).map((t: any) => t.tagId);
  const categoryIds = (a.categories || []).map((c: any) => c.categoryId);
  const slug = typeof a.slug === "string" ? a.slug : "";

  return NextResponse.json({
    ...a,
    slug,
    i18n,
    seo,
    tagIds,
    categoryIds,
  });
}

// ──────────────── PUT /api/admin/articles/[id]
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const id = params.id;

  const updated = await prisma.$transaction(async (tx) => {
    // core (ไม่บังคับ slug)
    const coreData: any = {
      status: body.status ?? "DRAFT",
      coverImageUrl: body.coverImageUrl ?? null,
      coverImageW: body.coverImageW ?? null,
      coverImageH: body.coverImageH ?? null,
      authorName: body.authorName ?? null,
      readingTime: body.readingTime ?? null,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    };

    // ถ้ามี slug ใน payload และ schema รองรับ ให้ลองอัปเดต
    if (typeof body.slug === "string") {
      try {
        await tx.article.update({ where: { id }, data: { slug: body.slug } });
      } catch {}
    }

    const updatedCore = await tx.article.update({
      where: { id },
      data: coreData,
      select: { id: true, websiteId: true },
    });

    // i18n
    const i18nInput: Record<Lang, any> = body.i18n || body.translations || EMPTY_I18N();
    await saveI18n(tx as any, id, updatedCore.websiteId, i18nInput);

    // M2M: reset
    await tx.articleTag.deleteMany({ where: { articleId: id } });
    await tx.articleCategory.deleteMany({ where: { articleId: id } });

    if (Array.isArray(body.tagIds) && body.tagIds.length) {
      await tx.articleTag.createMany({
        data: body.tagIds.map((tagId: string) => ({ articleId: id, tagId })),
      });
    }
    if (Array.isArray(body.categoryIds) && body.categoryIds.length) {
      await tx.articleCategory.createMany({
        data: body.categoryIds.map((categoryId: string) => ({ articleId: id, categoryId })),
      });
    }

    // SEO (optional)
    try {
      if (body.seo && (tx as any).seoMeta?.upsert) {
        const s = body.seo;
        await (tx as any).seoMeta.upsert({
          where: { contentType_targetId: { contentType: "article", targetId: id } },
          create: {
            contentType: "article",
            targetId: id,
            metaTitleTh: s.metaTitleTh ?? null,
            metaTitleEn: s.metaTitleEn ?? null,
            metaDescriptionTh: s.metaDescriptionTh ?? null,
            metaDescriptionEn: s.metaDescriptionEn ?? null,
            metaKeywordsTh: s.metaKeywordsTh ?? null,
            metaKeywordsEn: s.metaKeywordsEn ?? null,
            ogTitle: s.ogTitle ?? null,
            ogDescription: s.ogDescription ?? null,
            ogImageUrl: s.ogImageUrl ?? null,
            canonicalUrl: s.canonicalUrl ?? null,
            robotsNoindex: !!s.robotsNoindex,
            robotsNofollow: !!s.robotsNofollow,
            structuredData: s.structuredData ?? null,
          },
          update: {
            metaTitleTh: s.metaTitleTh ?? null,
            metaTitleEn: s.metaTitleEn ?? null,
            metaDescriptionTh: s.metaDescriptionTh ?? null,
            metaDescriptionEn: s.metaDescriptionEn ?? null,
            metaKeywordsTh: s.metaKeywordsTh ?? null,
            metaKeywordsEn: s.metaKeywordsEn ?? null,
            ogTitle: s.ogTitle ?? null,
            ogDescription: s.ogDescription ?? null,
            ogImageUrl: s.ogImageUrl ?? null,
            canonicalUrl: s.canonicalUrl ?? null,
            robotsNoindex: !!s.robotsNoindex,
            robotsNofollow: !!s.robotsNofollow,
            structuredData: s.structuredData ?? null,
          },
        });
      }
    } catch {}

    return updatedCore.id;
  });

  // ส่งกลับ snapshot ล่าสุด
  const [i18n, a, seo] = await Promise.all([
    readI18n(id),
    prisma.article.findUnique({
      where: { id },
      include: {
        tags: { select: { tagId: true } },
        categories: { select: { categoryId: true } },
      },
    }),
    (async () => {
      try {
        if ((prisma as any).seoMeta?.findUnique) {
          return await (prisma as any).seoMeta.findUnique({
            where: { contentType_targetId: { contentType: "article", targetId: id } },
          });
        }
      } catch {}
      return null;
    })(),
  ]);

  const tagIds = (a?.tags || []).map((x: any) => x.tagId);
  const categoryIds = (a?.categories || []).map((x: any) => x.categoryId);
  const slug = typeof (a as any)?.slug === "string" ? (a as any).slug : "";

  return NextResponse.json({
    ...(a || {}),
    slug,
    i18n,
    seo,
    tagIds,
    categoryIds,
  });
}

// ──────────────── DELETE /api/admin/articles/[id]
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.article.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
