"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type Props = {
  q: string;
  per: number;                                // ✅ เพิ่มให้ตรงกับ page.tsx
  venue: "venue-1" | "venue-2";
  categories: string[];
  category?: string;
};

export default function Filters({
  q,
  per,
  venue,
  categories,
  category,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // state สำหรับช่องค้นหา (ให้พิมพ์แล้วค่อยอัปเดต URL)
  const [kw, setKw] = React.useState(q);

  React.useEffect(() => {
    setKw(q);
  }, [q]);

  function buildQuery(next: Partial<{ q: string; per: number; venue: string; cat: string; page: number }>) {
    const u = new URLSearchParams(sp.toString());
    // keep current values as baseline
    u.set("venue", next.venue ?? venue);
    u.set("per", String(next.per ?? per));
    u.set("page", String(next.page ?? 1));       // เปลี่ยน filter ใด ๆ → กลับไปหน้า 1

    // q
    if (typeof next.q === "string") {
      if (next.q) u.set("q", next.q);
      else u.delete("q");
    } else if (q) {
      u.set("q", q);
    }

    // category
    const catVal = next.cat ?? category ?? "";
    if (catVal) u.set("cat", catVal);
    else u.delete("cat");

    return `${pathname}?${u.toString()}`;
  }

  function apply(next: Partial<{ q: string; per: number; venue: string; cat: string }>) {
    router.replace(buildQuery(next));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply({ q: kw });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-3">
      {/* Category */}
      <label className="grid gap-1">
        <span className="text-sm admin-subtle">หมวดหมู่</span>
        <select
          className="admin-select"
          value={category ?? ""}
          onChange={(e) => apply({ cat: e.target.value || "" })}
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      {/* Keyword */}
      <label className="grid gap-1">
        <span className="text-sm admin-subtle">ค้นหา</span>
        <input
          className="admin-input"
          value={kw}
          placeholder="ชื่อร้าน, หมวดหมู่, Unit, Kiosk..."
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit(e as any);
          }}
        />
      </label>

      {/* Per page */}
      <label className="grid gap-1">
        <span className="text-sm admin-subtle">ต่อหน้า</span>
        <select
          className="admin-select"
          value={per}
          onChange={(e) => apply({ per: Number(e.target.value) || per })}
        >
          {[10, 20, 30, 50, 100, 200].map((n) => (
            <option key={n} value={n}>
              {n} / หน้า
            </option>
          ))}
        </select>
      </label>

      {/* ปุ่มค้นหา (optional; กด Enter ก็ได้) */}
      <div className="md:col-span-3">
        <button type="submit" className="admin-btn">
          ค้นหา
        </button>
      </div>
    </form>
  );
}
