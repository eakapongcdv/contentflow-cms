"use client";

export default function AdminDarkNeonBg() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a0a0f] overflow-hidden">
      {/* aurora blobs (รองรับ CSS vars จาก AuroraParallax) */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at var(--ax,30%) var(--ay,30%), rgba(0,255,209,.25), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at var(--bx,70%) var(--by,70%), rgba(255,0,171,.25), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/3 h-[50vmax] w-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{
          background:
            "conic-gradient(from 90deg, rgba(0,199,255,.18), rgba(255,89,247,.18), rgba(0,255,209,.18))",
        }}
      />
      {/* subtle center glow + grid เหมือนหน้า public */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.08),rgba(10,10,15,0))]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent,transparent_23px,rgba(255,255,255,.04)_24px),linear-gradient(90deg,transparent,transparent_23px,rgba(255,255,255,.04)_24px)] bg-[size:24px_24px]" />
    </div>
  );
}
