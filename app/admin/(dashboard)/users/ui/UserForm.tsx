// app/admin/(dashboard)/users/ui/UserForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { ButtonGroup } from "@/app/components/ui/button-group";
import { OverlaySpinner } from "@/app/components/ui/overlay-spinner";
import { FormActions } from "@/app/components/ui/form-actions";

type UserLite = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: "USER" | "ADMIN";
  groups?: { id: string; name: string; websiteId: string | null }[];
};

type GroupLite = { id: string; name: string; websiteId: string | null };

export default function UserForm({ mode, user }: { mode: "create" | "edit"; user?: UserLite }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    role: "USER" | "ADMIN";
    password: string;
    groupIds: string[];
  }>(() => ({
    name: user?.name || "",
    email: user?.email || "",
    role: (user?.role as any) || "USER",
    password: "",
    groupIds: user?.groups?.map((g) => g.id) || [],
  }));

  const [groups, setGroups] = useState<GroupLite[]>([]);

  // load groups for current website
  useEffect(() => {
    let done = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/user-groups", { cache: "no-store" });
        const data = await res.json();
        if (!done) setGroups(data?.items || []);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      done = true;
    };
  }, []);

  const onToggleGroup = (gid: string) =>
    setForm((f) => {
      const set = new Set(f.groupIds);
      if (set.has(gid)) set.delete(gid);
      else set.add(gid);
      return { ...f, groupIds: Array.from(set) };
    });

  const canSave = useMemo(() => {
    if (mode === "create") return !!form.email;
    return true;
  }, [mode, form.email]);

  async function onSave() {
    setSaving(true);
    try {
      const payload: any = {
        name: form.name || null,
        email: form.email || undefined, // ignored in PUT
        role: form.role,
      };
      if (mode === "create" && form.password) payload.password = form.password;
      if (mode === "edit") payload.groupIds = form.groupIds;

      const url = mode === "create" ? "/api/admin/users" : `/api/admin/users/${user!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Save failed");
      }
      router.push("/admin/users");
      router.refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!user?.id) return;
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Delete failed");
      return;
    }
    router.push("/admin/users");
    router.refresh();
  }

  return (
    <div className="relative">
      <OverlaySpinner open={saving} message="Saving…" />

      {/* Basic */}
      <section className="grid md:grid-cols-2 gap-3">
        <label className="grid gap-1">
          <span className="text-sm">Name</span>
          <input className="inp" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Email</span>
          <input className="inp" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={mode === "edit"} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">Role</span>
          <select className="inp" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        {mode === "create" ? (
          <label className="grid gap-1">
            <span className="text-sm">Password (optional)</span>
            <input className="inp" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 6 chars (leave empty to invite without password)" />
          </label>
        ) : null}
      </section>

      {/* Groups (current website) */}
      {mode === "edit" ? (
        <section className="card p-4 mt-4">
          <h3 className="text-base font-semibold mb-2">Groups (current website)</h3>
          {groups.length ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {groups.map((g) => (
                <label key={g.id} className="inline-flex items-center gap-2 p-2 rounded-md border">
                  <input
                    type="checkbox"
                    checked={form.groupIds.includes(g.id)}
                    onChange={() => onToggleGroup(g.id)}
                  />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No groups for this website.</div>
          )}
        </section>
      ) : null}

      {/* Actions */}
      <div className="mt-4">
        <FormActions
          mode={mode}
          saving={saving}
          onSave={onSave}
          onDelete={mode === "edit" ? onDelete : undefined}
          showBack
          saveTextCreate="Create"
          saveTextEdit="Save Changes"
        />
      </div>
    </div>
  );
}
