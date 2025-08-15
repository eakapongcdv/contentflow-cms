// app/admin/(dashboard)/users/[id]/page.tsx
import { headers, cookies } from "next/headers";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { Button } from "@/app/components/ui/button";
import UserForm from "../ui/UserForm";

function abs(path: string) {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${path}`;
}

// Load a single user via the secured API (keeps RBAC consistent)
async function loadUser(id: string) {
  const res = await fetch(abs(`/api/admin/users/${id}`), {
    cache: "no-store",
    headers: { cookie: cookies().toString() },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Failed to load user: HTTP ${res.status}\n${detail}`);
  }
  return res.json() as Promise<{
    id: string;
    name: string | null;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: string;
    groups: { id: string; name: string; websiteId: string | null }[];
  }>;
}

// Load ACL rules coming from ROLE (view-only table)
async function loadRoleAcl(role: "USER" | "ADMIN", websiteId: string | null) {
  // If a website is selected, show role ACL scoped to that website.
  // Otherwise, show all role ACLs across websites (useful for ADMIN).
  const where: any = {
    subjectType: "ROLE",
    subjectId: role,
    ...(websiteId ? { websiteId } : {}),
  };
  const rules = await prisma.accessControl.findMany({
    where,
    select: {
      id: true,
      websiteId: true,
      resource: true,
      action: true,
      effect: true, // "ALLOW" | "DENY"
    },
    orderBy: [{ websiteId: "asc" }, { resource: "asc" }, { action: "asc" }],
  });
  return rules as Array<{
    id: string;
    websiteId: string | null;
    resource: string;
    action: string;
    effect: "ALLOW" | "DENY";
  }>;
}

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await loadUser(params.id);
  const websiteId = cookies().get("websiteId")?.value || null;

  if (!user) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">User not found</h1>
          <Link href="/admin/users">
            <Button variant="outlineZspell">Back</Button>
          </Link>
        </div>
        <div className="text-sm text-red-600">User id: {params.id}</div>
      </div>
    );
  }

  const roleRules = await loadRoleAcl(user.role, websiteId);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit User</h1>
        <Link href="/admin/users">
          <Button variant="outlineZspell">Back</Button>
        </Link>
      </div>

      {/* Form */}
      <div className="card p-4">
        <UserForm mode="edit" user={user} />
      </div>

      {/* Role ACL (view-only) */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">
            Role Permissions (view-only) — <span className="font-normal">role</span>:{" "}
            <code className="px-1.5 py-0.5 rounded bg-gray-100 border text-gray-700">{user.role}</code>
          </h2>
          <div className="text-xs text-gray-500">
            {websiteId ? (
              <>Website scope: <code className="px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">{websiteId}</code></>
            ) : (
              <>No website selected — showing role ACL across all websites</>
            )}
          </div>
        </div>

        {roleRules.length === 0 ? (
          <div className="rounded-md border bg-gray-50 p-3 text-sm text-gray-600">
            No ACL rules found for this role{websiteId ? " on the current website." : "."}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {!websiteId && <th className="px-3 py-2 text-left font-medium">Website</th>}
                  <th className="px-3 py-2 text-left font-medium">Resource</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                  <th className="px-3 py-2 text-left font-medium">Effect</th>
                </tr>
              </thead>
              <tbody>
                {roleRules.map((r) => (
                  <tr key={r.id} className="border-t">
                    {!websiteId && (
                      <td className="px-3 py-2">
                        <code className="text-xs bg-gray-100 rounded px-1 py-0.5 border">
                          {r.websiteId ?? "—"}
                        </code>
                      </td>
                    )}
                    <td className="px-3 py-2">{r.resource}</td>
                    <td className="px-3 py-2">{r.action}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          r.effect === "ALLOW"
                            ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                            : "inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700"
                        }
                      >
                        {r.effect}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500">
          * This table shows ACL rules granted by the user’s <b>role</b> only. Additional permissions may
          come from <b>group</b> or <b>user-specific</b> rules.
        </p>
      </section>
    </div>
  );
}
