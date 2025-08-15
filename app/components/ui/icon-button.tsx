// app/components/ui/icon-button.tsx
"use client";
import * as React from "react";
import { cx } from "./cx";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ComponentType<any>;
  title?: string;
  active?: boolean;
  variant?: "ghost" | "zspell" | "outlineZspell";
};

export function IconButton({
  icon: Icon,
  title,
  active,
  variant = "ghost",
  className,
  ...rest
}: Props) {
  const base =
    variant === "zspell"
      ? "btn btn-zpell"
      : variant === "outlineZspell"
      ? "btn btn-outline-zpell"
      : "btn btn-ghost";

  return (
    <button
      {...rest}
      className={cx(
        base,
        "inline-flex items-center",
        active ? "ring-1 ring-zpell/40" : "",
        className
      )}
      title={title}
      aria-pressed={!!active}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
