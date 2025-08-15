// app/components/ui/overlay-spinner.tsx
"use client";
import * as React from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./cx";

export function OverlaySpinner({
  open,
  message = "Loading…",
  className,
}: {
  open: boolean;
  message?: string;
  className?: string;
}) {
  if (!open) return null;
  return (
    <div
      className={cx(
        "absolute inset-0 z-50 grid place-items-center bg-white/70 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border bg-white shadow-card">
        <Loader2 className="h-7 w-7 animate-spin text-zpell" />
        <div className="text-sm text-gray-700">{message}</div>
      </div>
    </div>
  );
}
