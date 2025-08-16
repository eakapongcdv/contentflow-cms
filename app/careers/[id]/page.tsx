// app/careers/[id]/page.tsx
import { notFound } from "next/navigation";
import AiAgent from "../../components/widgets/AiAgent";
import { getJobById, jobIds, defaultApplyEmail } from "../_data";
import ClientLangLayout from "../../components/ClientLangLayout";

/** BG เหมือนหน้าแรก (คงของเดิม) */
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

export function generateStaticParams() {
  return jobIds().map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);
  const title = job ? `${job.title} — Careers | ContentFlow` : "Careers | ContentFlow";
  const desc = job?.summary ?? "Join ContentFlow AI Suite — Build the future of content.";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/75">
      {children}
    </span>
  );
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const job = getJobById(params.id);
  if (!job) notFound();

  const email = job.applyEmail || defaultApplyEmail;
  const mailSubject = encodeURIComponent(`Application: ${job.title} [${job.id}]`);
  const mailBody = encodeURIComponent(
    [
      `สวัสดีทีมงาน ContentFlow,`,
      ``,
      `สนใจสมัครตำแหน่ง: ${job.title} [${job.id}]`,
      ``,
      `ชื่อ-นามสกุล: `,
      `อีเมลติดต่อ: `,
      `โทร: `,
      `LinkedIn/Portfolio: `,
      ``,
      `เล่าประสบการณ์สั้น ๆ ที่เกี่ยวข้อง:`,
      ``,
      `แนบเรซูเม่/ลิงก์ (หากมี)`,
      ``,
      `ขอบคุณครับ/ค่ะ`,
    ].join("\n")
  );

  return (
    <ClientLangLayout>
      <main className="relative min-h-screen text-white">
        <DarkNeonBg />

        <div className="mx-auto max-w-7xl px-4 md:px-6 py-10 md:py-12">
          {/* Breadcrumb */}
          <div className="text-xs text-white/60">
            <a href="/careers" className="hover:text-white">Careers</a>
            <span className="mx-1">/</span>
            <span className="text-white/85">{job.title}</span>
          </div>

          {/* Header */}
          <header className="mt-3 md:mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge>{job.dept}</Badge>
                <Badge>{job.level}</Badge>
                <Badge>{job.type}</Badge>
                <Badge>{job.location}</Badge>
                {job.salaryHint && <Badge>Est. {job.salaryHint}</Badge>}
              </div>
              {job.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.tags.map((t) => (
                    <span key={t} className="text-[11px] rounded-md bg-black/40 border border-white/10 px-2 py-1 text-white/70">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                className="rounded-lg bg-cyan-400/90 text-black text-sm px-4 py-2 hover:bg-cyan-300"
                href={`mailto:${email}?subject=${mailSubject}&body=${mailBody}`}
              >
                Apply now
              </a>
              <a
                className="rounded-lg border border-white/15 bg-white/5 text-sm px-4 py-2 hover:bg-white/10"
                href="#process"
              >
                Hiring process
              </a>
            </div>
          </header>

          {/* Summary / About team */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-white">About this role</h2>
              <p className="mt-2 text-white/80">{job.summary}</p>
              {job.aboutTeam && <p className="mt-3 text-white/70 text-sm leading-relaxed">{job.aboutTeam}</p>}
            </div>
            <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white">Quick facts</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                <li>Department: <span className="text-white">{job.dept}</span></li>
                <li>Level: <span className="text-white">{job.level}</span></li>
                <li>Employment: <span className="text-white">{job.type}</span></li>
                <li>Location: <span className="text-white">{job.location}</span></li>
                {job.salaryHint && <li>Salary (est.): <span className="text-white">{job.salaryHint}</span></li>}
              </ul>
              <a
                className="mt-4 inline-flex rounded-lg bg-cyan-400/90 text-black text-sm px-3 py-2 hover:bg-cyan-300"
                href={`mailto:${email}?subject=${mailSubject}&body=${mailBody}`}
              >
                Apply via Email
              </a>
            </aside>
          </section>

          {/* Responsibilities / Requirements */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white">Responsibilities</h3>
              <ul className="mt-3 list-disc pl-5 text-white/80 text-sm space-y-1.5">
                {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>

            <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white">Requirements</h3>
              <div className="mt-3">
                <div className="text-white/85 font-medium">Must-have</div>
                <ul className="mt-2 list-disc pl-5 text-white/80 text-sm space-y-1.5">
                  {job.requirements.must.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              {job.requirements.nice && job.requirements.nice.length > 0 && (
                <div className="mt-4">
                  <div className="text-white/85 font-medium">Nice-to-have</div>
                  <ul className="mt-2 list-disc pl-5 text-white/80 text-sm space-y-1.5">
                    {job.requirements.nice.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Hiring process & CTA */}
          <section id="process" className="mt-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
              <h3 className="text-lg font-semibold text-white">Hiring process</h3>
              <ol className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                {[
                  { s: "1. ส่งเรซูเม่", d: `อีเมลหา ${email} พร้อมลิงก์ผลงาน` },
                  { s: "2. Screening", d: "ทีมงานทบทวนประสบการณ์และความเหมาะสม" },
                  { s: "3. Interview", d: "สัมภาษณ์ + อาจมีแบบทดสอบ/งานตัวอย่าง" },
                  { s: "4. Offer", d: "แจ้งข้อเสนอและเริ่มงานตามความพร้อม" },
                ].map((step, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
                    <div className="text-cyan-200">{step.s}</div>
                    <div className="text-white/85 mt-1">{step.d}</div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  className="rounded-lg bg-cyan-400/90 text-black text-sm px-4 py-2 hover:bg-cyan-300"
                  href={`mailto:${email}?subject=${mailSubject}&body=${mailBody}`}
                >
                  Apply now
                </a>
                <a href="/careers" className="text-sm text-white/80 hover:text-white underline underline-offset-4">
                  ดูตำแหน่งอื่น ๆ
                </a>
              </div>

              <div className="mt-3 text-xs text-white/50">
                * ระยะเวลา/ขั้นตอนอาจปรับตามตำแหน่งและความเหมาะสม
              </div>
            </div>
          </section>
        </div>

        {/* ปุ่ม/แชต AI */}
        <AiAgent />
      </main>
    </ClientLangLayout>
  );
}