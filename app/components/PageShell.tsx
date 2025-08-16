// app/components/PageShell.tsx
"use client";

import React from "react";

function DarkNeonBg() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a0a0f] overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(0,255,209,.25), transparent 40%)" }} />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 70% 70%, rgba(255,0,171,.25), transparent 40%)" }} />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[50vmax] w-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: "conic-gradient(from 90deg, rgba(0,199,255,.18), rgba(255,89,247,.18), rgba(0,255,209,.18))" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.08),rgba(10,10,15,0))]" />
      <div className="absolute inset-0 tw-grid-overlay" />
    </div>
  );
}

export default function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen text-white">
      <DarkNeonBg />
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,255,209,.25)]">
          {title}
        </h1>
        <div className="mt-6 prose prose-invert prose-p:leading-relaxed max-w-3xl">
          {children}
        </div>
      </div>
    </main>
  );
}
