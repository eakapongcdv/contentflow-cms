// app/components/ui/search-input.tsx
"use client";
import * as React from "react";
import { cx } from "./cx";
import { Search, X } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({ value, onChange, onSubmit, placeholder = "Search…", className }: Props) {
  return (
    <div className={cx("relative", className)}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.();
        }}
        className="inp pl-9 pr-8"
        placeholder={placeholder}
      />
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      {value ? (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => onChange("")}
          aria-label="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
