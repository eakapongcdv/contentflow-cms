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
  | "zspell"          // 🔶 แบรนด์ของคุณ
  | "outlineZspell"   // 🔶 แบรนด์ของคุณ (outline)
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
  "inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-colors select-none " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 disabled:opacity-50 disabled:pointer-events-none";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 gap-1",
  md: "h-9 px-3.5 gap-1.5",
  lg: "h-10 px-4 gap-2 text-[15px]",
};

const variantStyles: Record<ButtonVariant, string> = {
  default:
    "bg-gray-900 text-white border-transparent hover:bg-gray-800 active:bg-gray-900/90",
  primary:
    "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 active:bg-emerald-700",
  secondary:
    "bg-white text-gray-900 border-gray-300 hover:bg-gray-50 active:bg-gray-100",
  outline:
    "bg-transparent text-gray-800 border-gray-300 hover:bg-gray-50 active:bg-gray-100",
  ghost:
    "bg-transparent text-gray-700 border-transparent hover:bg-gray-100 active:bg-gray-200",
  danger:
    "bg-red-600 text-white border-red-600 hover:bg-red-700 active:bg-red-700",
  /** 🔶 ZPELL brand */
  zspell:
    "bg-zpell text-white border-zpell hover:bg-zpell/90 active:bg-zpell/90",
  outlineZspell:
    "bg-transparent text-zpell border-zpell hover:bg-zpell/10 active:bg-zpell/15",
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

    return (
      <button
        ref={ref}
        type={type ?? "button"}                // ✅ ป้องกัน submit โดยไม่ได้ตั้งใจ
        className={cn(
          base,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={loading || undefined}       // ✅ a11y
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        ) : (
          leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>
        )}
        {children ? <span className="truncate">{children}</span> : null}
        {rightIcon && !loading ? (
          <span className="ml-2 inline-flex">{rightIcon}</span>
        ) : null}
      </button>
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
