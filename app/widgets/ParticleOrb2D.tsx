// app/widgets/ParticleOrb2D.tsx
"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  size?: number;          // px (จะถูก clamp ที่ 72–150)
  particles?: number;     // จำนวนจุดแสง
  intensity?: number;     // ความสว่างรวม 0.6–1.6
  colorA?: string;        // สีไฮไลต์ 1
  colorB?: string;        // สีไฮไลต์ 2
  className?: string;
};

export default function ParticleOrb2D({
  size = 128,
  particles = 700,
  intensity = 1.1,
  colorA = "#67e8f9",     // cyan-300
  colorB = "#d8b4fe",     // fuchsia-300
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const wrap = wrapRef.current!;
    const S = Math.min(150, Math.max(72, Math.floor(size)));

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    Object.assign(canvas.style, {
      width: `${S}px`,
      height: `${S}px`,
      display: "block",
      borderRadius: "9999px",
      background: "transparent",
    });
    wrap.appendChild(canvas);

    const ctx = canvas.getContext("2d", { alpha: true })!;
    ctx.globalCompositeOperation = "lighter";

    // Aura (HTML) — ใช้ Partial<CSSStyleDeclaration> ป้องกัน TS error
    const aura = document.createElement("div");
    const auraStyle: Partial<CSSStyleDeclaration> = {
      position: "absolute",
      inset: "0",
      borderRadius: "9999px",
      pointerEvents: "none",
      background:
        "radial-gradient(40% 40% at 65% 70%, rgba(216,180,252,.24), rgba(0,0,0,0) 70%)," +
        "radial-gradient(35% 35% at 30% 30%, rgba(103,232,249,.22), rgba(0,0,0,0) 70%)",
      filter: "blur(14px)",
      maskImage: "radial-gradient(circle at 50% 50%, #000 70%, transparent 88%)",
    };
    Object.assign(aura.style, auraStyle);
    // ตั้งค่า vendor property แยก เพื่อไม่ให้ TS ฟ้อง
    (aura.style as any).WebkitMaskImage = auraStyle.maskImage;
    wrap.appendChild(aura);

    // เตรียมพาร์ติเคิลแบบวงโคจร
    const R = S * 0.44; // รัศมีภายใน
    const pts: {
      a: number; // มุม
      r: number; // รัศมี
      s: number; // ขนาด
      w: number; // ความเร็วเชิงมุม
      o: number; // ออฟเซ็ตส่าย
    }[] = [];

    for (let i = 0; i < particles; i++) {
      const t = i / particles;
      pts.push({
        a: Math.random() * Math.PI * 2,
        r: (0.35 + 0.65 * Math.sqrt(Math.random())) * R,
        s: 0.7 + Math.random() * 1.8,
        w: (0.15 + Math.random() * 0.9) * (Math.random() < 0.5 ? -1 : 1),
        o: Math.random() * 6.28,
      });
    }

    const cx = S / 2;
    const cy = S / 2;
    const colA = hex2rgba(colorA, 1);
    const colB = hex2rgba(colorB, 1);

    const t0 = performance.now();
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;

      // พื้นหลังภายในทรงกลม (ไล่โทน)
      ctx.clearRect(0, 0, S, S);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.2);
      g.addColorStop(0, rgba(colA, 0.35 * intensity));
      g.addColorStop(0.6, rgba(blend(colA, colB, 0.5), 0.18 * intensity));
      g.addColorStop(1, rgba(colB, 0.05));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
      ctx.fill();

      // จุดแสง
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const wobble = Math.sin(t * 2 + p.o) * 4;
        const a = p.a + p.w * t * 0.7;
        const r = p.r + wobble;

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.98;

        const size = p.s * (1 + Math.sin(t * 1.7 + p.o) * 0.25);
        const gg = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        const mix = (Math.sin(p.o + t) + 1) / 2;
        gg.addColorStop(0, rgba(blend(colA, colB, mix), 0.9 * intensity));
        gg.addColorStop(1, rgba(blend(colA, colB, mix), 0));
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ขอบนุ่มให้เป็นวงกลมชัดเจน
      const ring = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.12);
      ring.addColorStop(0, "rgba(0,0,0,0)");
      ring.addColorStop(1, rgba(colA, 0.08));
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
      ctx.fill();
    };

    tick();

    return () => {
      cancelAnimationFrame(rafRef.current!);
      wrap.contains(canvas) && wrap.removeChild(canvas);
      wrap.contains(aura) && wrap.removeChild(aura);
    };
  }, [size, particles, intensity, colorA, colorB]);

  const S = Math.min(150, Math.max(72, Math.floor(size)));
  return (
    <div
      ref={wrapRef}
      className={["ai-orb-2d", className].filter(Boolean).join(" ")}
      style={{
        width: S,
        height: S,
        position: "relative",
        borderRadius: "9999px",
        overflow: "visible",
        background: "transparent",
        isolation: "isolate",
        filter: "drop-shadow(0 10px 28px rgba(103,232,249,.35))",
      }}
      aria-label="AI energy orb"
    />
  );
}

/* ---------------- helpers ---------------- */

function hex2rgba(hex: string, a = 1): [number, number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return [r, g, b, a];
}
function rgba([r, g, b, a]: [number, number, number, number], alpha?: number) {
  return `rgba(${r},${g},${b},${alpha ?? a})`;
}
function blend(a: [number, number, number, number], b: [number, number, number, number], t: number) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    1,
  ] as [number, number, number, number];
}
