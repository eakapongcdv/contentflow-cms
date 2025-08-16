// app/admin/click-logs/page.tsx
import { prisma } from "@/app/lib/prisma";
import { PaginationFooter } from "@/app/components/ui/pagination";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    term?: string;
    itemType?: string;
    ip?: string;
    page?: string;
    take?: string; // page size
  };
};

export default async function ClickLogsPage({ searchParams }: PageProps) {
  const term = (searchParams?.term ?? "").toString().trim();
  const itemType = (searchParams?.itemType ?? "").toString().trim();
  const ipQ = (searchParams?.ip ?? "").toString().trim();

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const take = Math.min(100, Math.max(10, Number(searchParams?.take ?? 20) || 20));
  const skip = (page - 1) * take;

  const where: any = {};
  if (term) where.term = { contains: term, mode: "insensitive" };
  if (itemType) where.itemType = { equals: itemType, mode: "insensitive" };
  if (ipQ) where.ip = { contains: ipQ, mode: "insensitive" };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [rows, totalItems, uniqueItemTypes, uniqueItems, last24h] = await Promise.all([
    prisma.clickLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.clickLog.count({ where }),
    prisma.clickLog.groupBy({ by: ["itemType"], _count: { itemType: true } }),
    prisma.clickLog.groupBy({ by: ["itemType", "itemId"] }),
    prisma.clickLog.count({
      where: { ...where, createdAt: { gte: since24h } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / take));
  const uniqItemTypeCount = uniqueItemTypes.length;
  const uniqItemCount = uniqueItems.length;

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (term) params.set("term", term);
    if (itemType) params.set("itemType", itemType);
    if (ipQ) params.set("ip", ipQ);
    params.set("page", String(p));
    params.set("take", String(take));
    return `/admin/click-logs?${params.toString()}`;
  };

  return (
    <main className="">
      <div className="mx-auto max-w-screen-2xl">
        {/* Header */}
        <div className="p-4 mb-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Click Logs</h1>
          <p className="text-sm text-white/60">บันทึกการคลิกในระบบ พร้อมตัวกรองและสรุปสถิติ</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Total clicks</div>
            <div className="text-2xl font-semibold text-white mt-1">{totalItems.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Unique item types</div>
            <div className="text-2xl font-semibold text-white mt-1">{uniqItemTypeCount.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Unique items</div>
            <div className="text-2xl font-semibold text-white mt-1">{uniqItemCount.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Last 24h</div>
            <div className="text-2xl font-semibold text-white mt-1">{last24h.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <form className="admin-card p-4 mb-4 grid gap-3 md:grid-cols-4" method="GET" action="/admin/click-logs">
          <div className="grid gap-1">
            <label htmlFor="term" className="text-xs text-white/60">Term</label>
            <input
              id="term"
              name="term"
              defaultValue={term}
              placeholder="เช่น 'รองเท้า'"
              className="admin-input"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="itemType" className="text-xs text-white/60">Item type</label>
            <input
              id="itemType"
              name="itemType"
              defaultValue={itemType}
              placeholder="เช่น 'occupant', 'event'"
              className="admin-input"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="ip" className="text-xs text-white/60">IP</label>
            <input
              id="ip"
              name="ip"
              defaultValue={ipQ}
              placeholder="เช่น 203.0.113.25"
              className="admin-input"
              autoComplete="off"
            />
          </div>
          <div className="grid content-end md:justify-end">
            <div className="flex gap-2">
              <button className="admin-btn">Search</button>
              <a href="/admin/click-logs" className="admin-btn bg-white/10 hover:bg-white/15">Clear</a>
            </div>
          </div>
          {/* reset paging on submit & ส่ง take ปัจจุบันไปด้วย */}
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="take" value={take} />
        </form>

        {/* Table */}
        <div className="admin-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-white/70 border-b border-white/10">
                  <th className="text-left px-4 py-2 font-medium">When</th>
                  <th className="text-left px-4 py-2 font-medium">Item type</th>
                  <th className="text-left px-4 py-2 font-medium">Item ID</th>
                  <th className="text-left px-4 py-2 font-medium">Term</th>
                  <th className="text-left px-4 py-2 font-medium">IP</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">User-Agent</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Referer</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                      ไม่มีข้อมูลที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 whitespace-nowrap text-white/80">
                        {format(r.createdAt, "dd/MMM/yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-2 text-white/90">{r.itemType}</td>
                      <td className="px-4 py-2 font-mono text-white/80">{r.itemId}</td>
                      <td className="px-4 py-2 text-white break-words whitespace-normal">{r.term ?? "-"}</td>
                      <td className="px-4 py-2 font-mono text-white/80 break-words whitespace-normal">{r.ip ?? "-"}</td>
                      <td className="px-4 py-2 hidden md:table-cell text-white/70 max-w-[320px] break-words whitespace-normal">{r.userAgent ?? "-"}</td>
                      <td className="px-4 py-2 hidden md:table-cell text-white/70 max-w-[280px] break-words whitespace-normal">{r.referer ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="border-t border-white/10 px-3 py-2">
            <PaginationFooter
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              take={take}
              makeHref={makeHref}
              // หมายเหตุ: PageSizeSelect ด้านในรองรับ q/slug/status/categoryId เท่านั้น
              // ถ้าต้องการ preserve term/itemType/ip ตอนเปลี่ยน page size
              // ควรขยาย PageSizeSelect ให้รองรับพร็อพเพิ่ม
              pageSizeParams={{ q: term }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}