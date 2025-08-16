"use client";

import * as React from "react";

type Props = {
  value: number;
  q?: string;
  slug?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  className?: string;
};

export default function PageSizeSelect({
  value,
  q = "",
  slug = "",
  status = "",
  categoryId = "",
  page = 1,
  className,
}: Props) {
  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const take = Number(e.target.value || 20);
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (slug) sp.set("slug", slug);
    if (status) sp.set("status", status);
    if (categoryId) sp.set("categoryId", categoryId);
    sp.set("take", String(take));
    sp.set("page", "1"); // reset to first page on page-size change
    window.location.assign(`?${sp.toString()}`);
  };

  return (
    <select
      aria-label="Page size"
      value={value}
      onChange={onChange}
      className={["inp h-9 w-[92px] px-2 py-1 text-sm", className].filter(Boolean).join(" ")}
    >
      {[10, 20, 50, 100].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
