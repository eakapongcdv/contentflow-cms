// app/components/ui/table.tsx
"use client";
import * as React from "react";
import { cx } from "./cx";

export type Column<T> = {
  header: string;
  accessor?: keyof T;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

export function TableList<T extends { id: string | number }>({
  columns,
  rows,
  emptyText = "No data",
  className,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyText?: string;
  className?: string;
}) {
  return (
    <div className={cx("overflow-x-auto rounded-xl border bg-white", className)}>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className={cx("px-3 py-2 text-left font-medium", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-gray-500" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                {columns.map((c, i) => (
                  <td key={i} className={cx("px-3 py-2", c.className)}>
                    {c.render ? c.render(r) : (r[c.accessor as keyof T] as any)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
