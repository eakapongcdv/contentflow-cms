// app/admin/(dashboard)/articles/ui/ArticleSeoForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { OverlaySpinner } from "@/app/components/ui/overlay-spinner";
import { FormActions } from "@/app/components/ui/form-actions";
import { MediaPickerCard } from "@/app/components/ui/media-picker-card";
import { Code2, Eye, HelpCircle, RefreshCw, Sparkles } from "lucide-react";

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

export default function ArticleSeoForm({
  articleId,
  initialSeo,
  article,
}: {
  articleId: string;
  initialSeo?: Partial<SeoState> | null;
  article?: any; // ใช้ดึง default title/excerpt มาเติม SEO
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [seo, setSeo] = useState<SeoState>({ ...(initialSeo || {}) });
  const [tab, setTab] = useState<"th" | "en">("th");

  const setSeoField = (k: keyof SeoState, v: any) => setSeo((s) => ({ ...s, [k]: v }));

  const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
  const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

  // เติม default SEO เมื่อยังว่าง
  useEffect(() => {
    const hasBasic =
      seo.metaTitleTh ||
      seo.metaTitleEn ||
      seo.ogTitle ||
      seo.ogDescription ||
      seo.ogImageUrl ||
      seo.canonicalUrl;

    if (!hasBasic && article) {
      const titleTh = article?.translations?.th?.title || "";
      const titleEn = article?.translations?.en?.title || "";
      const excerptTh = article?.translations?.th?.excerpt || "";
      const excerptEn = article?.translations?.en?.excerpt || "";

      setSeo((s) => ({
        metaTitleTh: titleTh || null,
        metaTitleEn: titleEn || null,
        metaDescriptionTh: stripHtml(excerptTh)?.slice(0, 160) || null,
        metaDescriptionEn: stripHtml(excerptEn)?.slice(0, 160) || null,
        ogTitle: titleTh || titleEn || "Article",
        ogDescription: stripHtml(excerptTh) || stripHtml(excerptEn) || null,
        ogImageUrl: s.ogImageUrl ?? null,
        canonicalUrl: s.canonicalUrl ?? null,
        robotsNoindex: false,
        robotsNofollow: false,
        structuredData: s.structuredData ?? null,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  const structuredText = useMemo(
    () =>
      typeof seo.structuredData === "string"
        ? seo.structuredData
        : JSON.stringify(seo.structuredData || {}, null, 2),
    [seo.structuredData]
  );

  // Preview: ใช้ meta/og ปัจจุบัน
  const preview = useMemo(() => {
    const title = clamp(
      seo.ogTitle ||
        seo.metaTitleTh ||
        seo.metaTitleEn ||
        article?.translations?.th?.title ||
        article?.translations?.en?.title ||
        "Article",
      60
    );
    const desc = clamp(
      stripHtml(seo.ogDescription) ||
        stripHtml(seo.metaDescriptionTh) ||
        stripHtml(seo.metaDescriptionEn) ||
        stripHtml(article?.translations?.th?.excerpt) ||
        stripHtml(article?.translations?.en?.excerpt) ||
        "",
      158
    );
    const url = seo.canonicalUrl || `https://example.com/articles/${articleId}`;
    return {
      title,
      desc,
      url,
      displayUrl: (() => {
        try {
          const u = new URL(url);
          const segs = u.pathname.split("/").filter(Boolean).slice(0, 3);
          return `${u.host}${segs.length ? " › " + segs.join(" › ") : ""}`;
        } catch {
          return url;
        }
      })(),
      image: seo.ogImageUrl || "",
    };
  }, [seo, article, articleId]);

  async function save() {
    setSaving(true);
    try {
      // คาดหวัง API PUT /api/admin/articles/[id]/seo (ถ้าไม่มีสามารถปรับไปยัง endpoint ที่คุณใช้อยู่)
      const res = await fetch(`/api/admin/articles/${articleId}/seo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...seo,
          structuredData: typeof seo.structuredData === "string" ? seo.structuredData : JSON.stringify(seo.structuredData || {}),
        }),
      });
      if (!res.ok) {
        // เผื่อกรณียังไม่มี record -> ลอง POST
        if (res.status === 404) {
          const res2 = await fetch(`/api/admin/articles/${articleId}/seo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...seo,
              structuredData:
                typeof seo.structuredData === "string"
                  ? seo.structuredData
                  : JSON.stringify(seo.structuredData || {}),
            }),
          });
          if (!res2.ok) throw new Error("Save failed");
        } else {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || "Save failed");
        }
      }
      router.push(`/admin/articles/${articleId}`);
      router.refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  function regenerateJsonLd() {
    // JSON-LD แบบพื้นฐานสำหรับ Article
    const title = seo.ogTitle || seo.metaTitleTh || seo.metaTitleEn || "Article";
    const desc =
      stripHtml(seo.ogDescription) ||
      stripHtml(seo.metaDescriptionTh) ||
      stripHtml(seo.metaDescriptionEn) ||
      "";
    const image = seo.ogImageUrl || undefined;
    const obj = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: desc || undefined,
      image: image ? [image] : undefined,
      author: article?.authorName ? { "@type": "Person", name: article.authorName } : undefined,
      mainEntityOfPage: seo.canonicalUrl || undefined,
    };
    setSeoField("structuredData", JSON.stringify(obj, null, 2));
  }

  return (
    <div className="relative">
      <OverlaySpinner open={saving} message="Saving…" />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <ButtonGroup>
          <Button type="button" variant="dark-outline"  leftIcon={<Eye className="h-4 w-4" aria-hidden />} onClick={() => window.open(preview.url, "_blank")}>
            Preview
          </Button>
          <Button type="button" variant="dark-outline"  leftIcon={<Sparkles className="h-4 w-4" aria-hidden />} onClick={() => alert("Hook AI here")}>
            AI Assist
          </Button>
        </ButtonGroup>
        <div className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
          <HelpCircle className="h-3.5 w-3.5 mr-1" />
          SEO per Article
        </div>
      </div>

      <form
        className={`grid gap-6 ${saving ? "pointer-events-none select-none opacity-60" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {/* Language tabs (TH/EN) */}
        <div className="flex gap-2">
          {(["th", "en"] as const).map((k) => (
            <Button
              key={k}
              type="button"
              variant="dark-outline"
              onClick={() => setTab(k)}
            >
              {k.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Localized meta */}
        <section className="card p-4 grid gap-3">
          {tab === "th" ? (
            <>
              <label className="grid gap-1">
                <span className="text-sm">Meta Title (TH)</span>
                <input
                  className="inp"
                  value={seo.metaTitleTh || ""}
                  onChange={(e) => setSeoField("metaTitleTh", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Meta Description (TH)</span>
                <textarea
                  className="inp"
                  rows={3}
                  value={seo.metaDescriptionTh || ""}
                  onChange={(e) => setSeoField("metaDescriptionTh", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Meta Keywords (TH, comma)</span>
                <input
                  className="inp"
                  value={seo.metaKeywordsTh || ""}
                  onChange={(e) => setSeoField("metaKeywordsTh", e.target.value)}
                />
              </label>
            </>
          ) : (
            <>
              <label className="grid gap-1">
                <span className="text-sm">Meta Title (EN)</span>
                <input
                  className="inp"
                  value={seo.metaTitleEn || ""}
                  onChange={(e) => setSeoField("metaTitleEn", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Meta Description (EN)</span>
                <textarea
                  className="inp"
                  rows={3}
                  value={seo.metaDescriptionEn || ""}
                  onChange={(e) => setSeoField("metaDescriptionEn", e.target.value)}
                />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Meta Keywords (EN, comma)</span>
                <input
                  className="inp"
                  value={seo.metaKeywordsEn || ""}
                  onChange={(e) => setSeoField("metaKeywordsEn", e.target.value)}
                />
              </label>
            </>
          )}
        </section>

        {/* OG / Robots / Canonical / Image */}
        <section className="card p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm">OG Title</span>
              <input
                className="inp"
                value={seo.ogTitle || ""}
                onChange={(e) => setSeoField("ogTitle", e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Canonical URL</span>
              <input
                className="inp"
                placeholder="https://your-domain.com/articles/..."
                value={seo.canonicalUrl || ""}
                onChange={(e) => setSeoField("canonicalUrl", e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm">OG Description</span>
            <textarea
              className="inp"
              rows={3}
              value={seo.ogDescription || ""}
              onChange={(e) => setSeoField("ogDescription", e.target.value)}
            />
          </label>

          <div className="grid md:grid-cols-3 gap-3">
            <MediaPickerCard
              label="OG Image"
              value={seo.ogImageUrl || null}
              onChange={(url) => setSeoField("ogImageUrl", url)}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!seo.robotsNoindex}
                onChange={(e) => setSeoField("robotsNoindex", e.target.checked)}
              />
              <span className="text-sm">robots: noindex</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!seo.robotsNofollow}
                onChange={(e) => setSeoField("robotsNofollow", e.target.checked)}
              />
              <span className="text-sm">robots: nofollow</span>
            </label>
          </div>
        </section>

        {/* JSON-LD */}
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-zpell" /> Structured Data (JSON-LD)
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="dark-outline"  leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />} type="button" onClick={regenerateJsonLd}>
                Regenerate
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <textarea
              className="inp font-mono text-[12.5px] leading-5"
              rows={14}
              value={structuredText}
              onChange={(e) => setSeoField("structuredData", e.target.value)}
              placeholder='{"@context":"https://schema.org","@type":"Article", ...}'
            />
          </div>

          {/* Google-like preview */}
          <div className="mt-4">
            <h4 className="text-base font-semibold mb-2">Google Search Result Preview</h4>
            <div className="rounded-xl bg-white px-4 py-3 border">
              <div className="text-[18px] leading-snug">
                <a
                  href={preview.url}
                  className="hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#1a0dab" }}
                >
                  {preview.title}
                </a>
              </div>
              <div className="mt-1 text-[13px]" style={{ color: "#0f9d58" }}>
                {preview.displayUrl}
              </div>
              <div className="mt-1 grid grid-cols-[1fr_auto] gap-3">
                <div className="text-[16px] text-gray-700">{preview.desc}</div>
                {preview.image ? (
                  <div className="w-[92px] h-[92px] overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.image} alt="" className="w-full h-full object-cover bg-gray-100" />
                  </div>
                ) : (
                  <div className="w-[92px] h-[92px]" />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">* แสดงผลตามค่า SEO/OG ปัจจุบันแบบเรียลไทม์</p>
          </div>
        </section>

        {/* Actions */}
        <FormActions
          mode="edit"
          saving={saving}
          onSave={save}
          showBack
          saveTextEdit="Save SEO"
          deleteText="Delete" // (ไม่แสดงปุ่มลบ—เพราะไม่ได้ส่ง onDelete)
        />
      </form>
    </div>
  );
}
