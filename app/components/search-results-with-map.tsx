"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Highlight } from "@/app/components/highlight";
import { StoreIcon, KioskIcon, TagIcon, PinIcon } from "@/app/components/icons";

type Lang = "TH" | "EN";

type OccupantItem = {
  id: string;
  externalId: string | null;

  nameEn: string;
  nameTh: string;
  descriptionEn: string | null;
  descriptionTh: string | null;

  shortName?: string | null;
  category: string | null;
  phone?: string | null;

  venueId: string | null;
  anchorId?: string | null;
  unitId: string | null;
  kioskId: string | null;

  unitIds: string[] | null;
  kioskIds?: string[] | null;

  promotionIds?: string[] | null;
  privilegeIds?: string[] | null;
  localCategoryIds?: string[] | null;
  groupIds?: string[] | null;
  keywords?: string[] | null;

  renderPriority?: number;
  renderType?: string | null;
  canReserve?: boolean;
  isFeatured?: boolean;
  isLandmark?: boolean;
  websiteLink: string | null;

  roomNo: string | null;
  style?: string | null;
  hours: string | null;

  startDate?: string | null;
  endDate?: string | null;
  isMaintenance?: boolean;
  maintenanceStartDate?: string | null;
  maintenanceEndDate?: string | null;

  logoUrl: string | null;
  coverImageUrl: string | null;
  featuredImageUrl: string | null;

  latitude?: number | null;
  longitude?: number | null;

  _distKm?: number; // ใส่มาเมื่อ sort=nearby
};

const VENUE_LOGO: Record<string, { src: string; alt: string }> = {
  "venue-1": {
    src: "https://futurepark-s3.venue.in.th/zpell_logo_test_297e53c8c1_7641566c88_c88cddb972.png",
    alt: "ZPELL",
  },
  "venue-2": {
    src: "https://futurepark-s3.venue.in.th/future_logo_test_c1c1cf40a8_5835a5bd7c_ebd59985f6.png",
    alt: "Future Park",
  },
};

function trackClick(itemId: string, term: string) {
  try {
    const url = "/api/track-click";
    const data = JSON.stringify({ itemType: "occupant", itemId, term });
    if ("sendBeacon" in navigator) {
      const blob = new Blob([data], { type: "application/json" });
      (navigator as any).sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export default function SearchResultsWithMap({
  items,
  tokens,
  q,
  sort,
  hasCoord,
  lang, // ✅ เลือกภาษาได้ผ่าน prop (TH/EN) ถ้าไม่ส่งมา จะอ่านจาก ?lang= ใน URL
}: {
  items: OccupantItem[];
  tokens: string[];
  q: string;
  sort: "relevance" | "nearby" | "popular";
  hasCoord: boolean;
  lang?: Lang;
}) {
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(null);

  // ✅ รองรับเลือกภาษาจาก query string ?lang=TH|EN (case-insensitive)
  const searchParams = useSearchParams();
  const langFromQuery = (searchParams.get("lang") || "").toUpperCase();
  const activeLang: Lang = (lang || (langFromQuery === "TH" ? "TH" : langFromQuery === "EN" ? "EN" : "TH")) as Lang;
  const isTH = activeLang === "TH";

  // ตัวช่วยเลือกค่าตามภาษา + fallback
  const pickLang = <T extends string | null | undefined>(th: T, en: T): T =>
    (isTH ? (th || en) : (en || th)) as T;

  // แปล label UI ตามภาษา
  const t = useMemo(
    () =>
      isTH
        ? {
            unit: "ยูนิต",
            kiosk: "คีออสก์",
            room: "ห้อง",
            website: "เว็บ",
            hours: "เวลา",
            distanceUnit: "กม.",
            selectPrompt: "เลือกร้านค้าด้านบนเพื่อเปิดแผนที่",
          }
        : {
            unit: "Unit",
            kiosk: "Kiosk",
            room: "Room",
            website: "Website",
            hours: "Hours",
            distanceUnit: "km",
            selectPrompt: "Select a store above to open the map",
          },
    [isTH]
  );

  const mapSrc = useMemo(() => {
    if (!selectedExternalId) return null;
    const safeId = encodeURIComponent(selectedExternalId);
    return `https://futurepark-app.venue.in.th/maps/place/${safeId}`;
  }, [selectedExternalId]);

  const onSelect = (o: OccupantItem) => {
    trackClick(o.id, q);
    setSelectedExternalId(o.externalId ?? o.id);
    // ถ้าต้องการเลื่อนอัตโนมัติไปแผนที่ ให้ uncomment:
    // document.getElementById("search-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="lg:flex lg:items-start lg:gap-6">
      {/* ซ้าย: รายการ 50% — 1 item = 1 row */}
      <div className="min-w-0 flex-1 lg:basis-1/2 space-y-4">
        {items.map((o) => {
          const img = o.logoUrl || o.coverImageUrl || o.featuredImageUrl || "";
          const isStore = (o.unitIds?.length ?? 0) > 0 || !!o.unitId;
          const isKiosk = !!o.kioskId;
          const venueLogo = o.venueId ? VENUE_LOGO[o.venueId] : undefined;
          const unitId = o.unitId || (o.unitIds?.[0] ?? null);
          const kioskId = o.kioskId || null;

          const displayName = pickLang(o.nameTh, o.nameEn) || "";
          const displayDesc = pickLang(o.descriptionTh, o.descriptionEn) || "";

          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o)}
              className="w-full text-left group card p-4 hover:shadow-lg transition-shadow flex items-start gap-3"
            >
              {/* รูปซ้าย */}
              <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt={displayName} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">No Image</span>
                )}
              </div>

              {/* เนื้อหา */}
              <div className="min-w-0 flex-1">
                <div className="font-medium leading-tight">
                  <Highlight text={displayName} tokens={tokens} />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {o.category && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      <TagIcon className="h-3 w-3" />
                      {o.category}
                    </span>
                  )}

                  {unitId ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      <PinIcon className="h-3 w-3" />
                      {t.unit} {unitId}
                    </span>
                  ) : kioskId ? (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">
                      <PinIcon className="h-3 w-3" />
                      {t.kiosk} {kioskId}
                    </span>
                  ) : null}

                  {o.roomNo && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {t.room} {o.roomNo}
                    </span>
                  )}

                  {isStore && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                      <StoreIcon className="h-3 w-3" /> Store
                    </span>
                  )}
                  {isKiosk && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      <KioskIcon className="h-3 w-3" /> Kiosk
                    </span>
                  )}

                  {sort === "nearby" && hasCoord && (o as any)._distKm != null && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-700">
                      ~{Math.round((o as any)._distKm * 10) / 10} {t.distanceUnit}
                    </span>
                  )}
                </div>

                {displayDesc && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    <Highlight text={displayDesc} tokens={tokens} />
                  </p>
                )}

                <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                  {o.hours && <span>{t.hours} {o.hours}</span>}
                  {o.websiteLink && (
                    <span className="truncate">
                      {t.website}: {o.websiteLink.replace(/^https?:\/\//, "")}
                    </span>
                  )}
                </div>
              </div>

              {/* โลโก้ห้าง — ไม่มี border และ padding 5px */}
              {venueLogo && (
                <div className="ml-auto hidden sm:flex h-14 w-14 shrink-0 rounded-md bg-white/60 overflow-hidden items-center justify-center p-[5px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venueLogo.src}
                    alt={venueLogo.alt}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ขวา: Map 50% */}
      <div
        id="search-map"
        className="mt-6 lg:mt-0 lg:basis-1/2 lg:shrink-0 lg:sticky lg:top-4"
      >
        {mapSrc ? (
          <iframe
            key={mapSrc}
            src={mapSrc}
            className="w-full h-[min(80vh,800px)] border-0 rounded-lg shadow-sm"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Map"
          />
        ) : (
          <div className="w-full h-[40vh] grid place-items-center bg-gray-50 text-gray-500 rounded-lg">
            {t.selectPrompt}
          </div>
        )}
      </div>
    </div>
  );
}
