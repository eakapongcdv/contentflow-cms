// app/admin/(dashboard)/occupants/page.tsx  (หรือไฟล์ที่คุณวางโค้ดหน้านี้)
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import Filters from "./Filters";
import { Pencil } from "lucide-react";

const TABS = [
  {
    id: "venue-1",
    label: "Future Park",
    img: "https://futurepark-s3.venue.in.th/future_logo_test_c1c1cf40a8_5835a5bd7c_ebd59985f6.png",
  },
  {
    id: "venue-2",
    label: "Zpell",
    img: "https://futurepark-s3.venue.in.th/zpell_logo_test_297e53c8c1_7641566c88_c88cddb972.png",
  },
] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default async function OccupantsListPage({
  searchParams,
}: {
  searchParams?: { venue?: string; page?: string; per?: string; q?: string; cat?: string };
}) {
  const activeVenue = TABS.find((t) => t.id === searchParams?.venue)?.id ?? "venue-1";

  // ---- filters ----
  const q = (searchParams?.q || "").trim();
  const selectedCat = (searchParams?.cat || "").trim();
  const per = clamp(Number(searchParams?.per ?? 20) || 50, 10, 200);
  const pageInput = Number(searchParams?.page ?? 1) || 1;

  // ดึงรายการหมวดหมู่ (distinct) ของ venue ปัจจุบัน สำหรับ dropdown
  const catRows = await prisma.occupant.findMany({
    where: { venueId: activeVenue },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  const categories = catRows.map((r) => r.category).filter(Boolean) as string[];

  const where: any = { venueId: activeVenue };
  if (selectedCat) where.category = selectedCat;
  if (q) {
    where.OR = [
      { nameTh: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { unitId: { contains: q, mode: "insensitive" } },
      { kioskId: { contains: q, mode: "insensitive" } },
    ];
  }

  // ---- total + page calc ----
  const total = await prisma.occupant.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / per));
  const page = clamp(pageInput, 1, pageCount);
  const start = (page - 1) * per;
  const end = Math.min(start + per, total);

  const items = await prisma.occupant.findMany({
    where,
    // เดิม: isFeatured -> renderPriority -> nameTh
    orderBy: [{ isFeatured: "desc" }, { renderPriority: "asc" }, { nameTh: "asc" }],
    select: {
      id: true,
      externalId: true,
      nameTh: true,
      nameEn: true,
      category: true,
      venueId: true,
      unitId: true,
      kioskId: true,
      isFeatured: true,
      isMaintenance: true,
      renderPriority: true,
      logoUrl: true,
      featuredImageUrl: true,
      coverImageUrl: true,
    },
    skip: start,
    take: per,
  });

  const tab = TABS.find((t) => t.id === activeVenue)!;

  const tabLinkClass = (id: string) =>
    [
      "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors",
      id === activeVenue
        ? "bg-zpell text-white border-zpell"
        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
    ].join(" ");

  const buildQuery = (params: {
    page?: number | string;
    per?: number | string;
    q?: string | undefined;
    venue?: string | undefined;
    cat?: string | undefined;
  }) => {
    const u = new URLSearchParams();
    u.set("venue", (params.venue ?? activeVenue) as string);
    u.set("page", String(params.page ?? page));
    u.set("per", String(params.per ?? per));
    if (typeof params.q === "string") {
      if (params.q) u.set("q", params.q);
    } else if (q) {
      u.set("q", q);
    }
    if (typeof params.cat === "string") {
      if (params.cat) u.set("cat", params.cat);
    } else if (selectedCat) {
      u.set("cat", selectedCat);
    }
    return `/admin/occupants?` + u.toString();
  };

  const buildVenueLink = (venueId: string) =>
    `/admin/occupants?` +
    new URLSearchParams({
      venue: venueId,
      page: "1",
      per: String(per),
      ...(q ? { q } : {}),
      ...(selectedCat ? { cat: selectedCat } : {}),
    }).toString();

  const pageNumbers = (() => {
    const maxButtons = 7;
    if (pageCount <= maxButtons) return Array.from({ length: pageCount }, (_, i) => i + 1);
    const set = new Set<number>([1, page, pageCount]);
    for (const d of [1, 2]) {
      if (page - d >= 1) set.add(page - d);
      if (page + d <= pageCount) set.add(page + d);
    }
    const arr = Array.from(set).sort((a, b) => a - b);
    while (arr.length < maxButtons) {
      const L = arr[0] - 1;
      const R = arr[arr.length - 1] + 1;
      if (L >= 1) arr.unshift(L);
      if (arr.length >= maxButtons) break;
      if (R <= pageCount) arr.push(R);
      if (L < 1 && R > pageCount) break;
    }
    return arr;
  })();

  const Pager = () => (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-gray-600">
        แสดง {total ? `${start + 1}–${end} / ${total}` : "0 / 0"} รายการ
      </div>

      <div className="flex items-center gap-1">
        <Link
          href={buildQuery({ page: Math.max(1, page - 1) })}
          className={`px-3 py-1 rounded-md border ${
            page === 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
          }`}
        >
          ← Prev
        </Link>

        {pageNumbers.map((n, idx) => {
          const prev = idx > 0 ? pageNumbers[idx - 1] : undefined;
          const needDots = prev && n - prev > 1;
          return (
            <span key={n} className="flex">
              {needDots && <span className="px-2">…</span>}
              <Link
                href={buildQuery({ page: n })}
                className={
                  n === page
                    ? "px-3 py-1 rounded-md border border-zpell bg-zpell text-white"
                    : "px-3 py-1 rounded-md border hover:bg-gray-50"
                }
              >
                {n}
              </Link>
            </span>
          );
        })}

        <Link
          href={buildQuery({ page: Math.min(pageCount, page + 1) })}
          className={`px-3 py-1 rounded-md border ${
            page === pageCount ? "pointer-events-none opacity-50" : "hover:bg-gray-50"
          }`}
        >
          Next →
        </Link>
      </div>
    </div>
  );

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Stores & Tenants :: Store Directory</h1>
        <Link
          href={buildQuery({}).replace("/occupants?", "/occupants/new?")}
          className="btn btn-zpell"
        >
          + Sync Venue
        </Link>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.id} href={buildVenueLink(t.id)} className={tabLinkClass(t.id)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.img} alt={t.label} className="h-5 w-auto object-contain" />
            <span>{t.label}</span>
          </Link>
        ))}
      </div>

      {/* Filters (เพิ่ม Category dropdown ก่อนกล่องค้นหา) */}
      <div className="mt-4 flex flex-col gap-3">
        <Filters
          q={q}
          per={per}
          venue={activeVenue}
          categories={categories}      // ✅ ส่งรายการ category ให้ dropdown
          category={selectedCat}       // ✅ ค่า category ที่เลือกอยู่
        />
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">External ID</th> {/* ✅ เพิ่มคอลัมน์ External ID */}
              <th className="p-2">Category</th>
              <th className="p-2">Type</th>
              <th className="p-2">Unit / Kiosk</th> {/* ✅ แทน Priority */}
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const img = i.logoUrl || i.featuredImageUrl || i.coverImageUrl || "";
              const isKiosk = !!i.kioskId;
              const isShop = !!i.unitId && !isKiosk;
              const unitOrKiosk = isKiosk
                ? i.kioskId
                : isShop
                ? i.unitId
                : null;

              return (
                <tr key={i.id} className="border-t align-top">
                  <td className="p-2">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-md bg-gray-100 overflow-hidden grid place-items-center">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={i.nameTh} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-gray-400">No Image</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium leading-tight">{i.nameTh}</div>
                        <div className="text-xs text-gray-500">{i.nameEn}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {i.isFeatured && <span className="chip chip-emerald">Featured</span>}
                          {i.category && <span className="chip chip-gray">{i.category}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-2">{i.externalId ?? "-"}</td> {/* ✅ External ID */}

                  <td className="p-2">{i.category ?? "-"}</td>

                  <td className="p-2">
                    {isKiosk ? (
                      <span className="chip chip-sky">Kiosk</span>
                    ) : isShop ? (
                      <span className="chip chip-sky">Shop</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="p-2">
                    {unitOrKiosk ? (
                      <span className="chip chip-gray">{unitOrKiosk}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="p-2">
                    {i.isMaintenance ? (
                      <span className="chip chip-gray">Maintenance</span>
                    ) : (
                      <span className="text-gray-500">Normal</span>
                    )}
                  </td>

                  <td className="p-2">
                    <Link
                      className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100"
                      href={buildQuery({}).replace("/occupants?", `/occupants/${i.id}?`)}
                      title="Edit"
                      aria-label={`Edit ${i.nameTh || i.nameEn}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  ไม่มีรายการใน {tab.label}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom pager */}
      <Pager />
    </div>
  );
}
