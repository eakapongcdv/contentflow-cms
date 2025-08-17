// app/admin/(dashboard)/articles/page.tsx
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { Button, IconButton } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import {
  Plus,
  RefreshCw,
  Search as SearchIcon,
  PencilLine,
} from "lucide-react";
import { Thumb } from "@/app/components/ui/thumb";
import { PaginationFooter } from "@/app/components/ui/pagination";

/* ---------- helpers ---------- */
function abs(path: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}
function fmt(dt?: string | null) {
  if (!dt) return "—";
  const d = new Date(dt);
  if (isNaN(+d)) return "—";
  return d.toLocaleString();
}

const safeAlt = (s?: string) => (s && s.trim() ? s : "article image");

/* ---------- data loaders ---------- */
async function loadArticles(searchParams: {
  q?: string;
  slug?: string;
  status?: string;
  categoryId?: string;
  page?: string;
  take?: string;
}) {
  const sp = new URLSearchParams();
  if (searchParams.q) sp.set("q", searchParams.q);
  if (searchParams.slug) sp.set("slug", searchParams.slug);
  if (searchParams.status) sp.set("status", searchParams.status);
  if (searchParams.categoryId) sp.set("categoryId", searchParams.categoryId);
  if (searchParams.page) sp.set("page", searchParams.page);
  if (searchParams.take) sp.set("take", searchParams.take);

  const res = await fetch(abs(`/api/admin/articles${sp.toString() ? `?${sp}` : ""}`), {
    cache: "no-store",
    headers: { cookie: cookies().toString() },
  });

  if (!res.ok) {
    let detail = "";
    try { detail = await res.text(); } catch {}
    return { error: `HTTP ${res.status}`, detail };
  }

  const json = await res.json();
  return {
    data: json as {
      items: Array<{
        id: string;
        title?: string;
        slug?: string;
        status: string;
        authorName: string | null;
        readingTime: number | null;
        publishedAt: string | null;
        createdAt: string;
        coverImageUrl?: string | null; // ⬅️ ใช้รูป
      }>;
      total: number;
      page: number;
      take: number;
    },
  };
}

async function loadCategories() {
  try {
    const res = await fetch(abs("/api/admin/categories?take=1000"), {
      cache: "no-store",
      headers: { cookie: cookies().toString() },
    });
    if (!res.ok) return [];
    const j = await res.json();
    const items = Array.isArray(j?.items) ? j.items : j;
    return items.map((c: any) => ({ id: c.id, name: c.title || c.name || "—" }));
  } catch {
    return [];
  }
}

/* ---------- page ---------- */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const slug = typeof searchParams.slug === "string" ? searchParams.slug : "";
  const status = typeof searchParams.status === "string" ? searchParams.status : "";
  const categoryId = typeof searchParams.categoryId === "string" ? searchParams.categoryId : "";
  const page = Math.max(1, Number(searchParams.page || 1));
  const take = Math.min(100, Math.max(1, Number(searchParams.take || 10)));

  const [result, categories] = await Promise.all([
    loadArticles({ q, slug, status, categoryId, page: String(page), take: String(take) }),
    loadCategories(),
  ]);

  const baseQS = { q, slug, status, categoryId, take: String(take) };
  const makeHref = (p: number) =>
    `/admin/articles?${new URLSearchParams({ ...baseQS, page: String(p) } as any).toString()}`;

  if ("error" in result) {
    const qs = new URLSearchParams({ ...baseQS, page: String(page) } as any).toString();
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Articles</h1>
          <ButtonGroup>
            <Link href="/admin/articles/new" title="New article">
              <IconButton variant="dark-outline"  aria-label="New">
                <Plus className="h-4 w-4" />
              </IconButton>
            </Link>
            <Link href={`/admin/articles?${qs}`} title="Refresh">
              <IconButton variant="dark-outline"  aria-label="Refresh">
                <RefreshCw className="h-4 w-4" />
              </IconButton>
            </Link>
          </ButtonGroup>
        </div>

        <div className="admin-card p-4 border border-red-500/30 bg-red-500/10 text-red-300">
          <div className="text-sm font-semibold text-red-700">
            Failed to load articles: {result.error}
          </div>
          {result.detail ? (
            <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap">{result.detail}</pre>
          ) : null}
          <ul className="mt-2 text-xs text-red-700 list-disc pl-5">
            <li>ตรวจสอบการเข้าสู่ระบบ (session/cookie) และสิทธิ์การเข้าถึง</li>
            <li>เลือกเว็บไซต์ในแถบซ้าย (กำหนดคุกกี้ <code>websiteId</code>)</li>
            <li>RBAC ต้องอนุญาตสิทธิ์ <code>READ</code> บน <code>res:articles</code> หรือรัน ADMIN ACL seed</li>
          </ul>
        </div>
      </div>
    );
  }

  const data = result.data!;
  const totalPages = Math.max(1, Math.ceil(data.total / data.take));

  return (
    <div className="grid gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Articles</h1>
        <ButtonGroup>
          <Link href="/admin/articles/new" title="New article">
            <IconButton variant="dark-outline"  aria-label="New">
              <Plus className="h-4 w-4" />
            </IconButton>
          </Link>
        </ButtonGroup>
      </div>

      {/* advanced search */}
      <form action="/admin/articles" className="admin-card p-3 grid gap-3">
        <div className="grid md:grid-cols-4 gap-2">
          <label className="grid gap-1">
            <span className="text-xs text-white/60">Search (title / keyword)</span>
            <input name="q" defaultValue={q} placeholder="e.g. grand opening" className="admin-input" />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-white/60">Slug</span>
            <input name="slug" defaultValue={slug} placeholder="slug contains…" className="admin-input" />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-white/60">Status</span>
            <select name="status" defaultValue={status} className="admin-input">
              <option value="">All</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-white/60">Category</span>
            <select name="categoryId" defaultValue={categoryId} className="admin-input">
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* keep current page size when searching */}
        <input type="hidden" name="take" value={String(data.take)} />

        <div className="flex justify-end">
          <Button type="submit" variant="dark-outline"  leftIcon={<SearchIcon className="h-4 w-4" />}>
            Search
          </Button>
        </div>
      </form>

      {/* table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="admin-table min-w-full text-sm text-white/90">
          <thead className="bg-white/10 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-[68px]">Image</th>{/* ⬅️ รูป */}
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Slug</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 text-left font-medium">Author</th>
              <th className="px-3 py-2 text-left font-medium">Reading</th>
              <th className="px-3 py-2 text-left font-medium">Published</th>
              <th className="px-3 py-2 text-left font-medium">Created</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-white/60">
                  No articles
                </td>
              </tr>
            ) : (
              data.items.map((a) => (
                <tr key={a.id} className="border-t border-white/10 hover:bg-white/5">
                  {/* thumb */}
                  <td className="px-3 py-2">
                    <Thumb
                      src={a.coverImageUrl || undefined}
                      alt={safeAlt(a.title)}
                      className="h-12 w-12"      // ปรับขนาดได้
                      // fallback={<YourIcon />} // ถ้าอยากใส่ไอคอนแทนข้อความ
                    />
                  </td>

                  <td className="px-3 py-2">{a.title || "—"}</td>
                  <td className="px-3 py-2 text-white/60">{a.slug || "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`chip ${
                        a.status === "PUBLISHED"
                          ? "chip-emerald"
                          : a.status === "SCHEDULED"
                          ? "chip-sky"
                          : "chip-gray"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{a.authorName || "—"}</td>
                  <td className="px-3 py-2">{a.readingTime ? `${a.readingTime} min` : "—"}</td>
                  <td className="px-3 py-2">{fmt(a.publishedAt)}</td>
                  <td className="px-3 py-2">{fmt(a.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Link href={`/admin/articles/${a.id}`} title="Edit article" className="inline-flex">
                        <IconButton variant="dark-outline"  aria-label="Edit">
                          <PencilLine className="h-4 w-4" />
                        </IconButton>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* footer: results + pagination + page size */}
      <PaginationFooter
        page={data.page}
        totalPages={totalPages}
        totalItems={data.total}
        take={data.take}
        makeHref={makeHref}
        pageSizeParams={{ q, slug, status, categoryId }}
      />
    </div>
  );
}
