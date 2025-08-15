// app/components/ui/utils.ts
import type React from "react";

/**
 * cn(): รวม className แบบยืดหยุ่น
 * รองรับ string / falsy / object ({ "class": bool }) คล้าย clsx
 * ใช้กับ Tailwind ได้ดี โดยให้ "ตัวท้ายสุดชนะ" ตามลำดับที่ใส่
 */
export function cn(
  ...classes: Array<
    string | number | false | null | undefined | Record<string, boolean>
  >
): string {
  const out: string[] = [];
  for (const c of classes) {
    if (!c) continue;
    if (typeof c === "string" || typeof c === "number") {
      out.push(String(c));
    } else if (typeof c === "object") {
      for (const [k, v] of Object.entries(c)) if (v) out.push(k);
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/** alias เผื่อเคยชินชื่อ clsx */
export const clsx = (...args: Parameters<typeof cn>) => cn(...args);

/** หน่วงเวลาแบบ Promise */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** parse JSON แบบปลอดภัย มีค่า fallback */
export function safeJSONParse<T = any>(s: string | null | undefined, fb: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fb;
  } catch {
    return fb;
  }
}

/** สร้าง slug ภาษาอังกฤษความยาวจำกัด (default 120) */
export function slugify(input: string, max = 120): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFKD") // ตัดวรรณยุกต์ (ถ้ามี)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, max);
}

/** รวม refs หลายตัวเข้าด้วยกัน (ใช้กับ forwardRef) */
export function mergeRefs<T = any>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as any).current = value;
    }
  };
}

/** เช็คคร่าว ๆ ว่าเป็น React component หรือไม่ */
export function isIconComponent(x: any): x is React.ComponentType<any> {
  return typeof x === "function";
}
