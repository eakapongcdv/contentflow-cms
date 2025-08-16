// app/admin/search-logs/page.tsx
import { prisma } from "@/app/lib/prisma";
import { PaginationFooter } from "@/app/components/ui/pagination";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    q?: string;
    ip?: string;
    page?: string;
    take?: string; // ใช้ชื่อเดียวกับ PaginationFooter/PageSizeSelect
  };
};

export default async function SearchLogsPage({ searchParams }: PageProps) {
  const q = (searchParams?.q ?? "").toString().trim();
  const ipQ = (searchParams?.ip ?? "").toString().trim();

  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const take = Math.min(100, Math.max(10, Number(searchParams?.take ?? 20) || 20));
  const skip = (page - 1) * take;

  const where: any = {};
  if (q) where.term = { contains: q, mode: "insensitive" };
  if (ipQ) where.ip = { contains: ipQ, mode: "insensitive" };

  const [rows, totalItems, uniqueTerms, uniqueIPs, last24h] = await Promise.all([
    prisma.searchLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.searchLog.count({ where }),
    prisma.searchLog.groupBy({ by: ["term"], _count: { term: true } }),
    prisma.searchLog.groupBy({ by: ["ip"], _count: { ip: true } }),
    prisma.searchLog.count({
      where: {
        ...where,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / take));
  const uniqTermCount = uniqueTerms.length;
  const uniqIpCount = uniqueIPs.filter((g) => g.ip).length;

  const makeHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (ipQ) params.set("ip", ipQ);
    params.set("page", String(p));
    params.set("take", String(take));
    return `/admin/search-logs?${params.toString()}`;
  };

  return (
    <main className="">
      <div className="mx-auto max-w-screen-2xl">
        {/* Header */}
        <div className="p-4 mb-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Search Logs</h1>
          <p className="text-sm text-white/60">บันทึกคำค้นหาในระบบ พร้อมตัวกรองและสรุปสถิติ</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Total logs</div>
            <div className="text-2xl font-semibold text-white mt-1">{totalItems.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Unique terms</div>
            <div className="text-2xl font-semibold text-white mt-1">{uniqTermCount.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Unique IPs</div>
            <div className="text-2xl font-semibold text-white mt-1">{uniqIpCount.toLocaleString()}</div>
          </div>
          <div className="admin-card p-4">
            <div className="text-xs text-white/60">Last 24h</div>
            <div className="text-2xl font-semibold text-white mt-1">{last24h.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <form className="admin-card p-4 mb-4 grid gap-3 md:grid-cols-3" method="GET" action="/admin/search-logs">
          <div className="grid gap-1">
            <label htmlFor="q" className="text-xs text-white/60">Keyword</label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="ค้นหาคำค้น เช่น 'รองเท้า'"
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
              <a href="/admin/search-logs" className="admin-btn bg-white/10 hover:bg-white/15">Clear</a>
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
                  <th className="text-left px-4 py-2 font-medium">Term</th>
                  <th className="text-left px-4 py-2 font-medium">IP</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">User-Agent</th>
                  <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Referer</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                      ไม่มีข้อมูลที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 whitespace-nowrap text-white/80">
                        {format(r.createdAt, "dd/MMM/yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-2 text-white">{r.term}</td>
                      <td className="px-4 py-2 font-mono text-white/80">{r.ip ?? "-"}</td>
                      <td className="px-4 py-2 hidden md:table-cell text-white/70 max-w-[320px] truncate">{r.userAgent ?? "-"}</td>
                      <td className="px-4 py-2 hidden md:table-cell text-white/70 max-w-[280px] truncate">{r.referer ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer (ตามสเปกของคุณ) */}
          <div className="border-t border-white/10">
            <div className="px-3 py-2">
              <PaginationFooter
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                take={take}
                makeHref={makeHref}
                pageSizeParams={{
                  q, // NOTE: PageSizeSelect ด้านใน PaginationFooter รองรับเฉพาะ q/slug/status/categoryId
                  // ถ้าต้องการ preserve ip ตอนเปลี่ยน page size ต้องแก้ PageSizeSelect ให้รองรับ ip เพิ่ม
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}