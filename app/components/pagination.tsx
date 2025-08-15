type Props = {
  page: number;
  pageCount: number;
  q: string;
  sort: string;
  per: number;
  lat?: number;
  lng?: number;
};

function buildHref({ page, q, sort, per, lat, lng }: Props & { page: number }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  if (per) params.set("per", String(per));
  if (lat != null && !Number.isNaN(lat)) params.set("lat", String(lat));
  if (lng != null && !Number.isNaN(lng)) params.set("lng", String(lng));
  params.set("page", String(page));
  return `/?${params.toString()}`;
}

export default function Pagination(props: Props) {
  const { page, pageCount } = props;
  if (pageCount <= 1) return null;

  const window = 1; // แสดงเลขรอบๆ หน้าปัจจุบัน
  const start = Math.max(1, page - window);
  const end = Math.min(pageCount, page + window);
  const pages: number[] = [];

  if (start > 1) pages.push(1);
  if (start > 2) pages.push(-1); // ellipsis
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < pageCount - 1) pages.push(-1);
  if (end < pageCount) pages.push(pageCount);

  return (
    <nav className="mt-4 flex items-center justify-center gap-2 text-sm">
      {/* Prev */}
      <a
        href={page > 1 ? buildHref({ ...props, page: page - 1 }) : "#"}
        className={`px-3 py-1 rounded-full ${page > 1 ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-50 text-gray-400 pointer-events-none"}`}
        aria-disabled={page <= 1}
      >
        ← ก่อนหน้า
      </a>

      {/* numbers */}
      {pages.map((p, i) =>
        p === -1 ? (
          <span key={`e${i}`} className="px-2 text-gray-500">…</span>
        ) : (
          <a
            key={p}
            href={buildHref({ ...props, page: p })}
            className={`px-3 py-1 rounded-full ${p === page ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </a>
        )
      )}

      {/* Next */}
      <a
        href={page < pageCount ? buildHref({ ...props, page: page + 1 }) : "#"}
        className={`px-3 py-1 rounded-full ${page < pageCount ? "bg-gray-100 hover:bg-gray-200" : "bg-gray-50 text-gray-400 pointer-events-none"}`}
        aria-disabled={page >= pageCount}
      >
        ถัดไป →
      </a>
    </nav>
  );
}
