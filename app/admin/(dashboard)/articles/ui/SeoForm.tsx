// app/admin/(dashboard)/articles/ui/SeoForm.tsx
"use client";

import { useState } from "react";

type Seo = {
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
  structuredData?: any;
};

export default function SeoForm({ articleId, initialSeo }: { articleId: string; initialSeo?: Seo | null }) {
  const [form, setForm] = useState<Seo>(
    initialSeo ?? { robotsNoindex: false, robotsNofollow: false }
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/seo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      alert("Saved SEO");
    } catch (e: any) {
      alert(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Meta Title (TH)</label>
          <input className="input" value={form.metaTitleTh ?? ""} onChange={(e) => setForm({ ...form, metaTitleTh: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Meta Title (EN)</label>
          <input className="input" value={form.metaTitleEn ?? ""} onChange={(e) => setForm({ ...form, metaTitleEn: e.target.value })} />
        </div>

        <div>
          <label className="text-sm">Meta Description (TH)</label>
          <textarea className="textarea" value={form.metaDescriptionTh ?? ""} onChange={(e) => setForm({ ...form, metaDescriptionTh: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Meta Description (EN)</label>
          <textarea className="textarea" value={form.metaDescriptionEn ?? ""} onChange={(e) => setForm({ ...form, metaDescriptionEn: e.target.value })} />
        </div>

        <div>
          <label className="text-sm">Meta Keywords (TH)</label>
          <input className="input" value={form.metaKeywordsTh ?? ""} onChange={(e) => setForm({ ...form, metaKeywordsTh: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">Meta Keywords (EN)</label>
          <input className="input" value={form.metaKeywordsEn ?? ""} onChange={(e) => setForm({ ...form, metaKeywordsEn: e.target.value })} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">OG Title</label>
          <input className="input" value={form.ogTitle ?? ""} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} />
        </div>
        <div>
          <label className="text-sm">OG Description</label>
          <input className="input" value={form.ogDescription ?? ""} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">OG Image URL</label>
          <input className="input" value={form.ogImageUrl ?? ""} onChange={(e) => setForm({ ...form, ogImageUrl: e.target.value })} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Canonical URL</label>
          <input className="input" value={form.canonicalUrl ?? ""} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
        </div>
        <div className="flex items-center gap-6 mt-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!form.robotsNoindex} onChange={(e) => setForm({ ...form, robotsNoindex: e.target.checked })} />
            <span className="text-sm">robots: noindex</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={!!form.robotsNofollow} onChange={(e) => setForm({ ...form, robotsNofollow: e.target.checked })} />
            <span className="text-sm">robots: nofollow</span>
          </label>
        </div>
      </div>

      <div>
        <label className="text-sm">Structured Data (JSON-LD)</label>
        <textarea
          className="textarea h-40"
          value={form.structuredData ? JSON.stringify(form.structuredData, null, 2) : ""}
          onChange={(e) => {
            try {
              const v = e.target.value.trim();
              setForm({ ...form, structuredData: v ? JSON.parse(v) : null });
            } catch {
              // แสดงข้อความแบบง่าย ๆ แต่ไม่ขัดจังหวะ
            }
          }}
          placeholder={`{ "@context":"https://schema.org", "@type":"NewsArticle", ... }`}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={() => history.back()}>Back</button>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save SEO"}
        </button>
      </div>
    </div>
  );
}
