"use client";

import { useMemo } from "react";

type Props = { encoded: string };

// helpers (client-only, ไม่ต้องแคร์ SSR)
const stripHtml = (s?: string | null) => (s ? s.replace(/<[^>]+>/g, "").trim() : "");
const clamp = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + "…");
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatDateMDY = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  return `${MONTHS_EN[d.getUTCMonth()]} ${String(d.getUTCDate())}, ${d.getUTCFullYear()}`;
};

function decodeDraftFromBase64Url(b64url: string) {
  if (!b64url) return null;
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const json = typeof window === "undefined"
      ? Buffer.from(b64 + pad, "base64").toString("utf8")
      : decodeURIComponent(escape(window.atob(b64 + pad)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toDisplayUrl(url: string) {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean).slice(0, 3);
    return `${u.host}${segs.length ? " › " + segs.join(" › ") : ""}`;
  } catch { return url; }
}

function pickJsonLd(obj: any): any {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj[0] || null;
  if (obj["@graph"] && Array.isArray(obj["@graph"])) return obj["@graph"][0] || obj;
  return obj;
}

export default function DraftPreviewClient({ encoded }: Props) {
  const draft = useMemo(() => decodeDraftFromBase64Url(encoded), [encoded]);

  if (!encoded) {
    return (
      <div className="card p-6 text-center text-gray-600">
        ไม่มีข้อมูล Draft (query <code>?d=</code> ว่าง) — โปรดกดปุ่ม <b>OG Preview (Draft)</b> จากหน้าแก้ไขโปรโมชัน
      </div>
    );
  }
  if (!draft) {
    return (
      <div className="card p-6 text-center text-red-600">
        Draft payload ไม่ถูกต้อง
      </div>
    );
  }

  const core = draft.core || {};
  const seo = draft.seo || {};

  const title =
    seo.ogTitle || seo.metaTitleTh || seo.metaTitleEn || core.nameTh || core.nameEn || "Promotion (Draft)";
  const desc =
    (seo.ogDescription ||
      seo.metaDescriptionTh ||
      seo.metaDescriptionEn ||
      stripHtml(core.descriptionTh) ||
      stripHtml(core.descriptionEn) ||
      "").slice(0, 300);

  const image = seo.ogImageUrl || core.coverImageUrl || "";
  const url = seo.canonicalUrl || "https://example.com/promotions/draft";

  // JSON-LD
  const structuredRaw = useMemo(() => {
    const raw =
      typeof seo.structuredData === "string"
        ? seo.structuredData
        : JSON.stringify(seo.structuredData ?? {}, null, 2);
    return raw || "";
  }, [seo.structuredData]);

  let node: any = {};
  try {
    const obj = structuredRaw ? JSON.parse(structuredRaw) : {};
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
  const ldAgg = node.aggregateRating as any;
  const ldOffers = node.offers as any;

  // SERP preview data
  const gTitle = clamp(ldName || title || "Promotion", 60);
  const gUrl = url;
  const gDisplayUrl = toDisplayUrl(gUrl);
  const gDesc = clamp(stripHtml(ldDesc) || desc || "", 158);
  const gDatePrefix = /Event|SaleEvent/i.test(ldType) ? formatDateMDY(ldStart || ldEnd) : "";
  const gVenue = ldLocName || "";
  const gRatingValue = ldAgg?.ratingValue ? Number(ldAgg.ratingValue) : null;
  const gReviewCount = ldAgg?.reviewCount ? Number(ldAgg.reviewCount) : null;
  const gPrice = (() => {
    if (!ldOffers) return "";
    const cur = ldOffers.priceCurrency || "";
    if (ldOffers.lowPrice && ldOffers.highPrice) return `${cur} ${ldOffers.lowPrice}–${ldOffers.highPrice}`;
    if (ldOffers.price) return `${cur} ${ldOffers.price}`;
    return "";
  })();

  let favicon = "";
  try {
    const host = new URL(gUrl).host;
    favicon = `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {}

  return (
    <div className="grid gap-6">
      {/* OG Card */}
      <section className="grid md:grid-cols-[1.15fr_.85fr] gap-6">
        <div className="card overflow-hidden shadow-card">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="w-full h-64 object-cover bg-gray-100" />
          ) : (
            <div className="w-full h-64 grid place-items-center bg-gray-100 text-gray-400">no og:image</div>
          )}
          <div className="p-5">
            <div className="text-xs text-gray-500 truncate">{url}</div>
            <h1 className="mt-1 text-xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{desc || "—"}</p>
          </div>
        </div>

        {/* Meta Snapshot */}
        <div className="card p-5 space-y-4">
          <div>
            <div className="text-sm text-gray-500">og:title</div>
            <div className="font-medium">{title || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">og:description</div>
            <div className="text-sm">{desc || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">og:url</div>
            <div className="text-sm break-all">{url}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">og:image</div>
            <div className="text-sm break-all">{image || "—"}</div>
          </div>
        </div>
      </section>

      {/* Google Search Result Preview */}
      <section className="card p-5">
        <h2 className="text-lg font-semibold mb-3">Google Search Result Preview</h2>

        <div className="rounded-xl bg-white px-4 py-3 border">
          {/* Title */}
          <div className="text-[18px] leading-snug">
            <a
              href={gUrl}
              className="hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1a0dab" }}
            >
              {gTitle}
            </a>
          </div>

          {/* Display URL + favicon */}
          <div className="mt-1 flex items-center gap-2 text-[13px]" style={{ color: "#0f9d58" }}>
            {favicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={favicon} alt="" className="h-4 w-4 rounded-sm" />
            ) : null}
            <span>{gDisplayUrl}</span>
          </div>

          {/* Description + thumbnail */}
          <div className="mt-1 grid grid-cols-[1fr_auto] gap-3">
            <div className="text-[16px] text-gray-700">
              {gDatePrefix ? <strong>{gDatePrefix} — </strong> : null}
              {gDesc}
              {(gVenue || gRatingValue != null || gPrice) && (
                <span className="block mt-1 text-gray-600">
                  {gVenue ? `${gVenue}` : ""}
                  {gRatingValue != null ? `${gVenue ? " · " : ""}⭐ ${gRatingValue}${gReviewCount != null ? ` (${gReviewCount})` : ""}` : ""}
                  {gPrice ? `${(gVenue || gRatingValue != null) ? " · " : ""}${gPrice}` : ""}
                </span>
              )}
            </div>

            {image ? (
              <div className="w-[92px] h-[92px] overflow-hidden rounded-md border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="w-full h-full object-cover bg-gray-100" />
              </div>
            ) : (
              <div className="w-[92px] h-[92px]" />
            )}
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          * พรีวิวนี้อ้างอิง JSON-LD ของ Draft (ยังไม่บันทึก DB)
        </p>
      </section>

      {/* Canonical*/}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Canonical (draft): </h2>
          <span className="text-xs text-gray-500">
            <code className="break-all">{url}</code>
          </span>
        </div>
      </section>

    </div>
  );
}
