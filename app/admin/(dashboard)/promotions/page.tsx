// app/admin/(dashboard)/promotions/page.tsx
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { Button, IconButton } from "@/app/components/ui/button";
import {
  Plus,
  RefreshCw,
  Search as SearchIcon,
  PencilLine,
} from "lucide-react";
import { Thumb } from "@/app/components/ui/thumb";
import { PaginationFooter } from "@/app/components/ui/pagination";

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
    <div className="grid gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Promotions</h1>
         <Link href={`/admin/promotions/new${qstr({ tab: activeTab.id })}`} title="New article">
            <IconButton variant="zspell" aria-label="New">
              <Plus className="h-4 w-4" />
            </IconButton>
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
        <div className="flex justify-end">
          <Button type="submit" variant="outlineZspell" leftIcon={<SearchIcon className="h-4 w-4" />}>
            Search
          </Button>
        </div>
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
                  <div className="flex justify-end">
                    <Link href={`/admin/promotions/${i.id}${qstr({ tab: activeTab.id, q, page, per })}`} title="Edit article" className="inline-flex">
                      <IconButton variant="outlineZspell" aria-label="Edit">
                        <PencilLine className="h-4 w-4" />
                      </IconButton>
                    </Link>
                  </div>
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

      {/* footer: results + pagination + page size */}
      <PaginationFooter
        page={page}
        totalPages={pageCount}
        totalItems={total}
        take={per}
        makeHref={(p) => `/admin/promotions${qstr({ tab: activeTab.id, q, per, page: p })}`}
      />
    </div>
  );
}
