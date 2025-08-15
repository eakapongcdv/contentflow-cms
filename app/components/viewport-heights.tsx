"use client";
import { useEffect } from "react";

export default function ViewportHeights() {
  useEffect(() => {
    const update = () => {
      const h = document.getElementById("site-header")?.offsetHeight ?? 0;
      const f = document.getElementById("site-footer")?.offsetHeight ?? 0;
      const avail = window.innerHeight - h - f;
      document.documentElement.style.setProperty("--vh-available", `${avail}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return null;
}
