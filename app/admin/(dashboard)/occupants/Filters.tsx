"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export type Props = {
  q: string;
  per: number;
  venue: "venue-1" | "venue-2";
  categories: string[];
  category?: string;
};

export default function Filters({ q, per, venue, categories, category }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // local state for keyword (type & submit)
  const [kw, setKw] = React.useState(q ?? "");
  React.useEffect(() => setKw(q ?? ""), [q]);

  const perOptions = React.useMemo(() => [10, 20, 50, 100, 200], []);

  function buildQuery(next: Partial<{ q: string; per: number; venue: string; cat: string; page: number }>) {
    const u = new URLSearchParams(sp.toString());

    // base values
    u.set("venue", next.venue ?? venue);
    u.set("per", String(next.per ?? per));
    u.set("page", String(next.page ?? 1)); // any change -> reset to page 1

    // keyword
    if (typeof next.q === "string") {
      const nq = next.q.trim();
      if (nq) u.set("q", nq); else u.delete("q");
    } else if (q) {
      u.set("q", q);
    }

    // category
    const catVal = next.cat ?? category ?? "";
    if (catVal) u.set("cat", catVal); else u.delete("cat");

    return `${pathname}?${u.toString()}`;
  }

  function push(next: Partial<{ q: string; per: number; venue: string; cat: string }>) {
    router.push(buildQuery(next));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    push({ q: kw });
  }

  function clearAll() {
    const u = new URLSearchParams();
    u.set("venue", venue);
    u.set("page", "1");
    u.set("per", String(per));
    router.push(`${pathname}?${u.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="admin-card p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      {/* Left: Category + Search */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {/* Category */}
        <div className="min-w-[180px]">
          <label className="block text-xs text-white/60 mb-1">Category</label>
          <select
            value={category ?? ""}
            onChange={(e) => push({ cat: e.target.value || "" })}
            className="admin-input !pr-8 bg-white/5 border-white/15 text-white/90"
          >
            <option value="">All categories</option>
            {(Array.isArray(categories) ? categories : []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-white/60 mb-1">Search</label>
          <div className="relative">
            <input
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="ชื่อร้าน / EN name / Unit / Kiosk / Category"
              className="admin-input pl-9 pr-10 w-full bg-white/5 border-white/15 placeholder-white/40"
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(e as any); }}
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            {kw ? (
              <button
                type="button"
                onClick={clearAll}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 hover:bg-white/15"
                aria-label="Clear"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right: Page size + Apply */}
      <div className="flex items-end gap-2">

        <div className="pt-5">
          <button className="admin-btn" type="submit">Apply</button>
        </div>
      </div>
    </form>
  );
}
