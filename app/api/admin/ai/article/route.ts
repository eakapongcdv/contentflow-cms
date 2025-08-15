// app/api/admin/ai/article/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

type Lang = "th" | "en" | "cn";
type I18nFields = {
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentMd?: string;
  contentHtml?: string;
};
type ArticleState = {
  slug: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  coverImageUrl?: string | null;
  authorName?: string | null;
  readingTime?: number | null;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  i18n: Record<Lang, I18nFields>;
};
type SeoState = {
  metaTitleTh?: string | null;
  metaTitleEn?: string | null;
  metaDescriptionTh?: string | null;
  metaDescriptionEn?: string | null;
  metaKeywordsTh?: string | null;
  metaKeywordsEn?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  robotsNoindex?: boolean;
  robotsNofollow?: boolean;
  structuredData?: string | object | null;
};

/* ---------- helpers (fallback heuristic if no key/prompt) ---------- */
const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");
function wordsCount(s: string) { return s.trim().split(/\s+/).filter(Boolean).length; }
function estimateReadingTimeMd(md?: string) {
  const wpm = 220;
  const wc = wordsCount(stripHtml(md || ""));
  return Math.max(1, Math.round(wc / wpm));
}
function ensure<T>(v: T | undefined | null, fb: T): T { return (v as any) ?? fb; }

function genDemoContent(title: string, lang: Lang): I18nFields {
  const base = {
    th: {
      subtitle: "สรุปประเด็นสำคัญและบริบท",
      excerpt:
        "ย่อหน้าสรุปที่เล่าใจความสำคัญของบทความ สั้น กระชับ ชวนคลิกอ่านต่อ",
      contentMd: `## บทนำ\n\nอธิบายความสำคัญของ “${title}” และบริบท\n\n## ประเด็นสำคัญ\n- ประเด็นที่ 1\n- ประเด็นที่ 2\n- ประเด็นที่ 3\n\n## สรุป\nสรุปใจความสำคัญและสิ่งที่ผู้อ่านควรนำไปใช้ต่อ`,
    },
    en: {
      subtitle: "Key takeaways and context",
      excerpt:
        "A concise summary that highlights the core idea and invites readers to continue.",
      contentMd: `## Introduction\n\nWhy “${title}” matters and the context\n\n## Key Points\n- Point #1\n- Point #2\n- Point #3\n\n## Conclusion\nWrap up the insights and suggest next steps for readers.`,
    },
    cn: {
      subtitle: "重点与背景",
      excerpt: "简短摘要，突出核心要点并吸引继续阅读。",
      contentMd: `## 引言\n\n说明“${title}”的重要性与背景\n\n## 关键点\n- 要点一\n- 要点二\n- 要点三\n\n## 结语\n总结核心内容并给出后续建议。`,
    },
  } as const;
  const d = base[lang];
  return { title, subtitle: d.subtitle, excerpt: d.excerpt, contentMd: d.contentMd };
}

function heuristicGenerate(input: { form: Partial<ArticleState>; seo: Partial<SeoState> }) {
  const inForm = input.form;
  const inSeo = input.seo;

  const fallbackTitle =
    inForm.i18n?.th?.title || inForm.i18n?.en?.title || inForm.i18n?.cn?.title || "New Article";

  const form: ArticleState = {
    slug:
      ensure(inForm.slug, "") ||
      fallbackTitle.toLowerCase().replace(/[^a-z0-9\- ]/g, "").trim().replace(/\s+/g, "-").slice(0, 120),
    status: (inForm.status as any) || "DRAFT",
    coverImageUrl: ensure(inForm.coverImageUrl, null),
    authorName: ensure(inForm.authorName, "Editorial Team"),
    readingTime:
      inForm.readingTime ??
      estimateReadingTimeMd(
        inForm.i18n?.th?.contentMd || inForm.i18n?.en?.contentMd || inForm.i18n?.cn?.contentMd || ""
      ),
    publishedAt: (inForm.publishedAt as any) || null,
    scheduledAt: (inForm.scheduledAt as any) || null,
    i18n: {
      th: { ...genDemoContent(ensure(inForm.i18n?.th?.title, fallbackTitle), "th"), ...inForm.i18n?.th },
      en: { ...genDemoContent(ensure(inForm.i18n?.en?.title, fallbackTitle + " (EN)"), "en"), ...inForm.i18n?.en },
      cn: { ...genDemoContent(ensure(inForm.i18n?.cn?.title, fallbackTitle + "（中文）"), "cn"), ...inForm.i18n?.cn },
    },
  };

  const descTh = clamp(
    stripHtml(inSeo.metaDescriptionTh) ||
      stripHtml(form.i18n.th.excerpt) ||
      stripHtml(form.i18n.th.contentMd) ||
      "",
    160
  );
  const descEn = clamp(
    stripHtml(inSeo.metaDescriptionEn) ||
      stripHtml(form.i18n.en.excerpt) ||
      stripHtml(form.i18n.en.contentMd) ||
      "",
    160
  );

  const seo: SeoState = {
    ...inSeo,
    metaTitleTh: inSeo.metaTitleTh ?? form.i18n.th.title,
    metaTitleEn: inSeo.metaTitleEn ?? form.i18n.en.title,
    metaDescriptionTh: inSeo.metaDescriptionTh ?? descTh,
    metaDescriptionEn: inSeo.metaDescriptionEn ?? descEn,
    ogTitle: inSeo.ogTitle ?? (form.i18n.th.title || form.i18n.en.title),
    ogDescription: inSeo.ogDescription ?? descTh,
    ogImageUrl: inSeo.ogImageUrl ?? form.coverImageUrl ?? null,
    canonicalUrl: inSeo.canonicalUrl ?? null,
    robotsNoindex: !!inSeo.robotsNoindex,
    robotsNofollow: !!inSeo.robotsNofollow,
    structuredData: {
      "@context": "https://schema.org",
      "@type": form.status === "PUBLISHED" ? "NewsArticle" : "Article",
      headline: form.i18n.th.title || form.i18n.en.title || "Article",
      description: descTh || undefined,
      image: form.coverImageUrl ? [form.coverImageUrl] : undefined,
      author: form.authorName ? { "@type": "Person", name: form.authorName } : undefined,
      datePublished: form.publishedAt || undefined,
      dateModified: form.scheduledAt || form.publishedAt || undefined,
      mainEntityOfPage: inSeo.canonicalUrl || undefined,
    },
  };

  return { form, seo };
}

/* ---------- OpenAI JSON generator ---------- */
async function openaiGenerate(prompt: string, input: { form: Partial<ArticleState>; seo: Partial<SeoState> }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !prompt.trim()) {
    // ไม่มี key หรือไม่ส่ง prompt → ใช้ heuristic
    return heuristicGenerate(input);
  }

  const client = new OpenAI({ apiKey });

  // สั่งให้ตอบกลับเป็น JSON ที่ map กลับเข้า form/seo ได้ทันที
  const sys = `
You are an editorial CMS assistant. Given a prompt, generate a full multilingual article (th,en,cn) and SEO metadata.
Return a STRICT JSON object with keys: { "form": ArticleState, "seo": SeoState }.
- ArticleState.i18n.{th,en,cn}.{title,subtitle,excerpt,contentMd} must be filled.
- Slug should be URL-friendly, <= 120 chars.
- Status can be "DRAFT" unless otherwise implied.
- readingTime (minutes) should be integer (estimate from content length).
- SEO fields should reflect the content (meta titles/descriptions in correct language).
- structuredData must be a valid JSON-LD for Article or NewsArticle.
Do not include any markdown fences or extra text; JSON ONLY.
`;

  const user = `
PROMPT:
${prompt}

CURRENT_FORM (partial, may be empty):
${JSON.stringify(input.form || {}, null, 2)}

CURRENT_SEO (partial, may be empty):
${JSON.stringify(input.seo || {}, null, 2)}
`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: sys.trim() },
      { role: "user", content: user.trim() },
    ],
    temperature: 0.7,
  });

  const content = completion.choices?.[0]?.message?.content || "{}";
  let out: any = {};
  try {
    out = JSON.parse(content);
  } catch {
    // ถ้า parse ไม่ได้ fallback
    return heuristicGenerate(input);
  }

  // การป้องกัน minimal: ถ้าขาด field สำคัญ -> เติม
  if (!out?.form || !out?.seo) {
    return heuristicGenerate(input);
  }
  return out as { form: ArticleState; seo: SeoState };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt = "", form = {}, seo = {} } = body || {};
    const out = await openaiGenerate(String(prompt || ""), { form, seo });
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
