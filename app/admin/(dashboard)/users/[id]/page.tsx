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
          <h1 className="text-xl font-semibold text-white">User not found</h1>
          <Link href="/admin/users">
            <Button variant="outlineZspell" leftIcon={<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}>Back</Button>
          </Link>
        </div>
        <div className="text-sm text-red-400">User id: {params.id}</div>
      </div>
    );
  }

  const roleRules = await loadRoleAcl(user.role, websiteId);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Edit User</h1>
        <Link href="/admin/users">
          <Button variant="outlineZspell" leftIcon={<svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}>Back</Button>
        </Link>
      </div>

      {/* Form */}
      <div className="admin-card p-4">
        <UserForm mode="edit" user={user} />
      </div>

      {/* Role ACL (view-only) */}
      <section className="admin-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">
            Role Permissions (view-only) — <span className="font-normal">role</span>:{" "}
            <code className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">{user.role}</code>
          </h2>
          <div className="text-xs text-white/60">
            {websiteId ? (
              <>Website scope: <code className="px-1 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-200">{websiteId}</code></>
            ) : (
              <>No website selected — showing role ACL across all websites</>
            )}
          </div>
        </div>

        {(() => {
          if (roleRules.length === 0) {
            return (
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                No ACL rules found for this role{websiteId ? " on the current website." : "."}
              </div>
            );
          }

          type Action = "ALL" | "VIEW_MENU" | "VIEW_SUBMENU" | "VIEW_PAGE" | "CREATE" | "READ" | "UPDATE" | "DELETE" | "PUBLISH";
          type Effect = "ALLOW" | "DENY";

          const ACTIONS: Action[] = [
            "VIEW_MENU",
            "VIEW_PAGE",
            "CREATE",
            "READ",
            "UPDATE",
            "DELETE",
            "PUBLISH",
          ];

          // Normalize a resource to a human label (group by menu when possible)
          function labelOf(resource: string) {
            // Examples: "menu:content:articles", "menu:events-promotions", "res:promotions", "api:/admin/promotions"
            if (resource.startsWith("menu:")) {
              const key = resource.slice(5);
              return key.replace(/[:/]/g, " › ");
            }
            if (resource.startsWith("api:/admin/")) {
              const tail = resource.replace(/^api:\/admin\//, "");
              return tail.split("/")[0].replace(/-/g, " ");
            }
            if (resource.startsWith("res:")) {
              return resource.slice(4).replace(/-/g, " ");
            }
            if (resource === "*") return "All";
            return resource.replace(/[-_:]/g, " ");
          }

          // Build a grouped map: label -> action -> effect (DENY overrides ALLOW)
          const byLabel = new Map<string, Record<Action, Effect | undefined>>();
          for (const r of roleRules) {
            const label = labelOf(r.resource);
            const cur = byLabel.get(label) || ({} as Record<Action, Effect | undefined>);
            const act = r.action as Action;
            // If it's ALL, record for all actions
            if (act === "ALL") {
              ACTIONS.forEach((a) => {
                const prev = cur[a];
                cur[a] = prev === "DENY" ? "DENY" : r.effect; // once DENY, keep DENY
              });
            } else {
              const prev = cur[act];
              cur[act] = prev === "DENY" ? "DENY" : r.effect;
            }
            byLabel.set(label, cur);
          }

          // Sort labels alphabetically for stable UI
          const rows = Array.from(byLabel.entries()).sort((a, b) => a[0].localeCompare(b[0]));

          const Cell = ({ val }: { val: Effect | undefined }) => (
            <td className="px-2 py-1 text-center align-middle">
              {val === "ALLOW" ? (
                <span className="inline-flex items-center justify-center rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-200 w-6 h-6" aria-label="Allowed">✓</span>
              ) : val === "DENY" ? (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-200 w-6 h-6" aria-label="Denied">✕</span>
              ) : (
                <span className="inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 w-6 h-6" aria-hidden>-</span>
              )}
            </td>
          );

          return (
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
              <table className="min-w-full text-sm text-white/90">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Menu / Resource</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="px-2 py-2 text-center font-medium">{a.replace("_", " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, rec]) => (
                    <tr key={label} className="border-t border-white/10 hover:bg-white/5">
                      <td className="px-3 py-2 font-medium text-white/90">{label}</td>
                      {ACTIONS.map((a) => (
                        <Cell key={a} val={rec[a]} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
          <div className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-400/50" /> Allow</div>
          <div className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-red-400/50" /> Deny</div>
          <div className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-white/30" /> Not set</div>
        </div>

        <p className="mt-2 text-xs text-white/60">
          * DENY overrides ALLOW when both are present for the same action. Table aggregates rules from role only.
        </p>
      </section>
    </div>
  );
}
