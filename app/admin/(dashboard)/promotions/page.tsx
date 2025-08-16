// app/admin/(dashboard)/promotions/page.tsx
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const TABS = [
  {
    id: "venue-1",
    label: "ห้าง Future",
    img: "https://futurepark-s3.venue.in.th/future_logo_test_c1c1cf40a8_5835a5bd7c_ebd59985f6.png",
  },
  {
    id: "venue-2",
    label: "ห้าง Zpell",
    img: "https://futurepark-s3.venue.in.th/zpell_logo_test_297e53c8c1_7641566c88_c88cddb972.png",
  },
] as const;

function getActiveTab(tabParam?: string) {
  const found = TABS.find((t) => t.id === tabParam);
  return found ?? TABS[0];
}

function qstr(obj: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  return `?${sp.toString()}`;
}

export default async function PromotionsListPage({
  searchParams,
}: {
  searchParams?: { tab?: string; page?: string; q?: string; per?: string };
}) {
  const activeTab = getActiveTab(searchParams?.tab);
  const page = Math.max(1, parseInt(searchParams?.page || "1", 10));
  const per = Math.min(100, Math.max(5, parseInt(searchParams?.per || "20", 10) || 20));
  const q = (searchParams?.q || "").trim();

  const where: any = { venueId: activeTab.id };
  if (q) {
    where.OR = [
      { nameEn: { contains: q, mode: "insensitive" } },
      { nameTh: { contains: q, mode: "insensitive" } },
      { descriptionEn: { contains: q, mode: "insensitive" } },
      { descriptionTh: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.promotion.count({ where }),
    prisma.promotion.findMany({
      where,
      orderBy: [{ startDate: "desc" }],
      skip: (page - 1) * per,
      take: per,
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / per));

  return (
    <div className="admin-content grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Promotions</h1>
        <Link
          href={`/admin/promotions/new${qstr({ tab: activeTab.id })}`}
          className="btn btn-zpell"
        >
          New
        </Link>
      </div>

      {/* Tabs */}
      <div className="admin-card p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.id === activeTab.id;
            return (
              <Link
                key={t.id}
                href={`/admin/promotions${qstr({ tab: t.id, q })}`}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                  active
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-white/10 hover:bg-white/5 text-white/80"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.label} className="h-5 w-auto object-contain" />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name/description/category…"
          className="admin-input"
        />
        <input type="hidden" name="tab" value={activeTab.id} />
        <input type="hidden" name="per" value={per} />
        <button className="btn btn-outline-zpell">Filter</button>
      </form>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <table className="admin-table w-full text-sm text-white/90">
          <thead className="bg-white/10 text-white/70">
            <tr>
              <th className="text-left p-2 w-[56px]">Cover</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Dates</th>
              <th className="text-left p-2">Featured</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-2 align-top">
                  <div className="h-12 w-12 bg-white/10 rounded overflow-hidden border border-white/10">
                    {i.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={i.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </td>
                <td className="p-2 align-top">
                  <div className="font-medium">{i.nameTh || i.nameEn}</div>
                  <div className="text-xs text-white/60">{i.nameEn}</div>
                  {i.category && (
                    <div className="text-[11px] text-white/60 mt-1">#{i.category}</div>
                  )}
                </td>
                <td className="p-2 align-top">
                  <div>{new Date(i.startDate).toLocaleString()}</div>
                  <div className="text-xs text-white/60">
                    {new Date(i.endDate).toLocaleString()}
                  </div>
                </td>
                <td className="p-2 align-top">{i.isFeatured ? "Yes" : "-"}</td>
                <td className="p-2 align-top">
                  <Link
                    className="underline"
                    href={`/admin/promotions/${i.id}${qstr({ tab: activeTab.id, q, page, per })}`}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td className="p-4 text-white/60" colSpan={5}>
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-white/60">
        <div>
          Page {page} / {pageCount} • Total {total}
        </div>
        <div className="flex items-center gap-3">
          {/* Page size form */}
          <form action="/admin/promotions" className="flex items-center gap-2">
            <input type="hidden" name="tab" value={activeTab.id} />
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="page" value={1} />
            <span className="text-xs">Page size</span>
            <select name="per" defaultValue={String(per)} className="admin-input h-9 w-[90px]">
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <button className="inline-grid place-items-center h-9 px-3 rounded-md border border-white/15 bg-white/5 hover:bg-white/10" aria-label="Apply page size">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
          </form>

          {/* Pager buttons */}
          <div className="flex gap-2">
            <Link
              href={`/admin/promotions${qstr({ tab: activeTab.id, q, page: 1, per })}`}
              aria-label="First page"
              className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 19l-7-7 7-7"/>
                <path d="M20 19l-7-7 7-7"/>
              </svg>
            </Link>
            <Link
              href={`/admin/promotions${qstr({ tab: activeTab.id, q, page: Math.max(1, page - 1), per })}`}
              aria-label="Previous page"
              className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </Link>
            <span className="text-xs text-white/60 select-none px-1">{page} / {pageCount}</span>
            <Link
              href={`/admin/promotions${qstr({ tab: activeTab.id, q, page: Math.min(pageCount, page + 1), per })}`}
              aria-label="Next page"
              className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 6l6 6-6 6"/>
              </svg>
            </Link>
            <Link
              href={`/admin/promotions${qstr({ tab: activeTab.id, q, page: pageCount, per })}`}
              aria-label="Last page"
              className="inline-grid place-items-center h-9 w-9 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 5l7 7-7 7"/>
                <path d="M13 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
