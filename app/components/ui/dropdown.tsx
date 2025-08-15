// app/components/ui/dropdown.tsx
"use client";
import * as React from "react";
import { cx } from "./cx";

type Option = { label: string; value: string };
type Props = {
  value?: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
};

export function Dropdown({ value, onChange, options, className }: Props) {
  return (
    <select
      className={cx("inp", className)}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
