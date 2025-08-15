// app/widgets/ParticleOrb2D.tsx
"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  size?: number;          // px (clamp 72–150)
  particles?: number;     // จำนวนจุดเรืองแสง
  speed?: number;         // ความเร็วการไหล
  intensity?: number;     // ความสว่างรวม
  colorA?: string;        // สีหลัก 1
  colorB?: string;        // สีหลัก 2
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ParticleOrb2D({
  size = 128,
  particles = 900,
  speed = 1.0,
  intensity = 1.0,
  colorA = "#67e8f9",     // cyan-300
  colorB = "#d8b4fe",     // fuchsia-300
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>();
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const wrap = wrapRef.current!;
    const S = clamp(Math.floor(size), 72, 150);
    const dpr = Math.min((typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1, 2);

    // --- Canvas ---
    const cvs = document.createElement("canvas");
    const ctx = cvs.getContext("2d", { alpha: true })!;
    cvs.width = S * dpr;
    cvs.height = S * dpr;
    Object.assign(cvs.style, {
      display: "block",
      width: `${S}px`,
      height: `${S}px`,
      borderRadius: "9999px",
      background: "transparent",
    });
    wrap.appendChild(cvs);

    // --- Aura overlay (HTML) ---
    const aura = document.createElement("div");
    const auraStyle: Partial<CSSStyleDeclaration> = {
      position: "absolute",
      inset: "0",
      borderRadius: "9999px",
      pointerEvents: "none",
      background:
        "radial-gradient(40% 40% at 65% 70%, rgba(216,180,252,.22), rgba(0,0,0,0) 70%)," +
        "radial-gradient(35% 35% at 30% 30%, rgba(103,232,249,.20), rgba(0,0,0,0) 70%)",
      filter: "blur(10px)",
      maskImage: "radial-gradient(circle at 50% 50%, #000 70%, transparent 88%)",
    };
    Object.assign(aura.style, auraStyle);
    // ตั้งค่า vendor prop แยกเพื่อกัน TS error
    aura.style.setProperty("-webkit-mask-image", auraStyle.maskImage ?? "");
    wrap.appendChild(aura);

    // --- Animation setup ---
    const cx = cvs.width / 2;
    const cy = cvs.height / 2;
    const R = (S * dpr) * 0.46; // รัศมีหลัก
    const count = Math.max(300, particles);
    const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = Math.random();

    // โต้ตอบเมาส์ (แค่เอียง/ชี้แสง)
    const onMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      pointer.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      pointer.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    };
    wrap.addEventListener("pointermove", onMove);

    // ยูทิลสุ่ม/นอยส์เล็ก ๆ
    const nrand = (t: number) => (Math.sin(t * 12.9898) * 43758.5453) % 1;

    const t0 = performance.now();
    const loop = () => {
      raf.current = requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.globalCompositeOperation = "source-over";

      // core glow
      const g = ctx.createRadialGradient(cx - R * 0.15, cy - R * 0.15, 0, cx, cy, R * 1.05);
      g.addColorStop(0.0, `${hexToRgba(colorA, 0.45 * intensity)}`);
      g.addColorStop(0.5, `${hexToRgba(colorB, 0.2 * intensity)}`);
      g.addColorStop(1.0, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // particles (additive)
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < count; i++) {
        const f = (i + 0.5) / count;
        const ang = i * golden + t * 0.9 * speed + seeds[i] * 6.283;
        // ผิวนอกทรงกลม + ระลอกหายใจ
        const swell = Math.sin(t * 1.4 + seeds[i] * 6.0) * 0.08 * R;
        const r = R * Math.sqrt(f) + swell;

        // เอียงตาม pointer เล็กน้อย
        const tiltX = pointer.current.x * 0.08 * R;
        const tiltY = pointer.current.y * 0.08 * R;

        const x = cx + Math.cos(ang) * r + tiltX;
        const y = cy + Math.sin(ang) * r + tiltY;

        const sz = (0.6 + seeds[i] * 1.2) * dpr;
        const alpha = 0.06 + 0.12 * (0.5 + 0.5 * Math.sin(t * 2.2 + seeds[i] * 10));

        // ไล่สีระหว่าง A ↔ B
        const mix = 0.5 + 0.5 * Math.sin(t * 1.1 + seeds[i] * 7.0);
        const col = mixHex(colorA, colorB, mix);

        const grd = ctx.createRadialGradient(x, y, 0, x, y, sz * 3.2);
        grd.addColorStop(0, hexToRgba(col, alpha * intensity));
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, sz * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // soft rim
      ctx.globalCompositeOperation = "soft-light";
      ctx.strokeStyle = hexToRgba(colorB, 0.18 * intensity);
      ctx.lineWidth = Math.max(1, 1.2 * dpr);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.98, 0, Math.PI * 2);
      ctx.stroke();
    };

    loop();

    return () => {
      cancelAnimationFrame(raf.current!);
      wrap.removeEventListener("pointermove", onMove);
      wrap.contains(aura) && wrap.removeChild(aura);
      wrap.contains(cvs) && wrap.removeChild(cvs);
    };
  }, [size, particles, speed, intensity, colorA, colorB]);

  const S = clamp(Math.floor(size), 72, 150);
  return (
    <div
      ref={wrapRef}
      className={["ai-orb2d", className].filter(Boolean).join(" ")}
      style={{
        width: S,
        height: S,
        position: "relative",
        borderRadius: "9999px",
        overflow: "visible",
        background: "transparent",
        isolation: "isolate",
        filter: "drop-shadow(0 8px 28px rgba(103,232,249,.35))",
      }}
      aria-label="AI energy orb (2D)"
    />
  );
}

/* ---------- helpers ---------- */

function hexToRgba(hex: string, a = 1) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function hexToRgb(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function mixHex(a: string, b: string, t: number) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const b2 = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b2).toString(16).slice(1)}`;
}
