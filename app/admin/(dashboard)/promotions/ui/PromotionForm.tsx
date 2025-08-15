// app/admin/(dashboard)/promotions/ui/PromotionForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  CalendarRange,
  Percent,
  ShoppingCart,
  Tag,
  Newspaper,
  Building2,
  Code2,
  Eye,
  Sparkles,
  HelpCircle,
  Loader2,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { OverlaySpinner } from "@/app/components/ui/overlay-spinner";
import { FormActions } from "@/app/components/ui/form-actions";
import { MediaPickerCard } from "@/app/components/ui/media-picker-card";

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

type PromotionFormProps = {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<PromotionState>;
  initialSeo?: Partial<SeoState>;
};

type PromotionState = {
  nameEn: string;
  nameTh: string;
  descriptionEn?: string;
  descriptionTh?: string;
  startDate?: string;
  endDate?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  websiteLink?: string | null;
  venueId?: string | null;
  category?: string | null;
  isFeatured: boolean;
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

type JsonLdType = "Offer" | "SaleEvent" | "Event" | "Product" | "Article" | "LocalBusiness";

const isBlank = (v: any) =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (typeof v === "object" && Object.keys(v || {}).length === 0);

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function toIsoLocalInput(d?: string | null) {
  if (!d) return "";
  const x = new Date(d);
  if (isNaN(+x)) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}

const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");

function encodeDraftToBase64Url(obj: any) {
  const s = JSON.stringify(obj);
  const b64 =
    typeof window === "undefined"
      ? Buffer.from(s, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function makeSeoDefaults(core: PromotionState): SeoState {
  const title = core.nameTh || core.nameEn || "Promotion";
  const desc =
    (stripHtml(core.descriptionTh) || stripHtml(core.descriptionEn) || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

  return {
    metaTitleTh: core.nameTh || null,
    metaTitleEn: core.nameEn || null,
    metaDescriptionTh: stripHtml(core.descriptionTh)?.slice(0, 160) || null,
    metaDescriptionEn: stripHtml(core.descriptionEn)?.slice(0, 160) || null,
    metaKeywordsTh: null,
    metaKeywordsEn: null,
    ogTitle: title,
    ogDescription: desc || null,
    ogImageUrl: core.coverImageUrl || core.logoUrl || null,
    canonicalUrl: null,
    robotsNoindex: false,
    robotsNofollow: false,
    structuredData: null,
  };
}

function genJsonLd(type: JsonLdType, core: PromotionState, seo: SeoState) {
  const image = seo.ogImageUrl || core.coverImageUrl || core.logoUrl || undefined;
  const name = core.nameTh || core.nameEn || "Promotion";
  const desc =
    (seo.ogDescription || stripHtml(core.descriptionTh) || stripHtml(core.descriptionEn) || "") ||
    undefined;

  const start = core.startDate ? new Date(core.startDate).toISOString() : undefined;
  const end = core.endDate ? new Date(core.endDate).toISOString() : undefined;

  switch (type) {
    case "Offer":
      return {
        "@context": "https://schema.org",
        "@type": "Offer",
        name,
        description: desc,
        image,
        url: seo.canonicalUrl || undefined,
        priceCurrency: "THB",
        validFrom: start,
        validThrough: end,
        availability: "https://schema.org/InStock",
      };
    case "SaleEvent":
      return {
        "@context": "https://schema.org",
        "@type": "SaleEvent",
        name,
        description: desc,
        startDate: start,
        endDate: end,
        image,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: core.venueId ? { "@type": "Place", name: core.venueId } : undefined,
        url: seo.canonicalUrl || undefined,
      };
    case "Event":
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name,
        description: desc,
        image,
        startDate: start,
        endDate: end,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: core.venueId ? { "@type": "Place", name: core.venueId } : undefined,
        url: seo.canonicalUrl || undefined,
      };
    case "Product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        description: desc,
        image,
        brand: core.category ? { "@type": "Brand", name: core.category } : undefined,
        offers: {
          "@type": "Offer",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
          url: seo.canonicalUrl || undefined,
        },
      };
    case "Article":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: name,
        description: desc,
        image: image ? [image] : undefined,
        author: { "@type": "Organization", name: "Future Park & ZPELL" },
        datePublished: start,
        dateModified: end || start,
        mainEntityOfPage: seo.canonicalUrl || undefined,
      };
    case "LocalBusiness":
      return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name,
        description: desc,
        image,
        url: seo.canonicalUrl || undefined,
      };
    default:
      return {};
  }
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

export default function PromotionForm({ mode, id, initial, initialSeo }: PromotionFormProps) {
  const router = useRouter();
  const [loadingAI, setLoadingAI] = useState(false);

  const [form, setForm] = useState<PromotionState>({
    nameEn: "",
    nameTh: "",
    descriptionEn: "",
    descriptionTh: "",
    dailyStartTime: "",
    dailyEndTime: "",
    coverImageUrl: null,
    logoUrl: null,
    websiteLink: "",
    venueId: "",
    category: "",
    isFeatured: false,
    ...(initial || {}),
    startDate: toIsoLocalInput(initial?.startDate as any),
    endDate: toIsoLocalInput(initial?.endDate as any),
  });

  const [seo, setSeo] = useState<SeoState>({ ...(initialSeo || {}) });
  const [activeJsonLdType, setActiveJsonLdType] = useState<JsonLdType>("Offer");

  useEffect(() => {
    const hasSeo =
      !!(seo.metaTitleTh || seo.metaTitleEn || seo.ogTitle || seo.ogDescription || seo.ogImageUrl || seo.canonicalUrl ||
        seo.metaDescriptionTh || seo.metaDescriptionEn || seo.metaKeywordsTh || seo.metaKeywordsEn);

    if (!hasSeo) setSeo((s) => ({ ...makeSeoDefaults(form), ...s }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const emptyJsonLd =
      !seo.structuredData ||
      (typeof seo.structuredData === "string" &&
        (() => {
          try {
            const obj = JSON.parse(seo.structuredData as string);
            return Object.keys(obj || {}).length === 0;
          } catch {
            return false;
          }
        })());

    if (emptyJsonLd) {
      const obj = genJsonLd(activeJsonLdType, form, seo);
      setSeo((s) => ({ ...s, structuredData: JSON.stringify(obj, null, 2) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJsonLdType]);

  const update = (k: keyof PromotionState, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const updateSeo = (k: keyof SeoState, v: any) => setSeo((s) => ({ ...s, [k]: v }));

  const JSONLD_TABS = [
    { id: "Offer", label: "Offer", icon: Tag },
    { id: "SaleEvent", label: "SaleEvent", icon: Percent },
    { id: "Event", label: "Event", icon: CalendarRange },
    { id: "Product", label: "Product", icon: ShoppingCart },
    { id: "Article", label: "Article", icon: Newspaper },
    { id: "LocalBusiness", label: "LocalBusiness", icon: Building2 },
  ] as const;

  const structuredText = useMemo(
    () =>
      typeof seo.structuredData === "string"
        ? seo.structuredData
        : JSON.stringify(seo.structuredData || {}, null, 2),
    [seo.structuredData]
  );

  const preview = useMemo(() => {
    let node: any = {};
    try {
      const obj = structuredText ? JSON.parse(structuredText) : {};
      node = pickJsonLd(obj) || {};
    } catch {
      node = {};
    }

    const ldType = (node["@type"] as string) || "";
    const ldName = node.name as string | undefined;
    const ldDesc = node.description as string | undefined;
    const ldStart = node.startDate as string | undefined;
    const ldEnd = node.endDate as string | undefined;
    const ldLocName = node?.location?.name as string | undefined;

    const title =
      ldName ||
      seo.ogTitle ||
      seo.metaTitleTh ||
      seo.metaTitleEn ||
      form.nameTh ||
      form.nameEn ||
      "Promotion";

    const desc = clamp(
      stripHtml(ldDesc) ||
        (seo.ogDescription ||
          stripHtml(form.descriptionTh) ||
          stripHtml(form.descriptionEn) ||
          ""),
      158
    );

    const url = seo.canonicalUrl || "https://example.com/promotions/draft";
    const gTitle = clamp(title, 60);
    const gUrl = url;
    const gDisplayUrl = toDisplayUrl(gUrl);
    const gDatePrefix = /Event|SaleEvent/i.test(ldType)
      ? (() => {
          const d = ldStart || ldEnd;
          if (!d) return "";
          const dd = new Date(d);
          if (isNaN(+dd)) return "";
          return `${MONTHS_EN[dd.getUTCMonth()]} ${dd.getUTCDate()}, ${dd.getUTCFullYear()}`;
        })()
      : "";
    const gVenue = ldLocName || "";
    const image = seo.ogImageUrl || form.coverImageUrl || form.logoUrl || "";

    return { gTitle, gUrl, gDisplayUrl, gDatePrefix, desc, gVenue, image };
  }, [structuredText, seo, form]);

  const onSave = async () => {
    const payload = {
      ...form,
      startDate: form.startDate ? new Date(form.startDate) : null,
      endDate: form.endDate ? new Date(form.endDate) : null,
      seo: {
        ...seo,
        structuredData:
          typeof seo.structuredData === "string"
            ? seo.structuredData
            : JSON.stringify(seo.structuredData || {}),
      },
    };

    const url = mode === "create" ? "/api/admin/promotions" : `/api/admin/promotions/${id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || j?.message || "Save failed");
      return;
    }
    router.push("/admin/promotions");
    router.refresh();
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this promotion?")) return;
    const res = await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    router.push("/admin/promotions");
    router.refresh();
  };

  const onPreviewDraft = () => {
    const draft = {
      core: form,
      seo: {
        ...seo,
        structuredData:
          typeof seo.structuredData === "string" ? seo.structuredData : JSON.stringify(seo.structuredData || {}),
      },
    };
    const d = encodeDraftToBase64Url(draft);
    window.open(`/admin/preview/promotion/draft?d=${encodeURIComponent(d)}`, "_blank");
  };

  const onRegenerateJsonLd = () => {
    const obj = genJsonLd(activeJsonLdType, form, seo);
    updateSeo("structuredData", JSON.stringify(obj, null, 2));
  };

  const onAIGenerate = async () => {
    try {
      setLoadingAI(true);
      const res = await fetch("/api/admin/ai/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form, seo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI generation failed");

      const apply = (k: keyof PromotionState, v: any) => setForm((s) => ({ ...s, [k]: v as any }));
      const applySeo = (k: keyof SeoState, v: any) => setSeo((s) => ({ ...s, [k]: v as any }));

      if (data.form) Object.entries(data.form).forEach(([k, v]) => apply(k as any, v));
      if (data.seo) Object.entries(data.seo).forEach(([k, v]) => applySeo(k as any, v));
      if (data.seo?.structuredData) {
        updateSeo(
          "structuredData",
          typeof data.seo.structuredData === "string"
            ? data.seo.structuredData
            : JSON.stringify(data.seo.structuredData, null, 2)
        );
      }
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setLoadingAI(false);
    }
  };

  const tinymceApiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "";

  // ---------- UI ----------
  return (
    <div className="relative">
      <OverlaySpinner open={loadingAI} message="AI is generating content…" />

      <form
        className={`grid gap-6 ${loadingAI ? "pointer-events-none select-none opacity-60" : ""}`}
        aria-busy={loadingAI}
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        {/* BASIC */}
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Percent className="h-5 w-5 text-zpell" /> Basic
            </h3>

            <Button
              type="button"
              variant="zspell"
              leftIcon={<Sparkles className="h-4 w-4" />} 
              onClick={onAIGenerate}
              loading={loadingAI}
              title="AI Content Generation"
            >
              {loadingAI ? "Generating…" : "AI Generation"}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="grid gap-1">
              <span className="text-sm">Name (TH)</span>
              <input className="inp" value={form.nameTh} onChange={(e) => update("nameTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Name (EN)</span>
              <input className="inp" value={form.nameEn} onChange={(e) => update("nameEn", e.target.value)} />
            </label>

            <div className="sm:col-span-2">
              <span className="text-sm">Description (TH)</span>
              <div className="rounded-xl border">
                <TinyMCEClient
                  apiKey={tinymceApiKey}
                  value={form.descriptionTh || ""}
                  init={{
                    height: 240,
                    menubar: false,
                    plugins: "link lists image code",
                    toolbar: "undo redo | bold italic underline | bullist numlist | link | removeformat",
                    branding: false,
                    content_style:
                      "body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px }",
                  }}
                  onEditorChange={(content) => update("descriptionTh", content)}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <span className="text-sm">Description (EN)</span>
              <div className="rounded-xl border">
                <TinyMCEClient
                  apiKey={tinymceApiKey}
                  value={form.descriptionEn || ""}
                  init={{
                    height: 240,
                    menubar: false,
                    plugins: "link lists image code",
                    toolbar: "undo redo | bold italic underline | bullist numlist | link | removeformat",
                    branding: false,
                    content_style:
                      "body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; font-size:14px }",
                  }}
                  onEditorChange={(content) => update("descriptionEn", content)}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:col-span-2">
              <label className="grid gap-1">
                <span className="text-sm">Start</span>
                <input type="datetime-local" className="inp" value={form.startDate || ""} onChange={(e) => update("startDate", e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">End</span>
                <input type="datetime-local" className="inp" value={form.endDate || ""} onChange={(e) => update("endDate", e.target.value)} />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:col-span-2">
              <label className="grid gap-1">
                <span className="text-sm">Daily Start (HH:mm:ss)</span>
                <input className="inp" value={form.dailyStartTime || ""} onChange={(e) => update("dailyStartTime", e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Daily End (HH:mm:ss)</span>
                <input className="inp" value={form.dailyEndTime || ""} onChange={(e) => update("dailyEndTime", e.target.value)} />
              </label>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 sm:col-span-2">
              <label className="grid gap-1">
                <span className="text-sm">Venue ID</span>
                <input className="inp" value={form.venueId || ""} onChange={(e) => update("venueId", e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Category</span>
                <input className="inp" value={form.category || ""} onChange={(e) => update("category", e.target.value)} />
              </label>
              <label className="grid gap-1">
                <span className="text-sm">Website</span>
                <input className="inp" value={form.websiteLink || ""} onChange={(e) => update("websiteLink", e.target.value)} />
              </label>
            </div>

            <label className="inline-flex items-center gap-2 mt-1 sm:col-span-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
              <span className="text-sm">Featured</span>
            </label>
          </div>
        </section>

        {/* MEDIA */}
        <section className="card p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-zpell" /> Media
          </h3>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <MediaPickerCard label="Cover Image" value={form.coverImageUrl || null} onChange={(u) => update("coverImageUrl", u)} />
            <MediaPickerCard label="Image" value={form.logoUrl || null} onChange={(u) => update("logoUrl", u)} />
            <MediaPickerCard label="SEO og:image" value={seo.ogImageUrl || null} onChange={(u) => updateSeo("ogImageUrl", u)} />
          </div>
        </section>

        {/* SEO */}
        <section className="card p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Code2 className="h-5 w-5 text-zpell" /> SEO Meta
          </h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <label className="grid gap-1">
              <span className="text-sm">Meta Title (TH)</span>
              <input className="inp" value={seo.metaTitleTh || ""} onChange={(e) => updateSeo("metaTitleTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Title (EN)</span>
              <input className="inp" value={seo.metaTitleEn || ""} onChange={(e) => updateSeo("metaTitleEn", e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Meta Description (TH)</span>
              <textarea className="inp" rows={3} value={seo.metaDescriptionTh || ""} onChange={(e) => updateSeo("metaDescriptionTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Description (EN)</span>
              <textarea className="inp" rows={3} value={seo.metaDescriptionEn || ""} onChange={(e) => updateSeo("metaDescriptionEn", e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Meta Keywords (TH, comma)</span>
              <input className="inp" value={seo.metaKeywordsTh || ""} onChange={(e) => updateSeo("metaKeywordsTh", e.target.value)} />
            </label>
            <label className="grid gap-1">
              <span className="text-sm">Meta Keywords (EN, comma)</span>
              <input className="inp" value={seo.metaKeywordsEn || ""} onChange={(e) => updateSeo("metaKeywordsEn", e.target.value)} />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Canonical URL</span>
              <input className="inp" value={seo.canonicalUrl || ""} onChange={(e) => updateSeo("canonicalUrl", e.target.value)} placeholder="https://your-domain.com/promotions/..." />
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
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code2 className="h-5 w-5 text-zpell" /> Structured Data (JSON-LD)
            </h3>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Recommended: <b className="ml-1">Offer</b>
              </span>
              <Button variant="outlineZspell" onClick={onRegenerateJsonLd}>
                Regenerate
              </Button>
              <Button variant="outlineZspell" 
                onClick={onPreviewDraft} 
                leftIcon={<Eye className="h-4 w-4" />}>
                OG Preview (Draft)
              </Button>
            </div>
          </div>

          <ButtonGroup className="mt-3">
            {JSONLD_TABS.map((t) => {
              const Icon = t.icon;
              const active = activeJsonLdType === t.id;
              return (
                <Button
                  key={t.id}
                  type="button"
                  variant={active ? "zspell" : "outlineZspell"}
                  leftIcon={<Icon className="h-4 w-4" />}
                  onClick={() => {
                    setActiveJsonLdType(t.id as JsonLdType);
                    const obj = genJsonLd(t.id as JsonLdType, form, seo);
                    updateSeo("structuredData", JSON.stringify(obj, null, 2));
                  }}
                >
                  {t.label}
                </Button>
              );
            })}
          </ButtonGroup>

          <div className="mt-3">
            <textarea
              className="inp font-mono text-[12.5px] leading-5"
              rows={14}
              value={typeof seo.structuredData === "string" ? seo.structuredData : JSON.stringify(seo.structuredData || {}, null, 2)}
              onChange={(e) => updateSeo("structuredData", e.target.value)}
              placeholder='{"@context":"https://schema.org","@type":"Offer", ...}'
            />
          </div>

          {/* Google Search Result Preview */}
          <div className="mt-4">
            <h4 className="text-base font-semibold mb-2">Google Search Result Preview</h4>
            <div className="rounded-xl bg-white px-4 py-3 border">
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
                <div className="text-[16px] text-gray-700">
                  {preview.gDatePrefix ? <strong>{preview.gDatePrefix} — </strong> : null}
                  {preview.desc}
                </div>
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
            <p className="mt-2 text-xs text-gray-500">* แสดงผลตาม JSON-LD ปัจจุบันแบบเรียลไทม์</p>
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
