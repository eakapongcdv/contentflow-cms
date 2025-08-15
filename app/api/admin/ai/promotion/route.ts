// app/api/admin/ai/promotion/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

/** 👉 ใช้ NEXTAUTH_WEB_URL เป็นฐานของ canonical URL */
const BASE_URL =
  process.env.NEXTAUTH_WEB_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://example.com";

function slugify(input: string) {
  return (input || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9ก-๙\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function ensureCanonical(urlFromAI: any, fallbackName: string) {
  const candidate = typeof urlFromAI === "string" ? urlFromAI.trim() : "";
  const looksAbsolute = /^https?:\/\//i.test(candidate);
  if (candidate && looksAbsolute) return candidate;
  const slug = slugify(fallbackName || "promotion");
  return `${BASE_URL.replace(/\/+$/, "")}/promotions/${slug}`;
}

function normalizeKeywordsString(v: any) {
  if (Array.isArray(v)) {
    return v.map((x) => String(x).trim()).filter(Boolean).join(", ");
  }
  if (typeof v === "string") return v.trim();
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form, seo } = body || {};

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system =
      "You are an assistant that fills marketing promotion content for a shopping mall CMS. Always respond with STRICT JSON. No commentary.";

    // ✅ ขอ SEO ครบ รวม metaKeywordsTH/EN + canonical URL (absolute)
    const user = {
      task: "Generate improved content for a mall promotion and full SEO meta.",
      baseUrl: BASE_URL,
      input: { form, seo },
      requirements: {
        language_policy:
          "Use Thai if original appears Thai, else English. Keep tone concise and commercial.",
        want: {
          form: ["nameTh", "nameEn", "descriptionTh", "descriptionEn"],
          seo: [
            "ogTitle",
            "ogDescription",
            "ogImageUrl",
            "metaTitleTh",
            "metaTitleEn",
            "metaDescriptionTh",
            "metaDescriptionEn",
            "metaKeywordsTh",   // ✅ TH
            "metaKeywordsEn",   // ✅ EN
            "canonicalUrl",     // ✅ must be absolute
            "robotsNoindex",
            "robotsNofollow",
            "structuredData"    // JSON-LD object (Offer recommended)
          ]
        },
        jsonld_hint:
          "Prefer schema.org/Offer for promotions. Include reasonable fields and keep it valid JSON-LD.",
        constraints: [
          "Return JSON with top-level keys only (no prose): { form: {...}, seo: {...} }",
          "seo.canonicalUrl MUST be absolute (starts with http).",
          "seo.metaKeywordsTh and seo.metaKeywordsEn are comma-separated strings.",
          "seo.structuredData must be a valid JSON object (not a string)."
        ]
      }
    };

    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(user) }
      ]
    });

    const text = resp.choices?.[0]?.message?.content || "{}";
    let j: any = {};
    try {
      j = JSON.parse(text);
    } catch {
      j = {};
    }

    // ---------- Post-process & Fallbacks ----------
    const nameFallback =
      j?.form?.nameTh ||
      j?.form?.nameEn ||
      form?.nameTh ||
      form?.nameEn ||
      "promotion";

    const out = {
      form: {
        nameTh: j?.form?.nameTh ?? form?.nameTh,
        nameEn: j?.form?.nameEn ?? form?.nameEn,
        descriptionTh: j?.form?.descriptionTh ?? form?.descriptionTh,
        descriptionEn: j?.form?.descriptionEn ?? form?.descriptionEn
      },
      seo: {
        ogTitle:
          j?.seo?.ogTitle ??
          seo?.ogTitle ??
          j?.form?.nameTh ??
          j?.form?.nameEn ??
          form?.nameTh ??
          form?.nameEn,
        ogDescription:
          j?.seo?.ogDescription ??
          seo?.ogDescription ??
          j?.form?.descriptionTh ??
          j?.form?.descriptionEn ??
          form?.descriptionTh ??
          form?.descriptionEn,
        ogImageUrl:
          j?.seo?.ogImageUrl ??
          seo?.ogImageUrl ??
          form?.coverImageUrl ??
          form?.logoUrl ??
          null,

        metaTitleTh:
          j?.seo?.metaTitleTh ??
          seo?.metaTitleTh ??
          (j?.form?.nameTh || form?.nameTh) ??
          null,
        metaTitleEn:
          j?.seo?.metaTitleEn ??
          seo?.metaTitleEn ??
          (j?.form?.nameEn || form?.nameEn) ??
          null,
        metaDescriptionTh:
          j?.seo?.metaDescriptionTh ??
          seo?.metaDescriptionTh ??
          j?.seo?.ogDescription ??
          null,
        metaDescriptionEn:
          j?.seo?.metaDescriptionEn ??
          seo?.metaDescriptionEn ??
          j?.seo?.ogDescription ??
          null,

        /** ✅ Keywords แยกภาษา */
        metaKeywordsTh: normalizeKeywordsString(
          j?.seo?.metaKeywordsTh ?? seo?.metaKeywordsTh
        ),
        metaKeywordsEn: normalizeKeywordsString(
          j?.seo?.metaKeywordsEn ?? seo?.metaKeywordsEn
        ),

        /** ✅ Canonical จาก NEXTAUTH_WEB_URL */
        canonicalUrl: ensureCanonical(
          j?.seo?.canonicalUrl || seo?.canonicalUrl,
          nameFallback
        ),

        robotsNoindex:
          typeof j?.seo?.robotsNoindex === "boolean"
            ? j.seo.robotsNoindex
            : !!seo?.robotsNoindex,
        robotsNofollow:
          typeof j?.seo?.robotsNofollow === "boolean"
            ? j.seo.robotsNofollow
            : !!seo?.robotsNofollow,

        structuredData:
          j?.seo?.structuredData && typeof j.seo.structuredData === "object"
            ? j.seo.structuredData
            : {
                "@context": "https://schema.org",
                "@type": "Offer",
                name:
                  j?.form?.nameTh ||
                  j?.form?.nameEn ||
                  form?.nameTh ||
                  form?.nameEn,
                description:
                  j?.seo?.ogDescription ||
                  seo?.ogDescription ||
                  j?.form?.descriptionTh ||
                  j?.form?.descriptionEn ||
                  "",
                image:
                  j?.seo?.ogImageUrl ||
                  seo?.ogImageUrl ||
                  form?.coverImageUrl ||
                  form?.logoUrl ||
                  undefined,
                priceCurrency: "THB",
                url: ensureCanonical(
                  j?.seo?.canonicalUrl || seo?.canonicalUrl,
                  nameFallback
                )
              }
      }
    };

    // ให้ฟอร์มใช้ structuredData เป็น string
    const structuredString = JSON.stringify(out.seo.structuredData, null, 2);
    (out.seo as any).structuredData = structuredString;

    return NextResponse.json(out);
  } catch (e: any) {
    console.error("AI promotion error:", e);
    return NextResponse.json({ error: "ai_generation_failed" }, { status: 500 });
  }
}
