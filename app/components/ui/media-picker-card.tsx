// app/components/ui/media-picker-card.tsx
"use client";
import * as React from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "./button";

export function MediaPickerCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
}) {
  return (
    <div className="card p-3">
      <div className="text-xs text-gray-500 mb-2">{label}</div>
      <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-gray-50 grid place-items-center">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <ImageIcon className="h-6 w-6 mb-1" />
            <div className="text-xs">no image</div>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outlineZspell"
          onClick={() => {
            const u = prompt("Paste image URL");
            if (u && u.trim()) onChange(u.trim());
          }}
        >
          Replace
        </Button>
        {value ? (
          <Button type="button" variant="outlineZspell" onClick={() => onChange(null)}>
            Remove
          </Button>
        ) : null}
      </div>
      <input type="hidden" value={value || ""} readOnly />
    </div>
  );
}
