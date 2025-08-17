// app/components/ui/button.tsx
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

/** tailwind class combiner */
function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";

type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** แสดงสปินเนอร์และ disable อัตโนมัติ */
  loading?: boolean;
  /** กว้างเต็มบรรทัด */
  fullWidth?: boolean;
  /** ไอคอนซ้าย/ขวา (ส่งเป็น ReactNode) */
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center rounded-lg border-2 text-sm font-medium transition-colors select-none tracking-wide " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-cyan-300/60 disabled:opacity-50 disabled:pointer-events-none";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 gap-1",
  md: "h-9 px-3.5 gap-1.5",
  lg: "h-10 px-4 gap-2 text-[15px]",
};

const variantStyles: Record<ButtonVariant, string> = {
  default:
    // Futuristic neon cyan/blue glow
    "bg-[#0f141d] text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_cyan] hover:bg-cyan-500/20 hover:shadow-[0_0_20px_cyan] active:bg-cyan-500/30",
  primary:
    // Emerald neon
    "bg-emerald-700 text-white border-emerald-400 shadow-[0_0_8px_#34d399] hover:shadow-[0_0_20px_#34d399] hover:bg-emerald-400/20 active:bg-emerald-400/30",
  secondary:
    // Purple neon
    "bg-white/5 text-purple-300 border-purple-500/60 shadow-[0_0_8px_purple] hover:shadow-[0_0_20px_purple] hover:bg-purple-500/10 active:bg-purple-500/20",
  outline:
    // Transparent with neon cyan border
    "bg-transparent text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_cyan] hover:bg-cyan-500/10 hover:shadow-[0_0_20px_cyan] active:bg-cyan-500/20",
  ghost:
    // Minimal, text glow on hover
    "bg-transparent text-white/80 border-transparent hover:text-cyan-300 hover:shadow-[0_0_20px_cyan] active:text-cyan-200",
  danger:
    // Red neon
    "bg-red-700 text-white border-red-400 shadow-[0_0_8px_red] hover:shadow-[0_0_20px_red] hover:bg-red-400/20 active:bg-red-400/30",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type, // เตรียมรับ type จากภายนอก
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Render as an IconButton with children as icon(s) only
    return (
      <IconButton
        ref={ref}
        type={type ?? "button"}
        size={size}
        variant={variant}
        className={cn(fullWidth && "w-full", className)}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          children
        )}
      </IconButton>
    );
  }
);
Button.displayName = "Button";

/** ปุ่มกลมสำหรับไอคอนล้วน */
export function IconButton({
  className,
  size = "md",
  variant = "secondary",
  children,
  type,
  ...props
}: Omit<ButtonProps, "children"> & { children: React.ReactNode }) {
  const roundSize =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-10 w-10" : "h-9 w-9";
  return (
    <button
      type={type ?? "button"}
      className={cn(base, roundSize, "p-0", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}
