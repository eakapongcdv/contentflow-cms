// app/page.tsx
import SearchPageClient from "@/app/components/search-page-client";
import { prisma } from "../../../lib/prisma";
import { headers } from "next/headers";

/* utils */
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default async function Home({ searchParams }: { searchParams: Record<string, any> }) {
  const q = (searchParams.q ?? "").trim();
  const sort = ((searchParams.sort ?? "relevance") as string).toLowerCase() as
    | "relevance"
    | "nearby"
    | "popular";
  const langParam = (searchParams.lang ?? "TH").toUpperCase();
  const lang: "TH" | "EN" = langParam === "EN" ? "EN" : "TH";

  const userLat = parseFloat(searchParams.lat ?? "");
  const userLng = parseFloat(searchParams.lng ?? "");
  const hasCoord = Number.isFinite(userLat) && Number.isFinite(userLng);

  const per = clamp(Number(searchParams.per) || 36, 12, 96);
  const page = clamp(Number(searchParams.page) || 1, 1, 9999);
  const tokens: string[] = q ? q.split(/\s+/).filter(Boolean) : [];

  // Log เบา ๆ
  if (q && q.length <= 64) {
    const ip =
      headers().get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers().get("x-real-ip") ||
      undefined;
    prisma.searchLog.create({ data: { term: q, ip } }).catch(() => {});
  }

  // Trending 30 วัน
  const sinceTrending = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trendingPromise = prisma.searchLog.groupBy({
    by: ["term"],
    where: { createdAt: { gte: sinceTrending } },
    _count: { _all: true },
    orderBy: [{ _count: { id: "desc" } }],
    take: 8,
  });

  // ===== Occupants =====
  const occupantsRaw = await prisma.occupant.findMany({
    where: q
      ? {
          OR: [
            { nameTh: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
            { descriptionTh: { contains: q, mode: "insensitive" } },
            { descriptionEn: { contains: q, mode: "insensitive" } },
            { venueId: { contains: q, mode: "insensitive" } },
            ...(tokens.length ? [{ keywords: { hasSome: tokens } } as any] : []),
          ],
        }
      : undefined,
    select: {
      id: true,
      externalId: true,
      nameTh: true,
      nameEn: true,
      descriptionTh: true,
      descriptionEn: true,
      category: true,
      venueId: true,
      roomNo: true,
      hours: true,
      websiteLink: true,
      unitId: true,
      kioskId: true,
      unitIds: true,
      logoUrl: true,
      coverImageUrl: true,
      featuredImageUrl: true,
      latitude: true,
      longitude: true,
      isFeatured: true,
      renderPriority: true,
    },
    take: q ? 1000 : 0,
  });

  // Popularity 90 วัน (เฉพาะ occupants)
  const sinceClicks = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const clickAgg = await prisma.clickLog.groupBy({
    by: ["itemId"],
    where: { itemType: "occupant", createdAt: { gte: sinceClicks } },
    _count: { _all: true },
  });
  const clickCount = new Map<string, number>(clickAgg.map((c) => [c.itemId, c._count._all]));

  // Sort server-side
  let occupants = [...occupantsRaw] as (typeof occupantsRaw & { _distKm?: number })[];

  if (sort === "nearby" && hasCoord) {
    occupants = occupants
      .filter((o) => o.latitude != null && o.longitude != null)
      .map((o) => ({
        ...o,
        _distKm: haversineKm({ lat: userLat, lng: userLng }, { lat: o.latitude!, lng: o.longitude! }),
      }))
      .sort((a, b) => (a._distKm! - b._distKm!));
  } else if (sort === "popular") {
    occupants.sort((a, b) => {
      const ca = clickCount.get(a.id) || 0;
      const cb = clickCount.get(b.id) || 0;
      if (ca !== cb) return cb - ca;
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.renderPriority !== b.renderPriority) return a.renderPriority - b.renderPriority;
      const aName = lang === "TH" ? a.nameTh : a.nameEn ?? a.nameTh;
      const bName = lang === "TH" ? b.nameTh : b.nameEn ?? b.nameTh;
      return (aName || "").localeCompare(bName || "", lang === "TH" ? "th" : "en");
    });
  } else {
    occupants.sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      if (a.renderPriority !== b.renderPriority) return a.renderPriority - b.renderPriority;
      const aName = lang === "TH" ? a.nameTh : a.nameEn ?? a.nameTh;
      const bName = lang === "TH" ? b.nameTh : b.nameEn ?? b.nameTh;
      return (aName || "").localeCompare(bName || "", lang === "TH" ? "th" : "en");
    });
  }

  // Pagination
  const total = occupants.length;
  const pageCount = Math.max(1, Math.ceil(total / per));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * per;
  const end = start + per;
  const pageItems = occupants.slice(start, end);

  // ===== Other sections =====
  const [categories, events, brands, trending] = await Promise.all([
    prisma.category.findMany({
      where: q ? { title: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { sort: "asc" },
      take: q ? 6 : 0,
    }),

    // Events: ใช้ schema ใหม่ + where ตามภาษา
    prisma.event.findMany({
      where:
        q.length === 0
          ? undefined
          : lang === "EN"
          ? {
              OR: [
                { nameEn: { contains: q, mode: "insensitive" } },
                { descriptionEn: { contains: q, mode: "insensitive" } },
              ],
            }
          : {
              OR: [
                { nameTh: { contains: q, mode: "insensitive" } },
                { descriptionTh: { contains: q, mode: "insensitive" } },
              ],
            },
      orderBy: [{ isFeatured: "desc" }, { startDate: "desc" }],
      take: q ? 6 : 0,
      select: {
        id: true,
        externalId: true,
        venueId: true,
        localCategoryIds: true,

        nameEn: true,
        nameTh: true,
        descriptionEn: true,
        descriptionTh: true,

        startDate: true,
        endDate: true,
        dailyStartTime: true,
        dailyEndTime: true,

        isFeatured: true,
        websiteLink: true,

        coverImageUrl: true,
        coverImageW: true,
        coverImageH: true,
        coverThumbUrl: true,
        coverSmallUrl: true,

        logoUrl: true,
        galleryJson: true,

        locale: true,
        order: true,
        reference: true,
        style: true,

        createdAtRaw: true,
        updatedAtRaw: true,
        publishedAt: true,
      },
    }),

    prisma.brand.findMany({
      where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { sort: "asc" },
      take: q ? 12 : 0,
    }),

    trendingPromise,
  ]);

  return (
    <SearchPageClient
      q={q}
      sort={sort}
      per={per}
      page={safePage}
      userLat={hasCoord ? userLat : null}
      userLng={hasCoord ? userLng : null}
      hasCoord={hasCoord}
      tokens={tokens}
      pageItems={pageItems}
      total={total}
      start={start}
      end={Math.min(end, total)}
      pageCount={pageCount}
      categories={categories}
      events={events}
      brands={brands}
      trending={trending}
    />
  );
}
