// app/admin/(dashboard)/settings/ui/WebsiteSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";

type WebsiteLite = { id: string; name: string; template: string };

export default function WebsiteSwitcher({ initialWebsiteId }: { initialWebsiteId: string }) {
  const [websites, setWebsites] = useState<WebsiteLite[]>([]);
  const [value, setValue] = useState(initialWebsiteId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/websites", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setWebsites(data?.items ?? []);
      } catch (e) {
        console.error("Load websites failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function applySelection(nextId: string | null) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/website/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: nextId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to set website");
      }
      // persist to localStorage (เผื่อหน้าคลientอ่าน)
      if (typeof window !== "undefined") {
        if (nextId) localStorage.setItem("websiteId", nextId);
        else localStorage.removeItem("websiteId");
        try {
          window.dispatchEvent(new CustomEvent("website:changed", { detail: { websiteId: nextId } }));
        } catch {}
      }
      location.reload();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="grid sm:grid-cols-[1fr_auto_auto] gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        applySelection(value || null);
      }}
    >
      <label className="grid gap-1">
        <span className="text-sm">Website</span>
        <select
          className="inp"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">— Choose website —</option>
          {websites.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.template})
            </option>
          ))}
        </select>
      </label>

      <Button type="submit" variant="zspell" loading={saving}>
        Save
      </Button>
      <Button
        type="button"
        variant="outlineZspell"
        onClick={() => applySelection(null)}
        disabled={saving}
        title="Clear selected website"
      >
        Clear
      </Button>
    </form>
  );
}
