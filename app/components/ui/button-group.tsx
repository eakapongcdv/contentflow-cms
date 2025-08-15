// app/components/ui/button-group.tsx
"use client";
import * as React from "react";
import { cx } from "./cx";

export function ButtonGroup({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx("inline-flex gap-2 flex-wrap", className)}>{children}</div>;
}
