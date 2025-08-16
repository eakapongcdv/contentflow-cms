// app/components/search-page-client.tsx
"use client";

import { useSearchParams } from "next/navigation";
import SearchBar from "@/app/components/search-bar";
import { Highlight } from "@/app/components/highlight";
import GeoSortButton from "@/app/components/geo-sort-button";
import Pagination from "@/app/components/pagination";
import SearchResultsWithMap from "@/app/components/search-results-with-map";

type SearchPageClientProps = {
  q: string;
  sort: "relevance" | "nearby" | "popular";
  per: number;
  page: number;
  userLat: number | null;
  userLng: number | null;
  hasCoord: boolean;
  tokens: string[];
  pageItems: any[];
  total: number;
  start: number;
  end: number;
  pageCount: number;
  categories: any[];
  // ✅ events จาก schema ใหม่ (select ใน server แล้ว)
  events: Array<{
    id: string;
    nameEn: string;
    nameTh: string | null;
    descriptionEn: string | null;
    descriptionTh: string | null;
    startDate: string | Date;
    endDate: string | Date;
    dailyStartTime: string | null;
    dailyEndTime: string | null;
    websiteLink: string | null;
    coverImageUrl: string | null;
    coverThumbUrl: string | null;
    coverSmallUrl: string | null;
  }>;
  brands: any[];
  trending: { term: string; _count: { _all: number } }[];
};

export default function SearchPageClient({
  q = "",
  sort,
  per,
  page,
  hasCoord,
  userLat,
  userLng,
  pageItems,
  tokens = [],
  total,
  start,
  end,
  pageCount,
  categories,
  events,
  brands,
  trending,
}: SearchPageClientProps) {
  const sp = useSearchParams();
  const langParam = (sp.get("lang") || "TH").toUpperCase();
  const lang: "TH" | "EN" = langParam === "EN" ? "EN" : "TH";
  const isTH = lang === "TH";

  const t = isTH
    ? {
        title: "ค้นหา ร้านค้า/กิจกรรม/โปรโมชัน",
        hint: 'พิมพ์คำค้นเพื่อเริ่มค้นหา เช่น “ชาบู”, “รองเท้า”, “ซาร่า”, “เกม”, “เด็ก”',
        occupants: "ร้านค้า (Store Directory)",
        showing: "แสดง",
        items: "รายการ",
        categories: "หมวดหมู่",
        events: "อีเวนต์",
        brands: "แบรนด์",
        noResults: (kw: string) => `ไม่พบผลลัพธ์ที่ตรงกับ “${kw}”`,
        relevance: "Relevance",
        popular: "Popular",
        website: "เว็บ",
      }
    : {
        title: "Search Shops/Events/Promotions",
        hint: 'Type to start searching, e.g. "shabu", "shoes", "ZARA", "games", "kids"',
        occupants: "Store Directory",
        showing: "Showing",
        items: "items",
        categories: "Categories",
        events: "Events",
        brands: "Brands",
        noResults: (kw: string) => `No results for “${kw}”`,
        relevance: "Relevance",
        popular: "Popular",
        website: "Website",
      };

  const hasQuery = q.length > 0;
  const hasAny = total + categories.length + events.length + brands.length > 0;

  // helper รวม query string คง lang
  const withLang = (href: string) =>
    href.includes("?") ? `${href}&lang=${lang}` : `${href}?lang=${lang}`;

  return (
    <main className="section">
      {/* Hero + Search */}
      <div className="container-narrow">
        <div className="py-5 sm:py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{t.title}</h1>
          <SearchBar defaultQuery={q} />

          {/* คำค้นยอดฮิต */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {(trending ?? []).map((tItem) => (
              <a
                key={tItem.term}
                href={withLang(`/?q=${encodeURIComponent(tItem.term)}`)}
                className="text-sm px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                {tItem.term}
              </a>
            ))}
          </div>

          {/* สลับการเรียง */}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <a
              href={withLang(`/?q=${encodeURIComponent(q)}&sort=relevance&per=${per}`)}
              className={`px-3 py-1 rounded-full ${
                sort === "relevance" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {t.relevance}
            </a>

            {/* หากอยากคง lang ใน GeoSortButton ด้วย ให้เพิ่ม prop lang แล้วทำในตัว component */}
            <GeoSortButton q={q} active={sort === "nearby"} hasCoord={hasCoord} />

            <a
              href={withLang(`/?q=${encodeURIComponent(q)}&sort=popular&per=${per}`)}
              className={`px-3 py-1 rounded-full ${
                sort === "popular" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {t.popular}
            </a>
          </div>
        </div>
      </div>

      {!hasQuery ? (
        <div className="container-narrow text-center text-gray-500">{t.hint}</div>
      ) : (
        <div className="container-narrow grid gap-10">
          {/* อีเวนต์ (อ้าง schema ใหม่) */}
          {!!events.length && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t.events}</h2>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                {events.map((e) => {
                  const title = isTH ? e.nameTh || e.nameEn : e.nameEn || e.nameTh;
                  const description = isTH ? e.descriptionTh || e.descriptionEn : e.descriptionEn || e.descriptionTh;
                  const cover = e.coverSmallUrl || e.coverThumbUrl || e.coverImageUrl || null;
                  const startDate = new Date(e.startDate);
                  const endDate = new Date(e.endDate);
                  const dateRange = `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
                  const timeRange =
                    e.dailyStartTime && e.dailyEndTime
                      ? `${e.dailyStartTime.slice(0, 5)}–${e.dailyEndTime.slice(0, 5)}`
                      : e.dailyStartTime
                      ? e.dailyStartTime.slice(0, 5)
                      : e.dailyEndTime
                      ? e.dailyEndTime.slice(0, 5)
                      : null;

                  return (
                    <article key={e.id} className="card">
                      <div className="h-32 bg-gray-100">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={title ?? ""} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="p-4">
                        <div className="text-xs text-gray-500">
                          {dateRange}
                          {timeRange ? ` · ${timeRange}` : ""}
                        </div>
                        <div className="font-medium">
                          <Highlight text={title ?? ""} tokens={tokens} />
                        </div>
                        <div className="font-medium">
                          <Highlight text={description ?? ""} tokens={tokens} />
                        </div>
                        {e.websiteLink ? (
                          <div className="text-xs text-gray-500 mt-2 truncate">
                            {t.website}: {e.websiteLink.replace(/^https?:\/\//, "")}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Occupants */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-semibold">{t.occupants}</h2>
              <div className="text-xs text-gray-500">
                {t.showing} {total ? `${start + 1}-${Math.min(end, total)} / ${total}` : "0 / 0"} {t.items}
              </div>
            </div>

            {pageItems.length ? (
              <>
                <SearchResultsWithMap
                  items={pageItems}
                  tokens={tokens}
                  q={q}
                  sort={sort}
                  hasCoord={hasCoord}
                  // ถ้า SearchResultsWithMap รองรับ prop lang ก็ส่งลงไปได้:
                  // lang={lang}
                />

                <Pagination
                  page={page}            // ✅ ใช้ page จาก props
                  pageCount={pageCount}
                  q={q}
                  sort={sort}
                  per={per}
                  lat={hasCoord ? userLat : undefined}
                  lng={hasCoord ? userLng : undefined}
                  // ถ้า Pagination รองรับพก lang ต่อ ให้เพิ่ม prop เช่น extraQuery={`&lang=${lang}`}
                />
              </>
            ) : (
              <p className="text-sm text-gray-500">{t.noResults(q)}</p>
            )}
          </section>

          {/* หมวดหมู่ */}
          {!!categories.length && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t.categories}</h2>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                {categories.map((c: any) => (
                  <div key={c.id} className="card overflow-hidden">
                    <div className="h-24 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.imageUrl} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 font-medium">
                      <Highlight text={c.title} tokens={tokens} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          

          {/* แบรนด์ */}
          {!!brands.length && (
            <section>
              <h2 className="text-lg font-semibold mb-3">{t.brands}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-4 place-items-center bg-white rounded-2xl p-4 shadow-card">
                {brands.map((b: any) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={b.id} src={b.logoUrl} alt={b.name} className="h-8 object-contain" />
                ))}
              </div>
            </section>
          )}

          {/* ไม่พบอะไรเลย */}
          {!hasAny && <div className="text-gray-500">{t.noResults(q)}</div>}
        </div>
      )}
    </main>
  );
}
