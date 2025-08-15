"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  size?: number;            // px (auto clamp ≤ 150)
  particles?: number;       // จำนวนจุด/ประกาย
  intensity?: number;       // 0.6 – 1.6 แรงแสง
  colorA?: string;          // สีโทนฟ้า
  colorB?: string;          // สีโทนม่วง
  speed?: number;           // ความเร็วรวม
  className?: string;
};

/** ยูทิลสี */
function hexToRgb(h: string) {
  const s = h.replace("#", "");
  const n = parseInt(s.length === 3 ? s.split("").map(c => c + c).join("") : s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function mixColor(a: string, b: string, t: number) {
  const A = hexToRgb(a), B = hexToRgb(b);
  const r = Math.round(A.r + (B.r - A.r) * t);
  const g = Math.round(A.g + (B.g - A.g) * t);
  const b2 = Math.round(A.b + (B.b - A.b) * t);
  return `rgb(${r},${g},${b2})`;
}

export default function ParticleOrb2D({
  size = 128,
  particles = 1400,
  intensity = 1.0,
  colorA = "#67e8f9",
  colorB = "#d8b4fe",
  speed = 1.0,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>();
  const pointer = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    const wrap = wrapRef.current!;
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d", { alpha: true })!;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const S = Math.min(150, Math.max(72, Math.floor(size)));

    cvs.width = S * DPR;
    cvs.height = S * DPR;
    cvs.style.width = `${S}px`;
    cvs.style.height = `${S}px`;

    const C = { x: (S * DPR) / 2, y: (S * DPR) / 2, r: (S * DPR) / 2 - 2 * DPR };

    // เตรียมอนุภาค
    const N = Math.max(600, particles);
    const P = Array.from({ length: N }, (_, i) => {
      const t = (i + 0.5) / N;
      const ang = Math.random() * Math.PI * 2;
      const rad = 0.55 + Math.random() * 0.42;      // 0..1 ของรัศมี
      const seed = Math.random();
      const hueMix = Math.random();
      const sz = 0.7 + Math.random() * 1.8;
      return { ang, rad, seed, hueMix, sz };
    });

    // ออร่า HTML (นุ่มลอย)
    const aura = document.createElement("div");
    Object.assign(aura.style, {
      position: "absolute",
      inset: "0",
      borderRadius: "9999px",
      pointerEvents: "none",
      background:
        "radial-gradient(40% 40% at 60% 65%, rgba(216,180,252,.25), rgba(0,0,0,0) 70%)," +
        "radial-gradient(35% 35% at 35% 35%, rgba(103,232,249,.22), rgba(0,0,0,0) 70%)",
      filter: "blur(10px)",
      maskImage: "radial-gradient(circle at 50% 50%, black 70%, transparent 90%)",
      WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 70%, transparent 90%)",
    } as CSSStyleDeclaration);
    wrap.appendChild(aura);

    let t0 = performance.now();

    function frame() {
      raf.current = requestAnimationFrame(frame);
      const t = (performance.now() - t0) / 1000;

      ctx.clearRect(0, 0, cvs.width, cvs.height);

      // clip ให้เป็นวงกลมจริง
      ctx.save();
      ctx.beginPath();
      ctx.arc(C.x, C.y, C.r, 0, Math.PI * 2);
      ctx.clip();

      // core glow
      const g = ctx.createRadialGradient(
        C.x - C.r * 0.15,
        C.y - C.r * 0.1,
        C.r * 0.1,
        C.x,
        C.y,
        C.r * 1.05
      );
      g.addColorStop(0, `rgba(255,255,255,${0.22 * intensity})`);
      g.addColorStop(0.45, mixColor(colorA, colorB, 0.25));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(C.x - C.r, C.y - C.r, C.r * 2, C.r * 2);

      // swirls
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const p = P[i];

        // breathing + swirl speed
        const swirl = (0.6 + p.rad * 1.2) * speed;
        p.ang += 0.004 * swirl + 0.002 * Math.sin(t * 1.2 + p.seed * 6.0);

        // mouse influence (เล็กน้อย)
        const dx = pointer.current.active ? (pointer.current.x - 0.5) : 0;
        const dy = pointer.current.active ? (pointer.current.y - 0.5) : 0;
        const pull = pointer.current.active ? 0.12 : 0.0;

        const rPulse = C.r * (p.rad + 0.03 * Math.sin(t * 1.7 + p.seed * 8.0));
        const x = C.x + Math.cos(p.ang) * rPulse + dx * C.r * pull;
        const y = C.y + Math.sin(p.ang) * rPulse + dy * C.r * pull;

        const sz = (p.sz + 0.6 * Math.max(0, Math.sin(t * 2 + p.seed * 5))) * (cvs.width / (S * 2.6));
        const col = mixColor(colorA, colorB, p.hueMix * 0.7 + 0.2);

        ctx.fillStyle = col;
        ctx.globalAlpha = 0.08 * intensity + 0.12 * Math.max(0, Math.sin(t * 1.8 + p.seed * 10));
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // rim soft
      const rim = ctx.createRadialGradient(C.x, C.y, C.r * 0.82, C.x, C.y, C.r);
      rim.addColorStop(0, "rgba(255,255,255,0)");
      rim.addColorStop(1, "rgba(255,255,255,0.08)");
      ctx.fillStyle = rim;
      ctx.fillRect(C.x - C.r, C.y - C.r, C.r * 2, C.r * 2);

      ctx.restore();
    }
    frame();

    const onMove = (e: PointerEvent) => {
      const rect = cvs.getBoundingClientRect();
      pointer.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        active: true,
      };
    };
    const onLeave = () => (pointer.current.active = false);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf.current!);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      wrap.contains(aura) && wrap.removeChild(aura);
    };
  }, [size, particles, intensity, colorA, colorB, speed]);

  const S = Math.min(150, Math.max(72, Math.floor(size)));
  return (
    <div
      ref={wrapRef}
      className={["ai-orb", className].filter(Boolean).join(" ")}
      style={{
        width: S,
        height: S,
        position: "relative",
        borderRadius: "9999px",
        overflow: "hidden",
        isolation: "isolate",
        filter: "drop-shadow(0 10px 28px rgba(103,232,249,.35))",
        background: "transparent",
      }}
      aria-label="AI energy orb (2D)"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          background: "transparent",
          borderRadius: "9999px",
        }}
      />
    </div>
  );
}
