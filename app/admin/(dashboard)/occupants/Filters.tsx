"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

type Props = {
  q: string;
  venue: string;            // venue-1 | venue-2
  categories?: string[];    // รายการหมวดหมู่ (distinct)
  category?: string;        // cat ที่เลือกอยู่
};

export default function Filters({
  q,
  venue,
  categories = [],
  category = "",
}: Props) {
  const router = useRouter();

  const [localQ, setLocalQ] = useState(q);
  const [localCat, setLocalCat] = useState(category || "");

  useEffect(() => setLocalQ(q), [q]);
  useEffect(() => setLocalCat(category || ""), [category]);

  // ทำความสะอาด categories (กัน null/ซ้ำ)
  const catOptions = useMemo(
    () =>
      Array.from(new Set(categories.filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b)
      ),
    [categories]
  );

  // helper: สร้าง URL ใหม่ (ย้ายไปหน้า 1 ทุกครั้งที่เปลี่ยน filter)
  const toUrl = useMemo(
    () => (params: { q?: string; cat?: string; page?: number | string }) => {
      const sp = new URLSearchParams();
      sp.set("venue", venue);
      sp.set("page", String(params.page ?? 1));
      const query = (params.q ?? localQ).trim();
      const cat = params.cat ?? localCat;
      if (query) sp.set("q", query);
      if (cat) sp.set("cat", cat);
      return `/admin/occupants?${sp.toString()}`;
    },
    [venue, localQ, localCat]
  );

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    router.push(toUrl({ page: 1 }));
  };

  // เปลี่ยนหมวดแล้วนำทางทันที
  const onChangeCat = (val: string) => {
    setLocalCat(val);
    router.push(toUrl({ cat: val, page: 1 }));
  };

  // เคลียร์เฉพาะข้อความค้นหา (คง category เดิม)
  const clearSearch = () => {
    setLocalQ("");
    router.push(toUrl({ q: "", page: 1 }));
  };

  return (
    <form onSubmit={submit} className="w-full">
      {/* ใช้ flex + items-stretch ให้สูงเท่ากันทั้งหมด
          - flex-wrap สำหรับจอเล็ก, ไม่ล้น
          - sm:flex-nowrap บังคับแถวเดียวตั้งแต่จอ >= sm */}
      <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2 w-full min-w-0">
        {/* Category */}
        <label className="sr-only" htmlFor="filter-cat">Category</label>
        <select
          id="filter-cat"
          className="inp h-11 rounded-xl sm:basis-56 md:basis-64 flex-shrink-0"
          value={localCat}
          onChange={(e) => onChangeCat(e.target.value)}
        >
          <option value="">ทั้งหมด</option>
          {catOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Search */}
        <label className="sr-only" htmlFor="filter-q">Search</label>
        <input
          id="filter-q"
          className="inp h-11 rounded-xl flex-1 min-w-0"
          placeholder="ค้นหาชื่อ, unit, kiosk…"
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />

        {/* Clear button (ไอคอน) */}
        <button
          type="button"
          onClick={clearSearch}
          className="btn btn-outline-zpell h-11 w-11 p-0 grid place-items-center rounded-xl flex-shrink-0"
          title="ล้างคำค้น"
          aria-label="ล้างคำค้น"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Search button (ไอคอน) */}
        <button
          type="submit"
          className="btn btn-zpell h-11 w-11 p-0 grid place-items-center rounded-xl flex-shrink-0"
          title="ค้นหา"
          aria-label="ค้นหา"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
