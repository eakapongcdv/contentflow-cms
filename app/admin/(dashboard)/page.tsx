// app/admin/(dashboard)/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { prisma } from "@/app/lib/prisma";
import { format } from "date-fns";
import { Suspense } from "react";
import { TimeSeries, TemplatePie, ContentStacked } from "./_charts"; // ✅ ใช้ named exports เท่านั้น
import Link from "next/link";

function k(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

async function getData() {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalWebsites,
    activeWebsites,
    totalArticles,
    publishedArticles,
    draftArticles,
    scheduledArticles,
    totalPromotions,
    totalEvents,
    activeEvents,
    totalOccupants,
    totalBrands,
    totalCategories,
    totalFeatures,
    totalHeroSlides,
    search7d,
    click7d,
  ] = await Promise.all([
    prisma.website.count(),
    prisma.website.count({ where: { isActive: true } }),
    prisma.article.count(),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "SCHEDULED" } }),
    prisma.promotion.count(),
    prisma.event.count(),
    prisma.event.count({ where: { startDate: { lte: now }, endDate: { gte: now } } }),
    prisma.occupant.count(),
    prisma.brand.count(),
    prisma.category.count(),
    prisma.feature.count(),
    prisma.heroSlide.count(),
    prisma.searchLog.count({ where: { createdAt: { gte: d7 } } }),
    prisma.clickLog.count({ where: { createdAt: { gte: d7 } } }),
  ]);

  const searches14 = (await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "SearchLog"
    WHERE "createdAt" >= ${d14}
    GROUP BY 1 ORDER BY 1
  `).map(r => ({ day: (r.day as Date).toISOString(), count: Number(r.count) }));

  const clicks14 = (await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
    FROM "ClickLog"
    WHERE "createdAt" >= ${d14}
    GROUP BY 1 ORDER BY 1
  `).map(r => ({ day: (r.day as Date).toISOString(), count: Number(r.count) }));

  const articles30 = (await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', COALESCE("publishedAt","updatedAt","createdAt")) AS day, COUNT(*)::int AS count
    FROM "Article"
    WHERE ( "publishedAt" IS NOT NULL OR "status"='PUBLISHED' )
      AND COALESCE("publishedAt","updatedAt","createdAt") >= ${d30}
    GROUP BY 1 ORDER BY 1
  `).map(r => ({ day: (r.day as Date).toISOString(), count: Number(r.count) }));

  const promotions30 = (await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', COALESCE("publishedAt","updatedAt","createdAt")) AS day, COUNT(*)::int AS count
    FROM "Promotion"
    WHERE COALESCE("publishedAt","updatedAt","createdAt") >= ${d30}
    GROUP BY 1 ORDER BY 1
  `).map(r => ({ day: (r.day as Date).toISOString(), count: Number(r.count) }));

  const events30 = (await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', COALESCE("publishedAt","updatedAt","createdAt")) AS day, COUNT(*)::int AS count
    FROM "Event"
    WHERE COALESCE("publishedAt","updatedAt","createdAt") >= ${d30}
    GROUP BY 1 ORDER BY 1
  `).map(r => ({ day: (r.day as Date).toISOString(), count: Number(r.count) }));

  const templates = await prisma.$queryRaw<any[]>`
    SELECT "template"::text AS template, COUNT(*)::int AS count
    FROM "Website"
    GROUP BY 1 ORDER BY 2 DESC
  `;

  const upcomingEvents = await prisma.event.findMany({
    where: { startDate: { gte: now } },
    orderBy: { startDate: "asc" },
    take: 5,
    select: { id: true, nameEn: true, nameTh: true, startDate: true, endDate: true },
  });
  const upcomingPromotions = await prisma.promotion.findMany({
    where: { startDate: { gte: now } },
    orderBy: { startDate: "asc" },
    take: 5,
    select: { id: true, nameEn: true, nameTh: true, startDate: true, endDate: true },
  });

  return {
    kpis: {
      totalWebsites, activeWebsites,
      totalArticles, publishedArticles, draftArticles, scheduledArticles,
      totalPromotions, totalEvents, activeEvents,
      totalOccupants, totalBrands, totalCategories, totalFeatures, totalHeroSlides,
      search7d, click7d,
    },
    series: { searches14, clicks14, articles30, promotions30, events30, templates },
    lists: { upcomingEvents, upcomingPromotions },
    now,
  };
}

// ✅ default export ต้องเป็น React Component
export default async function AdminDashboardPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const data = await getData();

  // Pagination state (per list)
  const evPage = Number((Array.isArray(searchParams?.evPage) ? searchParams?.evPage[0] : searchParams?.evPage) ?? 1);
  const prPage = Number((Array.isArray(searchParams?.prPage) ? searchParams?.prPage[0] : searchParams?.prPage) ?? 1);
  const PAGE_SIZE = 5;

  // Fetch paginated lists
  const now = new Date();
  const [evTotal, prTotal] = await Promise.all([
    prisma.event.count({ where: { startDate: { gte: now } } }),
    prisma.promotion.count({ where: { startDate: { gte: now } } }),
  ]);

  const [evItems, prItems] = await Promise.all([
    prisma.event.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      skip: (Math.max(evPage,1) - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, nameEn: true, nameTh: true, startDate: true, endDate: true },
    }),
    prisma.promotion.findMany({
      where: { startDate: { gte: now } },
      orderBy: { startDate: "asc" },
      skip: (Math.max(prPage,1) - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, nameEn: true, nameTh: true, startDate: true, endDate: true },
    }),
  ]);

  const evPages = Math.max(1, Math.ceil(evTotal / PAGE_SIZE));
  const prPages = Math.max(1, Math.ceil(prTotal / PAGE_SIZE));

  function qp(next: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams(typeof searchParams === "object" && searchParams ? (Object.entries(searchParams).reduce((acc, [k, v]) => {
      acc[k] = Array.isArray(v) ? v[0] : (v ?? "");
      return acc;
    }, {} as Record<string, string>)) : {});
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") sp.delete(k);
      else sp.set(k, String(v));
    });
    const q = sp.toString();
    return q ? `?${q}` : "";
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-white/60">Updated {format(data.now, "yyyy-MM-dd HH:mm")}</p>
      </div>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Websites" value={data.kpis.totalWebsites} sub={`${data.kpis.activeWebsites} active`} />
        <Kpi title="Articles" value={data.kpis.totalArticles} sub={`${data.kpis.publishedArticles} published • ${data.kpis.draftArticles} draft`} />
        <Kpi title="Promotions" value={data.kpis.totalPromotions} />
        <Kpi title="Events" value={data.kpis.totalEvents} sub={`${data.kpis.activeEvents} live now`} />
        <Kpi title="Occupants" value={data.kpis.totalOccupants} />
        <Kpi title="Brands" value={data.kpis.totalBrands} />
        <Kpi title="Categories" value={data.kpis.totalCategories} />
        <Kpi title="Hero/Features" value={data.kpis.totalHeroSlides + data.kpis.totalFeatures} sub={`${data.kpis.totalHeroSlides} hero • ${data.kpis.totalFeatures} features`} />
        <Kpi title="Searches (7d)" value={data.kpis.search7d} />
        <Kpi title="Clicks (7d)" value={data.kpis.click7d} />
      </section>

      <section className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 admin-card p-4">
          <h2 className="text-base font-medium mb-3">Search vs Click (last 14 days)</h2>
          <Suspense fallback={<div className="h-48 animate-pulse rounded bg-white/10" />}>
            <TimeSeries
              seriesA={{ name: "Searches", data: data.series.searches14 }}
              seriesB={{ name: "Clicks", data: data.series.clicks14 }}
            />
          </Suspense>
        </div>
        <div className="lg:col-span-2 admin-card p-4">
          <h2 className="text-base font-medium mb-3">Websites by Template</h2>
          <Suspense fallback={<div className="h-48 animate-pulse rounded bg-white/10" />}>
            <TemplatePie data={data.series.templates} />
          </Suspense>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="admin-card p-4">
          <h2 className="text-base font-medium mb-3">Content Published (last 30 days)</h2>
          <Suspense fallback={<div className="h-48 animate-pulse rounded bg-white/10" />}>
            <ContentStacked
              articles={data.series.articles30}
              promotions={data.series.promotions30}
              events={data.series.events30}
            />
          </Suspense>
        </div>

        <div className="admin-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <ListCard title="Upcoming Events" items={evItems.map(e => ({
            id: e.id, title: e.nameTh || e.nameEn,
            meta: `${format(e.startDate, "yyyy-MM-dd")} → ${format(e.endDate, "yyyy-MM-dd")}`,
          }))} />
          <div className="flex items-center justify-end gap-2 mt-2">
            <Link href={qp({ evPage: 1 })} aria-label="First page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M20 19l-7-7 7-7"/></svg>
            </Link>
            <Link href={qp({ evPage: Math.max(1, evPage - 1) })} aria-label="Previous page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <span className="text-xs text-white/60 select-none">{evPage} / {evPages}</span>
            <Link href={qp({ evPage: Math.min(evPages, evPage + 1) })} aria-label="Next page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            </Link>
            <Link href={qp({ evPage: evPages })} aria-label="Last page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5l7 7-7 7"/><path d="M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <ListCard title="Upcoming Promotions" items={prItems.map(p => ({
            id: p.id, title: p.nameTh || p.nameEn,
            meta: `${format(p.startDate, "yyyy-MM-dd")} → ${format(p.endDate, "yyyy-MM-dd")}`,
          }))} />
          <div className="flex items-center justify-end gap-2 mt-2">
            <Link href={qp({ prPage: 1 })} aria-label="First page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M20 19l-7-7 7-7"/></svg>
            </Link>
            <Link href={qp({ prPage: Math.max(1, prPage - 1) })} aria-label="Previous page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <span className="text-xs text-white/60 select-none">{prPage} / {prPages}</span>
            <Link href={qp({ prPage: Math.min(prPages, prPage + 1) })} aria-label="Next page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l6 6-6 6"/></svg>
            </Link>
            <Link href={qp({ prPage: prPages })} aria-label="Last page" className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5l7 7-7 7"/><path d="M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({ title, value, sub }: { title: string; value: number; sub?: string }) {
  return (
    <div className="admin-card p-4">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{k(value)}</div>
      {sub ? <div className="text-xs text-white/50 mt-1">{sub}</div> : null}
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: Array<{ id: string; title: string | null; meta?: string }> }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">{title}</h3>
      <div className="rounded-md border border-white/10 divide-y divide-white/10">
        {items.length === 0 && <div className="p-3 text-sm text-white/60">No items</div>}
        {items.map(it => (
          <div key={it.id} className="p-3">
            <div className="text-sm">{it.title || "(untitled)"}</div>
            {it.meta ? <div className="text-xs text-white/50">{it.meta}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}