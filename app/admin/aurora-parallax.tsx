// app/admin/aurora-parallax.tsx
"use client";

import { useEffect } from "react";

export default function AuroraParallax() {
  useEffect(() => {
    const body = document.querySelector<HTMLElement>(".admin-body");
    if (!body) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return; // เคารพการตั้งค่าผู้ใช้

    let raf = 0;
    // เป้าหมาย (เปอร์เซ็นต์)
    let tx1 = 30, ty1 = 30, tx2 = 70, ty2 = 70;
    // ค่าปัจจุบัน (จะ lerp ไปหาเป้าหมาย)
    let x1 = tx1, y1 = ty1, x2 = tx2, y2 = ty2;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = clientX / w;   // 0..1
      const ny = clientY / h;   // 0..1
      // แมปให้ขยับช่วง ~20% ของจอ
      tx1 = 20 + nx * 20;  // 20%..40%
      ty1 = 20 + ny * 20;
      tx2 = 60 + nx * 20;  // 60%..80%
      ty2 = 60 + ny * 20;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const mouseHandler = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchHandler = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (t) onMove(t.clientX, t.clientY);
    };

    const tick = () => {
      x1 = lerp(x1, tx1, 0.12);
      y1 = lerp(y1, ty1, 0.12);
      x2 = lerp(x2, tx2, 0.10);
      y2 = lerp(y2, ty2, 0.10);
      body.style.setProperty("--ax", `${x1}%`);
      body.style.setProperty("--ay", `${y1}%`);
      body.style.setProperty("--bx", `${x2}%`);
      body.style.setProperty("--by", `${y2}%`);
      // กำหนดความทึบตามระยะเคลื่อนที่เล็กน้อย (เอฟเฟกต์หายใจ)
      body.style.setProperty("--aop", `${0.22 + Math.abs(x1 - 30) / 300}`);
      body.style.setProperty("--bop", `${0.22 + Math.abs(y2 - 70) / 300}`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", mouseHandler, { passive: true });
    window.addEventListener("touchmove", touchHandler, { passive: true });

    // start softly (กลางหน้าจอ)
    onMove(window.innerWidth / 2, window.innerHeight / 2);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("touchmove", touchHandler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
