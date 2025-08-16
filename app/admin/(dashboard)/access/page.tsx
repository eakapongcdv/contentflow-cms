// app/admin/(dashboard)/access/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { Button } from "@/app/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

// ทำให้เพจนี้เป็น Server Component ที่มี default export เป็นฟังก์ชันปกติ
// แล้วแยก async ออกไปที่คอมโพเนนต์ลูก (ACLTable)
export const dynamic = "force-dynamic";

type Role = "USER" | "ADMIN";
type Action =
  | "ALL"
  | "VIEW_MENU"
  | "VIEW_SUBMENU"
  | "VIEW_PAGE"
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH";
type Effect = "ALLOW" | "DENY";

const ACTIONS: Exclude<Action, "ALL">[] = [
  "VIEW_MENU",
  "VIEW_PAGE",
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "PUBLISH",
];

// แปลง resource ให้เป็น label ที่อ่านง่ายตามเมนู
function labelOf(resource: string) {
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

// -------- Client-less parent (default export must be a React Component) --------
export default function AccessPage() {
  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Access Control</h1>
      </div>

      {/* เนื้อหาโหลดผ่านคอมโพเนนต์ลูกที่เป็น async server component */}
      <ACLTable />
    </div>
  );
}

// -------- Async Server Component (โหลดข้อมูล + เรนเดอร์ตาราง) --------
async function ACLTable() {
  // ดึง role จาก session ของ next-auth เป็นหลัก (เชื่อถือได้กว่า cookie)
  const session = await getServerSession(authOptions);

  let myRole: Role = "USER";
  const sRole = (session?.user as any)?.role as Role | undefined;
  if (sRole === "ADMIN" || sRole === "USER") {
    myRole = sRole;
  } else {
    // fallback: โหลดจากฐานข้อมูลตาม session.user.id (กันกรณี token ไม่มี role)
    const uid = (session?.user as any)?.id as string | undefined;
    if (uid) {
      const u = await prisma.user.findUnique({ where: { id: uid }, select: { role: true } });
      if (u?.role === "ADMIN") myRole = "ADMIN";
    }
  }

  // scope เว็บไซต์จาก cookie เช่นกัน
  const websiteId = cookies().get("websiteId")?.value || null;

  const where: any = {
    subjectType: "ROLE",
    subjectId: myRole,
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

  // รวมเป็น label -> action -> effect (DENY ชนะ)
  const byLabel = new Map<string, Record<Exclude<Action, "ALL">, Effect | undefined>>();
  for (const r of rules) {
    const label = labelOf(r.resource);
    const cur =
      byLabel.get(label) ||
      ({
        VIEW_MENU: undefined,
        VIEW_PAGE: undefined,
        CREATE: undefined,
        READ: undefined,
        UPDATE: undefined,
        DELETE: undefined,
        PUBLISH: undefined,
      } as Record<Exclude<Action, "ALL">, Effect | undefined>);

    const act = r.action as Action;

    if (act === "ALL") {
      for (const a of ACTIONS) {
        cur[a] = cur[a] === "DENY" ? "DENY" : r.effect;
      }
    } else if (ACTIONS.includes(act as any)) {
      const a = act as Exclude<Action, "ALL">;
      cur[a] = cur[a] === "DENY" ? "DENY" : r.effect;
    }
    byLabel.set(label, cur);
  }

  const rows = Array.from(byLabel.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const Cell = ({ val }: { val: Effect | undefined }) => (
    <td className="px-2 py-1 text-center align-middle">
      {val === "ALLOW" ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-200 w-6 h-6"
          aria-label="Allowed"
          title="Allow"
        >
          ✓
        </span>
      ) : val === "DENY" ? (
        <span
          className="inline-flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30 text-red-200 w-6 h-6"
          aria-label="Denied"
          title="Deny"
        >
          ✕
        </span>
      ) : (
        <span
          className="inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/40 w-6 h-6"
          aria-hidden
          title="Not set"
        >
          -
        </span>
      )}
    </td>
  );

  return (
    <>
      {/* Info strip */}
      <div className="admin-card p-4 flex flex-wrap items-center gap-3 text-sm">
        <div className="text-white/80">
          Viewing role:{" "}
          <code className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white/80">{myRole}</code>
        </div>
        <div className="text-white/60">
          {websiteId ? (
            <>
              Website scope:{" "}
              <code className="px-1 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-200">
                {websiteId}
              </code>
            </>
          ) : (
            <>No website selected — showing role ACL across all websites</>
          )}
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="admin-card p-4 text-sm text-white/70">
          No ACL rules found for this role{websiteId ? " on the current website." : "."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5">
          <table className="min-w-full text-sm text-white/90">
            <thead className="bg-white/5 text-white/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Menu / Resource</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="px-2 py-2 text-center font-medium">
                    {a.replace("_", " ")}
                  </th>
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
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 text-xs text-white/60">
        <div className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-400/50" /> Allow
        </div>
        <div className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400/50" /> Deny
        </div>
        <div className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-white/30" /> Not set
        </div>
      </div>

      <p className="text-xs text-white/60">
        * DENY overrides ALLOW when both are present for the same action. This table aggregates rules from the user’s{" "}
        <b>role</b> only.
      </p>
    </>
  );
}