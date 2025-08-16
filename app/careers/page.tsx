// app/careers/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

/** ---------- BG ---------- **/
function DarkNeonBg() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 bg-[#0a0a0f] overflow-hidden">
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(0,255,209,.25), transparent 40%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 70% 70%, rgba(255,0,171,.25), transparent 40%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/3 h-[50vmax] w-[50vmax] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
        style={{ background: "conic-gradient(from 90deg, rgba(0,199,255,.18), rgba(255,89,247,.18), rgba(0,255,209,.18))" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,.08),rgba(10,10,15,0))]" />
      <div className="absolute inset-0 tw-grid-overlay" />
    </div>
  );
}

/** ---------- Types & Data ---------- **/
type Job = {
  id: string;
  title: string;
  dept: "Engineering" | "Design" | "Product" | "Sales" | "Marketing" | "Success";
  level: "Junior" | "Mid" | "Senior" | "Lead" | "Manager";
  type: "Full-time" | "Contract" | "Intern";
  location: "Bangkok (Hybrid)" | "Remote (TH)" | "Remote (APAC)";
  tags: string[];
  salaryHint?: string;
  summary: string;
  applyEmail?: string;
};

// คุณสามารถย้ายไปไฟล์ /app/careers/_data.ts แล้ว import ได้ภายหลัง
const JOBS: Job[] = [
  {
    id: "se-ai-01",
    title: "Software Engineer (Full-stack, AI)",
    dept: "Engineering",
    level: "Senior",
    type: "Full-time",
    location: "Bangkok (Hybrid)",
    tags: ["Next.js", "Node.js", "Python", "LLM", "RAG", "Cloud"],
    salaryHint: "THB 90–130K",
    summary:
      "สร้างฟีเจอร์ AI ให้ ContentFlow (RAG/agents), อินทิเกรต API และดูแลคุณภาพโค้ดระดับโปรดักชัน",
  },
  {
    id: "fe-02",
    title: "Frontend Engineer (Next.js + Tailwind)",
    dept: "Engineering",
    level: "Mid",
    type: "Full-time",
    location: "Remote (TH)",
    tags: ["TypeScript", "Next.js", "TailwindCSS", "UX"],
    salaryHint: "THB 60–90K",
    summary:
      "พัฒนา UI/UX คุณภาพสูง เน้นประสิทธิภาพและการเข้าถึง (a11y) ทำงานร่วมกับ Design/PM อย่างใกล้ชิด",
  },
  {
    id: "pm-01",
    title: "Product Manager (B2B SaaS)",
    dept: "Product",
    level: "Senior",
    type: "Full-time",
    location: "Bangkok (Hybrid)",
    tags: ["Roadmap", "Discovery", "Analytics", "SaaS"],
    salaryHint: "THB 100–150K",
    summary:
      "กำหนดวิสัยทัศน์และแผนงาน ร่วมทำ discovery/experiments เพื่อยกระดับคุณค่าผู้ใช้และผลลัพธ์ธุรกิจ",
  },
  {
    id: "ds-01",
    title: "Data Scientist (NLP)",
    dept: "Engineering",
    level: "Mid",
    type: "Full-time",
    location: "Remote (APAC)",
    tags: ["NLP", "Embeddings", "Evaluation", "Python"],
    salaryHint: "THB 80–120K",
    summary:
      "ออกแบบ pipeline วิเคราะห์คอนเทนต์/ผู้ชม, สร้างโมเดลช่วยตัดสินใจ, วัดคุณภาพด้วยเมตริกที่เหมาะสม",
  },
  {
    id: "ux-01",
    title: "Product Designer (UX/UI)",
    dept: "Design",
    level: "Mid",
    type: "Full-time",
    location: "Remote (TH)",
    tags: ["Design System", "Prototyping", "Research"],
    salaryHint: "THB 60–90K",
    summary:
      "ออกแบบประสบการณ์ใช้งานตั้งแต่ research → wireframe → hi-fi ด้วย design system โทน dark-neon",
  },
  {
    id: "sales-01",
    title: "Account Executive (B2B)",
    dept: "Sales",
    level: "Mid",
    type: "Full-time",
    location: "Bangkok (Hybrid)",
    tags: ["SaaS Sales", "Pipeline", "Demo", "Thai/English"],
    salaryHint: "Base + Commission",
    summary:
      "ขยายฐานลูกค้า SME/Enterprise นำเสนอเดโม จัดทำโซลูชัน/ใบเสนอราคา และทำงานร่วมทีม Customer Success",
  },
];

/** ---------- Page ---------- **/
export default function CareersPage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<"All" | Job["dept"]>("All");
  const [loc, setLoc] = useState<"All" | Job["location"]>("All");
  const [type, setType] = useState<"All" | Job["type"]>("All");

  const allDepts = useMemo(() => ["All", ...Array.from(new Set(JOBS.map(j => j.dept)))] as const, []);
  const allLocs = useMemo(() => ["All", ...Array.from(new Set(JOBS.map(j => j.location)))] as const, []);
  const allTypes = useMemo(() => ["All", ...Array.from(new Set(JOBS.map(j => j.type)))] as const, []);

  const filtered = useMemo(() => {
    return JOBS.filter(j => {
      const matchQ =
        !q ||
        j.title.toLowerCase().includes(q.toLowerCase()) ||
        j.summary.toLowerCase().includes(q.toLowerCase()) ||
        j.tags.some(t => t.toLowerCase().includes(q.toLowerCase()));
      const matchDept = dept === "All" || j.dept === dept;
      const matchLoc = loc === "All" || j.location === loc;
      const matchType = type === "All" || j.type === type;
      return matchQ && matchDept && matchLoc && matchType;
    });
  }, [q, dept, loc, type]);

  return (
    <main className="relative min-h-screen text-white">
      <DarkNeonBg />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 pt-8 md:pt-12">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white/70">
                <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
                We’re hiring across Thailand/APAC
              </div>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
                Careers at ContentFlow <span className="text-white/70">AI Suite</span>
              </h1>
              <p className="mt-2 text-white/70 max-w-2xl">
                มาร่วมสร้างแพลตฟอร์มคอนเทนต์ยุคใหม่ที่ผสาน AI — เราเชื่อในการทำงานที่โปร่งใส
                โฟกัสผลลัพธ์ สนับสนุนการเติบโต และใช้เทคโนโลยีที่เหมาะกับงาน
              </p>
            </div>

            {/* Search / Filters */}
            <div className="w-full md:w-[480px]">
              <div className="grid grid-cols-1 gap-2">
                <input
                  className="rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm placeholder:text-white/40"
                  placeholder="ค้นหาตำแหน่ง คีย์เวิร์ด หรือสกิล (เช่น Next.js, NLP)"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="rounded-lg bg-black/40 border border-white/15 px-2 py-2 text-sm"
                    value={dept}
                    onChange={(e) => setDept(e.target.value as any)}
                  >
                    {allDepts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select
                    className="rounded-lg bg-black/40 border border-white/15 px-2 py-2 text-sm"
                    value={loc}
                    onChange={(e) => setLoc(e.target.value as any)}
                  >
                    {allLocs.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <select
                    className="rounded-lg bg-black/40 border border-white/15 px-2 py-2 text-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                  >
                    {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="text-xs text-white/60">
                  Showing <span className="text-white/90">{filtered.length}</span> / {JOBS.length} open positions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { t: "Hybrid / Remote", d: "ยืดหยุ่นตามงาน — โฟกัสผลลัพธ์" },
            { t: "Learning budget", d: "งบอบรม/คอร์ส/หนังสือสำหรับทีม" },
            { t: "Modern stack", d: "Next.js, TS, Cloud, LLM tooling" },
            { t: "Inclusive team", d: "เคารพความเห็น โปร่งใส และเติบโต" },
          ].map((b, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="text-white font-medium">{b.t}</div>
              <div className="text-white/70 text-sm mt-1">{b.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Job list */}
      <section className="mx-auto max-w-7xl px-4 md:px-6 mt-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((j) => (
            <article
              key={j.id}
              className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    <Link href={`/careers/${j.id}`} className="hover:underline underline-offset-4">
                      {j.title}
                    </Link>
                  </h3>
                  <div className="mt-1 text-sm text-white/75">
                    {j.dept} • {j.level} • {j.type} • {j.location}
                    {j.salaryHint ? <span className="text-white/55"> • {j.salaryHint}</span> : null}
                  </div>
                </div>
                <Link
                  href={`/careers/${j.id}`}
                  className="shrink-0 rounded-lg bg-cyan-400/90 px-3 py-1.5 text-sm font-medium text-black hover:bg-cyan-300"
                >
                  View details
                </Link>
              </div>

              <p className="mt-3 text-white/80 text-sm leading-relaxed">
                {j.summary}
              </p>

              {j.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {j.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] rounded-md bg-black/40 border border-white/10 px-2 py-1 text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Link
                  href={`/careers/${j.id}`}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
                >
                  Learn more
                </Link>
                <a
                  href={`mailto:careers@codediva.co.th?subject=${encodeURIComponent(
                    "Application: " + j.title + " [" + j.id + "]"
                  )}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-emerald-200 hover:text-white"
                >
                  Apply via Email
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* No result state */}
        {filtered.length === 0 && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            ไม่พบตำแหน่งตามเงื่อนไขที่ค้นหา — ลองปรับฟิลเตอร์หรือติดตามอัปเดตผ่าน Newsletter ด้านล่าง
          </div>
        )}
      </section>
    </main>
  );
}
