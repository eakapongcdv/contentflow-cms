// app/components/ui/thumb.tsx
"use client";

import * as React from "react";
import { cn } from "@/app/components/ui/utils";

type ThumbProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  /** ใส่ข้อความหรือ JSX ที่อยากให้แสดงแทน “no image” ก็ได้ */
  fallback?: React.ReactNode;
};

export function Thumb({ src, alt = "", className, fallback }: ThumbProps) {
  const [error, setError] = React.useState(false);

  // กรอบ + fallback
  const Box = ({ children }: { children?: React.ReactNode }) => (
    <div
      className={cn(
        "h-12 w-12 rounded-md overflow-hidden bg-gray-100 border grid place-items-center",
        className
      )}
    >
      {children}
    </div>
  );

  if (!src || error) {
    return (
      <Box>
        <span className="text-[11px] text-gray-400">
          {fallback ?? "no image"}
        </span>
      </Box>
    );
  }

  return (
    <Box>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setError(true)}
      />
    </Box>
  );
}
