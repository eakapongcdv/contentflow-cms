// app/admin/(dashboard)/users/page.tsx
import Link from "next/link";
import { headers, cookies } from "next/headers";
import { Button, IconButton } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { Plus, RefreshCw, Search as SearchIcon, PencilLine } from "lucide-react";
import { PaginationFooter } from "@/app/components/ui/pagination";

function abs(path: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}

async function loadUsers(searchParams: { q?: string; page?: string }) {
  const sp = new URLSearchParams();
  if (searchParams.q) sp.set("q", searchParams.q);
  if (searchParams.page) sp.set("page", searchParams.page);

  const res = await fetch(abs(`/api/admin/users${sp.toString() ? `?${sp}` : ""}`), {
    cache: "no-store",
    headers: { cookie: cookies().toString() },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const txt = await res.text();
      detail = txt || "";
    } catch {}
    return { error: `HTTP ${res.status}`, detail };
  }

  const json = await res.json();
  return {
    data: json as {
      items: Array<{
        id: string;
        name: string | null;
        email: string;
        role: string;
        createdAt: string;
        groups: { id: string; name: string; websiteId: string | null }[];
      }>;
      total: number;
      page: number;
      take: number;
    },
  };
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const page = typeof searchParams.page === "string" ? searchParams.page : "1";

  const result = await loadUsers({ q, page });

  if ("error" in result) {
    const qs = new URLSearchParams({ q, page }).toString();
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Users</h1>
          <ButtonGroup>
            <Link href="/admin/users/invite">
              <IconButton variant="zspell" aria-label="New">
                <Plus className="h-4 w-4" />
              </IconButton>
            </Link>
            <Link href={`/admin/users?${qs}`}>
              <Button variant="outlineZspell" rightIcon={<RefreshCw className="h-4 w-4" />}>
                Refresh
              </Button>
            </Link>
          </ButtonGroup>
        </div>

        <div className="admin-card p-4 border border-red-500/30 bg-red-500/10">
          <div className="text-sm font-semibold text-red-700">
            Failed to load users: {result.error}
          </div>
          {result.detail ? (
            <pre className="mt-2 text-xs text-red-800 whitespace-pre-wrap">
              {result.detail}
            </pre>
          ) : null}
          <ul className="mt-2 text-xs text-red-700 list-disc pl-5">
            <li>Check you’re signed in and have access.</li>
            <li>
              Select a website in the left sidebar (sets the <code>websiteId</code> cookie).
            </li>
            <li>
              Ensure your RBAC allows <code>READ</code> on <code>res:users</code> for this website,
              or run the ADMIN ACL seed.
            </li>
          </ul>
        </div>
      </div>
    );
  }

  const data = result.data!;
  const qs = new URLSearchParams({ q, page }).toString();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Users</h1>
        <ButtonGroup>
          <Link href="/admin/users/invite">
             <IconButton variant="zspell" aria-label="New">
              <Plus className="h-4 w-4" />
            </IconButton>
          </Link>
        </ButtonGroup>
      </div>

      <form action="/admin/users" className="admin-card p-3 grid sm:grid-cols-[1fr_auto] gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name/email…"
          className="admin-input bg-white/5 border-white/15 text-white/90 placeholder-white/40"
          aria-label="Search users"
        />
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="take" value={String(data.take)} />
        <Button type="submit" variant="outlineZspell" leftIcon={<SearchIcon className="h-4 w-4" />}>
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="min-w-full text-sm text-white/90">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Email</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="px-3 py-2 text-left font-medium">Groups (current website)</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-white/60">
                  No users
                </td>
              </tr>
            ) : (
              data.items.map((u) => (
                <tr key={u.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-3 py-2">{u.name || "—"}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">
                    {u.groups.length ? u.groups.map((g) => g.name).join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <Link href={`/admin/users/${u.id}`}>
                        <IconButton variant="outlineZspell" aria-label="Edit">
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

      {/* Pagination */}
      <div className="admin-card p-3">
        <PaginationFooter
          page={data.page}
          totalPages={Math.max(1, Math.ceil(data.total / data.take))}
          totalItems={data.total}
          take={data.take}
          makeHref={(p) => {
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            params.set("page", String(p));
            params.set("take", String(data.take));
            return `/admin/users?${params.toString()}`;
          }}
          pageSizeParams={{ q }}
        />
      </div>
    </div>
  );
}
