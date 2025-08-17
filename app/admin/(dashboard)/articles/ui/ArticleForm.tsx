// app/admin/(dashboard)/articles/ui/ArticleForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Code2, Eye, HelpCircle } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { OverlaySpinner } from "@/app/components/ui/overlay-spinner";
import { FormActions } from "@/app/components/ui/form-actions";
import { MediaPickerCard } from "@/app/components/ui/media-picker-card";
import { AiPromptPanel } from "@/app/components/ui/ai-prompt-panel";
import { slugify } from "@/app/components/ui/utils";

// TinyMCE editor (client-only)
const TinyMCEClient = dynamic(
  () => import("../../TinyMCEClient"),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border admin-card h-[300px] animate-pulse" />
    ),
  }
);
/* ====================== Types ====================== */
type Lang = "th" | "en" | "cn";

type I18nFields = {
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentMd?: string;
  contentHtml?: string;
};

type ArticleFormProps = {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<ArticleState>;
  initialSeo?: Partial<SeoState>;
};

type ArticleState = {
  slug: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  coverImageUrl?: string | null;
  coverImageW?: number | null;
  coverImageH?: number | null;
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

/* ====================== Utils ====================== */
const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

function ensure<T>(v: T | undefined | null, fb: T): T {
  return (v as any) ?? fb;
}

function toDisplayUrl(url: string) {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean).slice(0, 3);
    return `${u.host}${segs.length ? " › " + segs.join(" › ") : ""}`;
  } catch {
    return url;
  }
}

function pickJsonLd(obj: any): any {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj[0] || null;
  if (obj["@graph"] && Array.isArray(obj["@graph"])) return obj["@graph"][0] || obj;
  return obj;
}

function makeSeoDefaults(core: ArticleState): SeoState {
  const title =
    core.i18n?.th?.title || core.i18n?.en?.title || core.i18n?.cn?.title || "Article";
  const desc =
    (stripHtml(core.i18n?.th?.excerpt) ||
      stripHtml(core.i18n?.en?.excerpt) ||
      stripHtml(core.i18n?.cn?.excerpt) ||
      stripHtml(core.i18n?.th?.contentMd) ||
      stripHtml(core.i18n?.en?.contentMd) ||
      stripHtml(core.i18n?.cn?.contentMd) ||
      "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

  return {
    metaTitleTh: core.i18n?.th?.title || null,
    metaTitleEn: core.i18n?.en?.title || null,
    metaDescriptionTh:
      stripHtml(core.i18n?.th?.excerpt) ||
      stripHtml(core.i18n?.th?.contentMd) ||
      null,
    metaDescriptionEn:
      stripHtml(core.i18n?.en?.excerpt) ||
      stripHtml(core.i18n?.en?.contentMd) ||
      null,
    metaKeywordsTh: null,
    metaKeywordsEn: null,
    ogTitle: title,
    ogDescription: desc || null,
    ogImageUrl: core.coverImageUrl || null,
    canonicalUrl: null,
    robotsNoindex: false,
    robotsNofollow: false,
    structuredData: null,
  };
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : undefined;
}

/* ---------- i18n -> translations payload ---------- */
type TranslationPayload = {
  title: string;
  subtitle?: string;
  excerpt?: string;
  contentMd?: string;
  contentHtml?: string;
};

function makeTranslationsFromForm(
  f: ArticleState
): Record<"th" | "en" | "cn", TranslationPayload> {
  const fallbackTitle =
    f.i18n.th.title || f.i18n.en.title || f.i18n.cn.title || "Untitled";

  const to = (lang: Lang): TranslationPayload => ({
    title: f.i18n[lang].title || fallbackTitle,
    subtitle: f.i18n[lang].subtitle || "",
    excerpt: f.i18n[lang].excerpt || "",
    contentMd: f.i18n[lang].contentMd || "",
    contentHtml: f.i18n[lang].contentHtml || "",
  });

  return { th: to("th"), en: to("en"), cn: to("cn") };
}

/* ====================== Component ====================== */
export default function ArticleForm({ mode, id, initial, initialSeo }: ArticleFormProps) {
  const router = useRouter();
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");

  const [form, setForm] = useState<ArticleState>({
    slug: initial?.slug || "",
    status: (initial?.status as any) || "DRAFT",
    coverImageUrl: ensure(initial?.coverImageUrl, null),
    coverImageW: ensure(initial?.coverImageW, null),
    coverImageH: ensure(initial?.coverImageH, null),
    authorName: ensure(initial?.authorName as any, ""),
    readingTime: ensure(initial?.readingTime as any, null),
    publishedAt: (initial?.publishedAt as any) || null,
    scheduledAt: (initial?.scheduledAt as any) || null,
    i18n: {
      th: {
        title: initial?.i18n?.th?.title || "",
        subtitle: initial?.i18n?.th?.subtitle || "",
        excerpt: initial?.i18n?.th?.excerpt || "",
        contentMd: initial?.i18n?.th?.contentMd || "",
        contentHtml: initial?.i18n?.th?.contentHtml || "",
      },
      en: {
        title: initial?.i18n?.en?.title || "",
        subtitle: initial?.i18n?.en?.subtitle || "",
        excerpt: initial?.i18n?.en?.excerpt || "",
        contentMd: initial?.i18n?.en?.contentMd || "",
        contentHtml: initial?.i18n?.en?.contentHtml || "",
      },
      cn: {
        title: initial?.i18n?.cn?.title || "",
        subtitle: initial?.i18n?.cn?.subtitle || "",
        excerpt: initial?.i18n?.cn?.excerpt || "",
        contentMd: initial?.i18n?.cn?.contentMd || "",
        contentHtml: initial?.i18n?.cn?.contentHtml || "",
      },
    },
  });

  const [seo, setSeo] = useState<SeoState>({ ...(initialSeo || {}) });

  // ถ้าไม่มี SEO เลย -> default จากเนื้อหา
  useEffect(() => {
    const hasSeo =
      !!(seo.metaTitleTh || seo.metaTitleEn || seo.ogTitle || seo.ogDescription || seo.ogImageUrl || seo.canonicalUrl ||
        seo.metaDescriptionTh || seo.metaDescriptionEn || seo.metaKeywordsTh || seo.metaKeywordsEn);
    if (!hasSeo) setSeo((s) => ({ ...makeSeoDefaults(form), ...s }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- helpers ---------- */
  const update = <K extends keyof ArticleState>(k: K, v: ArticleState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const updateI18n = (lang: Lang, k: keyof I18nFields, v: string) =>
    setForm((s) => ({
      ...s,
      i18n: { ...s.i18n, [lang]: { ...s.i18n[lang], [k]: v } },
    }));

  const updateSeo = (k: keyof SeoState, v: any) => setSeo((s) => ({ ...s, [k]: v }));

  const structuredText = useMemo(
    () =>
      typeof seo.structuredData === "string"
        ? seo.structuredData
        : JSON.stringify(seo.structuredData || {}, null, 2),
    [seo.structuredData]
  );

  // Preview (เหมือน Google)
  const preview = useMemo(() => {
    let node: any = {};
    try {
      const obj = structuredText ? JSON.parse(structuredText) : {};
      node = pickJsonLd(obj) || {};
    } catch {
      node = {};
    }

    const ldName = node.headline as string | undefined;
    const ldDesc = node.description as string | undefined;
    const title =
      ldName ||
      seo.ogTitle ||
      seo.metaTitleTh ||
      seo.metaTitleEn ||
      form.i18n.th.title ||
      form.i18n.en.title ||
      form.i18n.cn.title ||
      "Article";

    const desc = clamp(
      stripHtml(ldDesc) ||
        (seo.ogDescription ||
          stripHtml(form.i18n.th.excerpt) ||
          stripHtml(form.i18n.en.excerpt) ||
          stripHtml(form.i18n.cn.excerpt) ||
          stripHtml(form.i18n.th.contentMd) ||
          stripHtml(form.i18n.en.contentMd) ||
          stripHtml(form.i18n.cn.contentMd) ||
          ""),
      158
    );

    const url = seo.canonicalUrl || "https://example.com/articles/draft";
    const gTitle = clamp(title, 60);
    const gUrl = url;
    const gDisplayUrl = toDisplayUrl(gUrl);
    const image = seo.ogImageUrl || form.coverImageUrl || "";

    return { gTitle, gUrl, gDisplayUrl, desc, image };
  }, [structuredText, seo, form]);

  /* ---------- AI ---------- */
  const SAMPLE_PROMPTS = [
    {
      label: "How-to (TH/EN/CN)",
      prompt:
        "สร้างบทความ How-to โทนเป็นกันเอง จัดเป็นหัวข้อย่อยและ bullet points สรุปท้ายเรื่อง สร้าง 3 ภาษา (TH/EN/CN) พร้อม SEO (meta title/description ในภาษานั้น ๆ) และ JSON-LD สำหรับ Article",
    },
    {
      label: "News style",
      prompt:
        "เขียนข่าวสั้นเชิงทางการ มีไทม์ไลน์ สร้าง 3 ภาษา (TH/EN/CN) พร้อม SEO และ JSON-LD (NewsArticle)",
    },
    {
      label: "Product review",
      prompt:
        "รีวิวสินค้าเชิงลึก เทียบข้อดี-ข้อจำกัด มีสรุป pros/cons และคำแนะนำสุดท้าย สร้าง TH/EN/CN + SEO + JSON-LD",
    },
  ];

  // สร้าง prompt อัตโนมัติจากหัวข้อภาษาไทย (ถ้ามี)
  const derivedPrompt = useMemo(() => {
    const thTitle = (form.i18n?.th?.title || "").trim();
    if (!thTitle) return "";
    return `หัวข้อ: “${thTitle}”
โทนภาษาเป็นมิตร สรุปอ่านง่าย
สร้างบทความ 3 ภาษา (TH/EN/CN) โดย:
- สร้าง title, subtitle, excerpt
- เนื้อหา markdown มีหัวข้อย่อยและ bullet
- ประมาณเวลาอ่าน (readingTime)
- ทำ SEO (meta title/description แยกภาษา) + og fields
- สร้าง JSON-LD แบบ Article/NewsArticle ตามความเหมาะสม
- สร้าง slug จากชื่อเรื่อง (ภาษาอังกฤษ/ทับศัพท์) ความยาวไม่เกิน 120 ตัวอักษร`;
  }, [form.i18n?.th?.title]);

  const onAIGenerate = async () => {
    try {
      setLoadingAI(true);
      const res = await fetch("/api/admin/ai/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, form, seo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI generation failed");

      // ถ้า API ส่งกลับเป็น data.form.translations -> map เป็น i18n
      if (data.form?.translations) {
        const t = data.form.translations as Record<Lang, Partial<I18nFields>>;
        setForm((s) => ({
          ...s,
          ...data.form,
          i18n: {
            th: { ...(s.i18n.th), ...(t.th || {}) },
            en: { ...(s.i18n.en), ...(t.en || {}) },
            cn: { ...(s.i18n.cn), ...(t.cn || {}) },
          },
        }));
      } else if (data.form) {
        setForm((s) => ({ ...s, ...data.form }));
      }

      if (data.seo) {
        setSeo((s) => ({
          ...s,
          ...data.seo,
          structuredData:
            typeof data.seo.structuredData === "string"
              ? data.seo.structuredData
              : JSON.stringify(data.seo.structuredData || {}, null, 2),
        }));
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoadingAI(false);
    }
  };

  /* ---------- CRUD actions ---------- */
  const onSave = async () => {
    // validate: ต้องมี title อย่างน้อยหนึ่งภาษา
    const anyTitle = (form.i18n.th.title || form.i18n.en.title || form.i18n.cn.title || "").trim();
    if (!anyTitle) {
      alert("translations.{th|en|cn}.title is required");
      return;
    }

    const translations = makeTranslationsFromForm(form);
    const derivedSlug =
      form.slug?.trim() ||
      slugify(form.i18n.en.title || form.i18n.th.title || form.i18n.cn.title || "article", 120);

    const payload = {
      slug: derivedSlug,
      status: form.status,
      coverImageUrl: form.coverImageUrl || null,
      coverImageW: form.coverImageW ?? null,
      coverImageH: form.coverImageH ?? null,
      authorName: form.authorName || null,
      readingTime: form.readingTime ?? null,
      publishedAt: form.publishedAt ? new Date(form.publishedAt) : null,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt) : null,
      translations, // ⬅️ รูปแบบที่ API ต้องการ
      seo: {
        ...seo,
        structuredData:
          typeof seo.structuredData === "string"
            ? seo.structuredData
            : JSON.stringify(seo.structuredData || {}),
      },
    };

    // แนบ websiteId ไปกับ header ถ้าใช้หลายเว็บไซต์
    const websiteId = getCookie("websiteId");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (websiteId) headers["x-website-id"] = websiteId;

    const url = mode === "create" ? "/api/admin/articles" : `/api/admin/articles/${id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || j?.message || "Save failed");
      return;
    }
    router.push("/admin/articles");
    router.refresh();
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this article?")) return;
    const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    router.push("/admin/articles");
    router.refresh();
  };

  const onPreviewDraft = () => {
    const draft = {
      core: form,
      seo: {
        ...seo,
        structuredData:
          typeof seo.structuredData === "string" ? seo.structuredData : JSON.stringify(seo.structuredData, null, 2),
      },
    };
    const s = JSON.stringify(draft);
    const b64 =
      typeof window === "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s)));
    const d = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    window.open(`/admin/preview/article/draft?d=${encodeURIComponent(d)}`, "_blank");
  };

  const tinymceApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "";

  /* ====================== UI ====================== */
  return (
    <div className="relative">
      <OverlaySpinner open={loadingAI} message="AI is generating content…" />

      <form
        className={`grid gap-3 ${loadingAI ? "pointer-events-none select-none opacity-60" : ""}`}
        aria-busy={loadingAI}
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        {/* AI PROMPT PANEL (dark mode card) */}
        <AiPromptPanel
          value={aiPrompt}
          onChange={setAiPrompt}
          onClear={() => setAiPrompt("")}
          onGenerate={onAIGenerate}
          loading={loadingAI}
          samples={SAMPLE_PROMPTS}
          derivedPrompt={derivedPrompt}
          onUseDerived={() => setAiPrompt(derivedPrompt)}
        />

        {/* BASIC INFO (slug/status) */}
        <section className="admin-card p-4 mt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Basic</h3>
              <p className="text-sm text-white/60">
                กำหนด slug, status และเนื้อหา 3 ภาษา (TH/EN/CN)
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <label className="grid gap-1">
              <span className="text-sm">Slug</span>
              <input
                className="admin-input"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="auto-generated from title if left blank"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Status</span>
              <select
                className="admin-input"
                value={form.status}
                onChange={(e) => update("status", e.target.value as any)}
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </label>
          </div>
        </section>

        {/* I18N (TH/EN/CN) */}
        {(["th", "en", "cn"] as Lang[]).map((lang) => (
          <section key={lang} className="admin-card p-4">
            <h3 className="text-lg font-semibold uppercase">{lang}</h3>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <label className="grid gap-1">
                <span className="text-sm">Title</span>
                <input
                  className="admin-input"
                  value={form.i18n[lang].title}
                  onChange={(e) => updateI18n(lang, "title", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Subtitle</span>
                <input
                  className="admin-input"
                  value={form.i18n[lang].subtitle || ""}
                  onChange={(e) => updateI18n(lang, "subtitle", e.target.value)}
                />
              </label>

              <label className="grid gap-1 sm:col-span-2">
                <span className="text-sm">Excerpt</span>
                <input
                  className="admin-input"
                  value={form.i18n[lang].excerpt || ""}
                  onChange={(e) => updateI18n(lang, "excerpt", e.target.value)}
                />
              </label>

              <div className="sm:col-span-2">
                <span className="text-sm">Content (Markdown / WYSIWYG)</span>
                <div className="rounded-xl border border-white/10 bg-white/5">
                  <TinyMCEClient
                    apiKey={tinymceApiKey}
                    value={form.i18n[lang].contentMd || ""}
                    init={{
                      height: 300,
                      menubar: false,
                      plugins: "link lists image code",
                      toolbar:
                        "undo redo | bold italic underline | bullist numlist | link | removeformat | code",
                      branding: false,
                      content_style:
                        "body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px }",
                    }}
                    onEditorChange={(content) => updateI18n(lang, "contentMd", content)}
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* MEDIA */}
        <section className="admin-card p-4">
          <h3 className="text-lg font-semibold">Media</h3>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <MediaPickerCard
              label="Cover Image"
              value={form.coverImageUrl || null}
              onChange={(u) => update("coverImageUrl", u)}
            />
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-sm">Author</span>
                <input
                  className="admin-input"
                  value={form.authorName || ""}
                  onChange={(e) => update("authorName", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Reading Time (min)</span>
                <input
                  className="admin-input"
                  type="number"
                  min={1}
                  value={form.readingTime ?? ""}
                  onChange={(e) => update("readingTime", Number(e.target.value) || null)}
                />
              </label>
            </div>
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-sm">Published At</span>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={form.publishedAt || ""}
                  onChange={(e) => update("publishedAt", e.target.value || null)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Scheduled At</span>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={form.scheduledAt || ""}
                  onChange={(e) => update("scheduledAt", e.target.value || null)}
                />
              </label>
            </div>
          </div>
        </section>

        {/* SEO */}
        <section className="admin-card p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-zpell" /> SEO Meta
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="grid gap-1">
              <span className="text-sm">Meta Title (TH)</span>
              <input className="admin-input" value={seo.metaTitleTh || ""} onChange={(e) => updateSeo("metaTitleTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Title (EN)</span>
              <input className="admin-input" value={seo.metaTitleEn || ""} onChange={(e) => updateSeo("metaTitleEn", e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Meta Description (TH)</span>
              <textarea className="admin-input" rows={3} value={seo.metaDescriptionTh || ""} onChange={(e) => updateSeo("metaDescriptionTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Description (EN)</span>
              <textarea className="admin-input" rows={3} value={seo.metaDescriptionEn || ""} onChange={(e) => updateSeo("metaDescriptionEn", e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Meta Keywords (TH, comma)</span>
              <input className="admin-input" value={seo.metaKeywordsTh || ""} onChange={(e) => updateSeo("metaKeywordsTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Keywords (EN, comma)</span>
              <input className="admin-input" value={seo.metaKeywordsEn || ""} onChange={(e) => updateSeo("metaKeywordsEn", e.target.value)} />
            </label>

            <label className="grid gap-1 sm:col-span-2">
              <span className="text-sm">Canonical URL</span>
              <input className="admin-input" value={seo.canonicalUrl || ""} onChange={(e) => updateSeo("canonicalUrl", e.target.value)} placeholder="https://your-domain.com/articles/..." />
            </label>

            <div className="flex items-center gap-4 sm:col-span-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!seo.robotsNoindex} onChange={(e) => updateSeo("robotsNoindex", e.target.checked)} />
                <span className="text-sm">noindex</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!seo.robotsNofollow} onChange={(e) => updateSeo("robotsNofollow", e.target.checked)} />
                <span className="text-sm">nofollow</span>
              </label>
            </div>
          </div>
        </section>

        {/* JSON-LD + Preview */}
        <section className="admin-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-zpell" /> Structured Data (JSON-LD)
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-400/20">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Type: <b className="ml-1">Article</b>
              </span>
              <Button
                variant="outlineZspell"
                onClick={() => {
                  const headline =
                    form.i18n.th.title || form.i18n.en.title || form.i18n.cn.title || "Article";
                  const desc =
                    seo.ogDescription ||
                    stripHtml(form.i18n.th.excerpt) ||
                    stripHtml(form.i18n.en.excerpt) ||
                    stripHtml(form.i18n.cn.excerpt) ||
                    stripHtml(form.i18n.th.contentMd) ||
                    stripHtml(form.i18n.en.contentMd) ||
                    stripHtml(form.i18n.cn.contentMd) ||
                    "";
                  const obj = {
                    "@context": "https://schema.org",
                    "@type": form.status === "PUBLISHED" ? "NewsArticle" : "Article",
                    headline,
                    description: desc,
                    image: form.coverImageUrl ? [form.coverImageUrl] : undefined,
                    author: form.authorName ? { "@type": "Person", name: form.authorName } : undefined,
                    datePublished: form.publishedAt || undefined,
                    dateModified: form.scheduledAt || form.publishedAt || undefined,
                    mainEntityOfPage: seo.canonicalUrl || undefined,
                  };
                  updateSeo("structuredData", JSON.stringify(obj, null, 2));
                }}
              >
                Regenerate
              </Button>
              <Button variant="outlineZspell" onClick={onPreviewDraft} leftIcon={<Eye className="h-4 w-4" aria-hidden />}>
                OG Preview (Draft)
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <textarea
              className="admin-input font-mono text-[12.5px] leading-5"
              rows={14}
              value={structuredText}
              onChange={(e) => updateSeo("structuredData", e.target.value)}
              placeholder='{"@context":"https://schema.org","@type":"Article", ...}'
            />
          </div>

          {/* Google Search Result Preview */}
          <div className="mt-4">
            <h4 className="text-base font-semibold mb-2">Google Search Result Preview</h4>
            <div className="admin-card px-4 py-3">
              <div className="text-[18px] leading-snug">
                <a
                  href={preview.gUrl}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1a0dab" }}
                >
                  {preview.gTitle}
                </a>
              </div>
              <div className="mt-1 text-[13px]" style={{ color: "#0f9d58" }}>
                {preview.gDisplayUrl}
              </div>
              <div className="mt-1 grid grid-cols-[1fr_auto] gap-3">
                <div className="text-[16px] text-white/80">{preview.desc}</div>
                {preview.image ? (
                  <div className="w-[92px] h-[92px] overflow-hidden rounded-md border border-white/10 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.image} alt="" className="w-full h-full object-cover bg-white/10" />
                  </div>
                ) : (
                  <div className="w-[92px] h-[92px]" />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/60">* แสดงผลตาม JSON-LD ปัจจุบันแบบเรียลไทม์</p>
          </div>
        </section>

        {/* FOOTER (shared actions) */}
        <FormActions
          mode={mode}
          saving={loadingAI}
          onSave={onSave}
          onDelete={onDelete}
          showBack={false}
        />
      </form>
    </div>
  );
}
