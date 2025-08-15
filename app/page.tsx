// app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import AiAgent from "./widgets/AiAgent";

/** ---------- Types ---------- **/
type BillingCycle = "monthly" | "annual";
type Discount = 0 | 0.15 | 0.2;
type PlanKey = "essential" | "pro" | "enterprise";
type CouponMode = "stack" | "replace";
type CheckoutBase = "stripe" | "promptpay";

/** ---------- Pricing Base (THB/mo) ---------- **/
const BASE_MONTHLY: Record<PlanKey, number> = {
  essential: 3900,
  pro: 12900,
  enterprise: 59000,
};

/** ---------- Utils ---------- **/
const formatTHB = (n: number) =>
  n.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
const annualPrice = (monthly: number, discount: number) =>
  Math.round(monthly * 12 * (1 - discount));

/** ---------- Recommender ---------- **/
function recommendPlan(input: {
  teamSize: number; postsPerMonth: number; needIntegrations: boolean; needCompliance: boolean; budgetPerMonth: number;
}): { plan: PlanKey; reasons: string[] } {
  const reasons: string[] = [];
  if (input.teamSize <= 5 && input.postsPerMonth <= 15 && !input.needIntegrations && !input.needCompliance) {
    reasons.push("ทีมเล็กและปริมาณคอนเทนต์ไม่มาก");
    if (input.budgetPerMonth < 5000) reasons.push("งบประมาณเหมาะกับแพ็กเกจเริ่มต้น");
    return { plan: "essential", reasons };
  }
  if (input.teamSize <= 20 && input.postsPerMonth <= 60 && !input.needCompliance) {
    reasons.push("ทำคอนเทนต์ต่อเนื่อง + อินทิเกรตโซเชียล/อีคอมเมิร์ซ");
    if (input.needIntegrations) reasons.push("ต้องการเชื่อมต่อระบบภายนอก");
    return { plan: "pro", reasons };
  }
  reasons.push("ต้องการฟีเจอร์ครบ + ความปลอดภัยระดับองค์กร");
  if (input.needCompliance) reasons.push("มีข้อกำกับ/Compliance");
  if (input.teamSize > 20 || input.postsPerMonth > 60) reasons.push("ทีมใหญ่/คอนเทนต์จำนวนมาก");
  return { plan: "enterprise", reasons };
}

/** ---------- Background ---------- **/
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

/** ---------- Sections ---------- **/
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white drop-shadow-[0_0_20px_rgba(0,255,209,.25)]">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-[15px] md:text-base text-white/70">{subtitle}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative py-12 md:py-16">
      <div className="mx-auto max-w-6xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white/70">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
          AI-Powered Content Suite for Your Business
        </div>
        <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_0_30px_rgba(34,211,238,.25)]">
          ContentFlow <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300">AI Suite</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/70">
          สร้างเนื้อหาอย่างชาญฉลาด เผยแพร่ได้เร็วยิ่งขึ้น — ครบทั้ง Editor, Automation, Analytics และ Localization
        </p>
      </div>
    </section>
  );
}

/** ---------- Demo Video (embed) ---------- **/
function DemoVideo() {
  // เปลี่ยน URL ได้จาก ENV หรือ localStorage["cfg.heroVideo"]
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    try {
      const fromLs = localStorage.getItem("cfg.heroVideo");
      setUrl(fromLs || process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "https://www.youtube.com/embed/34h1kn24ejE");
    } catch {
      setUrl(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "https://www.youtube.com/embed/34h1kn24ejE");
    }
  }, []);
  if (!url) return null;

  const isYouTube = /youtube\.com|youtu\.be/.test(url);
  return (
    <section className="relative pb-6">
      <div className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
        <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16 / 9" }}>
          {isYouTube ? (
            <iframe
              src={url}
              title="Product demo"
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <video
              className="absolute inset-0 h-full w-full"
              controls
              playsInline
              preload="metadata"
              poster="/video-poster.jpg"
            >
              <source src={url} />
            </video>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- NEW: Real-photo Feature Highlights (ภาพจริง โทนมืออาชีพ) ---------- */
const REAL_FEATURES: {
  title: string; desc: string; bullets: string[]; img: string; alt: string;
}[] = [
  {
    title: "AI Content Editor",
    desc: "ผู้ช่วยร่าง ปรับโทนภาษา และแนะนำรูปภาพอัตโนมัติ",
    bullets: ["รองรับไทย/อังกฤษ", "Template พร้อมใช้", "Grammar & Tone"],
    img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1600&auto=format&fit=crop",
    alt: "ทีมเอเชียกำลังทำงานร่วมกัน",
  },
  {
    title: "Localization (TH/EN/CN)",
    desc: "คลิกเดียวได้ 3 ภาษา พร้อม meta/slug ต่อภาษา",
    bullets: ["Human-in-the-loop", "Preview สลับภาษา", "ตรวจคำหลัก SEO"],
    img: "https://images.unsplash.com/photo-1542744095-291d1f67b221?q=80&w=1600&auto=format&fit=crop",
    alt: "ผู้จัดการคอนเทนต์ชาวเอเชียกำลังสรุปงาน",
  },
  {
    title: "Analytics & Insights",
    desc: "ดูคอนเทนต์ที่ทำผลงานดีที่สุดแบบเรียลไทม์",
    bullets: ["Realtime Cards", "Export รายงาน", "Attribution เบื้องต้น"],
    img: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop",
    alt: "แดชบอร์ดกราฟและสถิติ",
  },
  {
    title: "Workflow & Automation",
    desc: "วางแผน-อนุมัติ-เผยแพร่ อัตโนมัติ ลดงานซ้ำ",
    bullets: ["Kanban/Calendar", "Webhook/Jobs", "Notifications"],
    img: "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1600&auto=format&fit=crop",
    alt: "ทีมทำงานวางแผนบนไวท์บอร์ด",
  },
  {
    title: "E-Commerce & Social",
    desc: "เชื่อมต่อช็อปและโซเชียลยอดนิยม ยิงคอนเทนต์หลายช่องทาง",
    bullets: ["Facebook/IG/TikTok", "Shopee/Lazada", "Short-form Assist"],
    img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop",
    alt: "ทีมโซเชียลมีเดียชาวเอเชีย",
  },
  {
    title: "Security & RBAC",
    desc: "สิทธิ์หลายระดับ บันทึกกิจกรรม และนโยบายความปลอดภัย",
    bullets: ["Role/Rule Based", "Audit Trails", "SLA Options"],
    img: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1600&auto=format&fit=crop",
    alt: "ทีม Security กำลังประชุม",
  },
];

function FeatureHighlightsReal() {
  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader
        title="ไฮไลต์ฟีเจอร์เด่น"
        subtitle="เน้นประสบการณ์ใช้งานจริง เหมาะกับทีมในไทย"
      />
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3 gap-6">
        {REAL_FEATURES.map((f, idx) => (
          <article
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.img}
              alt={f.alt}
              className="h-44 md:h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="text-white font-semibold text-lg">{f.title}</h3>
              <p className="mt-1 text-white/75 text-sm">{f.desc}</p>
              <ul className="mt-3 space-y-1.5 text-white/80 text-sm">
                {f.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,.8)]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-white/20" />
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------- Cloud / Compliance / Trusted ---------- */
function CloudSupport() {
  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader
        title="Cloud Support & Deployment"
        subtitle="รองรับ AWS • Alibaba Cloud • Microsoft Azure รวมถึง Hybrid / Multi-Cloud"
      />

      <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6">
        <CloudCard label="Amazon Web Services">
          <CloudLogo
            primary="images/aws.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
            alt="AWS"
          />
        </CloudCard>

        <CloudCard label="Alibaba Cloud">
          <CloudLogo
            primary="images/alibaba.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/1/1d/Alibaba_Cloud_logo.svg"
            alt="Alibaba Cloud"
          />
        </CloudCard>

        <CloudCard label="Microsoft Azure">
          <CloudLogo
            primary="images/azure.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg"
            alt="Microsoft Azure"
          />
        </CloudCard>
      </div>

      <p className="mt-4 text-center text-white/60 text-sm">
        * เลือก Region/นโยบายเครือข่ายตามที่องค์กรต้องการ พร้อม CI/CD และ IaC (Terraform) ตัวอย่าง
      </p>
    </section>
  );
}

function CloudCard({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md grid place-items-center">
      <div className="h-16 w-36 grid place-items-center">{children}</div>
      <div className="mt-3 text-sm text-white/80">{label}</div>
    </div>
  );
}

function CloudLogo({
  primary,
  fallback,
  alt,
}: {
  primary: string;
  fallback: string;
  alt: string;
}) {
  const [src, setSrc] = useState(primary);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setSrc(fallback)}
      className="max-h-12 w-auto object-contain opacity-90"
      loading="lazy"
    />
  );
}

function Compliance() {
  const items = [
    {
      title: "PDPA Compliance-ready",
      desc: "แนวปฏิบัติด้านความเป็นส่วนตัว, Data Retention, Data Subject Request (DSR) พร้อมคู่มือ",
    },
    {
      title: "Consent Management",
      desc: "แบนเนอร์คุกกี้/Consent Log, บันทึกหลักฐานความยินยอม, โหมดไม่ระบุตัวตน",
    },
    {
      title: "ISO/IEC 29110",
      desc: "แนวปฏิบัติสำหรับองค์กร/ทีมขนาดเล็ก: เอกสารกระบวนการ, บันทึก และเทมเพลต",
    },
  ];
  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader title="Security & Compliance" subtitle="PDPA • Consent • ISO/IEC 29110" />
      <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="mb-3 inline-flex items-center justify-center rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-cyan-200">
              <ShieldIcon className="mr-2 h-4 w-4" /> Compliance
            </div>
            <h3 className="text-lg font-semibold text-white">{it.title}</h3>
            <p className="mt-2 text-white/70 text-sm leading-relaxed">{it.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[12px] text-white/40">
        * การรับรองอย่างเป็นทางการขึ้นกับขอบเขตโปรเจกต์ การตรวจ และนโยบายของลูกค้า
      </p>
    </section>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? "h-5 w-5"} aria-hidden="true">
      <path fill="currentColor" d="M12 2l7 3v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V5l7-3z" />
      <path fill="#09f" d="M12 9l4 2-4 6-4-6 4-2z" opacity=".2"/>
    </svg>
  );
}

/** ---------- Pricing Cards ---------- **/
function PricingCard({
  name, monthly, billingCycle, annualDiscountBase, couponExtra, couponMode, checkoutHref, features, highlight = false
}: {
  name: string;
  monthly: number;
  billingCycle: BillingCycle;
  annualDiscountBase: Discount;
  couponExtra: number;
  couponMode: CouponMode;
  checkoutHref: string;
  features: string[];
  highlight?: boolean;
}) {
  const effectiveDiscount = useMemo(() => {
    if (billingCycle === "annual") {
      if (couponMode === "stack") {
        return Math.min(0.3, (annualDiscountBase || 0) + (couponExtra || 0));
      } else {
        return (couponExtra || annualDiscountBase || 0);
      }
    }
    return (couponExtra || 0);
  }, [billingCycle, annualDiscountBase, couponExtra, couponMode]);

  const price = useMemo(() => {
    if (billingCycle === "monthly") return `${formatTHB(Math.round(monthly * (1 - effectiveDiscount)))} / เดือน`;
    return `${formatTHB(annualPrice(monthly, effectiveDiscount))} / ปี`;
  }, [billingCycle, monthly, effectiveDiscount]);

  const badge = billingCycle === "annual"
    ? `รายปี ลด ${(effectiveDiscount * 100).toFixed(0)}%`
    : (effectiveDiscount > 0 ? `รายเดือน ลด ${(effectiveDiscount*100).toFixed(0)}%` : "รายเดือน");

  return (
    <div className={`relative rounded-2xl border bg-white/5 backdrop-blur-md p-6
      ${highlight ? "border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,.25)]" : "border-white/10"}`}>
      <div className="absolute top-4 right-4">
        <span className={`text-xs px-2 py-1 rounded-full ${highlight ? "bg-cyan-400/20 text-cyan-200" : "bg-white/10 text-white/70"}`}>
          {badge}
        </span>
      </div>
      <h3 className="text-xl font-semibold text-white">{name}</h3>
      <div className="mt-3 text-3xl font-semibold text-white">{price}</div>
      <ul className="mt-5 space-y-2 text-white/80 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,.8)]"></span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a href={checkoutHref} className={`mt-6 block w-full text-center rounded-xl px-4 py-2.5 text-sm font-medium
        ${highlight ? "bg-cyan-400/90 text-black hover:bg-cyan-300" : "bg-white/10 text-white hover:bg-white/20"}`}>
        สมัครใช้งาน / ชำระเงิน
      </a>
      <div className="mt-3 text-[12px] text-white/50">*ราคายังไม่รวม VAT 7%</div>
    </div>
  );
}

function PricingAndChooser({
  couponMode,
  checkoutBase,
}: {
  couponMode: CouponMode;
  checkoutBase: CheckoutBase;
}) {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [annualDiscount, setAnnualDiscount] = useState<Discount>(0.2);
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string>("");

  const [teamSize, setTeamSize] = useState(6);
  const [posts, setPosts] = useState(20);
  const [needIntegrations, setNeedIntegrations] = useState(true);
  const [needCompliance, setNeedCompliance] = useState(false);
  const [budget, setBudget] = useState(20000);

  const rec = useMemo(
    () => recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }),
    [teamSize, posts, needIntegrations, needCompliance, budget]
  );

  const COUPONS: Record<string, number> = {
    WELCOME15: 0.15, LAUNCH20: 0.20, EDU20: 0.20
  };
  const couponExtra = COUPONS[coupon.toUpperCase()] ?? 0;

  function applyCoupon() {
    const code = coupon.toUpperCase().trim();
    if (!code) return setCouponMsg("กรุณาใส่โค้ดคูปอง");
    setCouponMsg(COUPONS[code] ? `ใช้คูปอง "${code}" สำเร็จ: ลดเพิ่ม ${(COUPONS[code]*100).toFixed(0)}%` : "คูปองไม่ถูกต้อง");
  }

  const basePath = checkoutBase === "stripe" ? "/checkout/stripe" : "/checkout/promptpay";

  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader
        title="ราคาและแพ็กเกจ (THB) • เลือกแพ็กเกจให้เหมาะกับทีมของคุณ"
        subtitle={`รอบบิล • ส่วนลดรายปี (${Math.round(annualDiscount * 100)}%) • คูปอง (${couponMode === "stack" ? "ลดเพิ่มสูงสุด 30%" : "แทนที่ส่วนลดรายปี"})`}
      />

      {/* Billing & Coupon */}
      <div className="mx-auto max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className={`px-4 py-2 rounded-xl text-sm ${billing === "monthly" ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:text-white"}`} onClick={() => setBilling("monthly")}>รายเดือน</button>
          <button className={`px-4 py-2 rounded-xl text-sm ${billing === "annual" ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:text-white"}`} onClick={() => setBilling("annual")}>รายปี</button>
          {billing === "annual" && (
            <div className="ml-3 inline-flex rounded-xl bg-white/10 p-1">
              {[0.15, 0.2].map((d) => (
                <button key={d} onClick={() => setAnnualDiscount(d as Discount)} className={`px-3 py-1.5 rounded-lg text-xs ${annualDiscount === d ? "bg-emerald-400/80 text-black" : "text-white/80 hover:text-white"}`}>
                  ลด {Math.round(d * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-1.5">
            <input
              className="bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none px-2"
              placeholder="ใส่โค้ดคูปอง (WELCOME15 / LAUNCH20 / EDU20)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button onClick={applyCoupon} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-400/90 text-black hover:bg-cyan-300">
              ใช้คูปอง
            </button>
          </div>
        </div>
      </div>
      {couponMsg && <div className="mx-auto max-w-6xl -mt-6 mb-6 text-sm text-emerald-200">{couponMsg}</div>}

      {/* Pricing Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-4 gap-6">
        <PricingCard
          name="Essential" monthly={BASE_MONTHLY.essential} billingCycle={billing}
          annualDiscountBase={annualDiscount} couponExtra={couponExtra} couponMode={couponMode}
          checkoutHref={`${basePath}?plan=essential`}
          features={["CMS Core", "AI Content Generator", "AI Image Suggestion", "SEO Assist", "Starter Templates", "Easy Dashboard"]}
        />
        <PricingCard
          name="Pro" monthly={BASE_MONTHLY.pro} billingCycle={billing}
          annualDiscountBase={annualDiscount} couponExtra={couponExtra} couponMode={couponMode}
          checkoutHref={`${basePath}?plan=pro`}
          features={["รวม Essential ทั้งหมด", "AI Personalization", "AI Translation", "Workflow Automation", "Social & E-Commerce", "Analytics & Reports"]}
          highlight
        />
        <PricingCard
          name="Enterprise (Cloud)" monthly={BASE_MONTHLY.enterprise} billingCycle={billing}
          annualDiscountBase={annualDiscount} couponExtra={couponExtra} couponMode={couponMode}
          checkoutHref={`${basePath}?plan=enterprise`}
          features={["รวม Pro ทั้งหมด", "Omni-Channel Publishing", "Advanced AI Analytics", "API (ERP/CRM) Integration", "RBAC (สิทธิ์หลายระดับ)", "SLA & 24/7 Support"]}
        />
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <h3 className="text-xl font-semibold text-white">On-Premise</h3>
          <div className="mt-3 text-2xl font-semibold text-white">ติดต่อฝ่ายขาย</div>
          <ul className="mt-5 space-y-2 text-white/80 text-sm">
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Deploy ใน DC ขององค์กร</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />SSO/AD, Custom SLA</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Security/Compliance Review</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Migration & Training</li>
          </ul>
          <a href="mailto:sales@codediva.co.th?subject=ขอใบเสนอราคา%20On-Premise%20ContentFlow%20AI%20Suite"
             className="mt-6 block w-full text-center rounded-xl px-4 py-2.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20">
            นัดเดโม / ขอใบเสนอราคา
          </a>
          <div className="mt-3 text-[12px] text-white/50">*ราคายังไม่รวม VAT 7%</div>
        </div>
      </div>

      {/* Chooser */}
      <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <h4 className="text-lg font-semibold text-white">ตัวช่วยเลือกแพ็กเกจ</h4>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <label className="flex flex-col text-white/80">ขนาดทีม (คน)
            <input type="number" min={1} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
                   value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="flex flex-col text-white/80">โพสต์/เดือน
            <input type="number" min={0} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
                   value={posts} onChange={(e) => setPosts(parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="flex items-center gap-2 text-white/80">
            <input type="checkbox" className="size-4 accent-emerald-400" checked={needIntegrations} onChange={(e) => setNeedIntegrations(e.target.checked)} />
            ต้องการ Integrations
          </label>
          <label className="flex items-center gap-2 text-white/80">
            <input type="checkbox" className="size-4 accent-emerald-400" checked={needCompliance} onChange={(e) => setNeedCompliance(e.target.checked)} />
            มีข้อกำกับ/Compliance
          </label>
          <label className="flex flex-col text-white/80">งบ/เดือน (THB)
            <input type="number" min={0} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
                   value={budget} onChange={(e) => setBudget(parseInt(e.target.value || "0", 10))} />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-white/90">
          <div className="text-sm">คำแนะนำของระบบ</div>
          <div className="mt-1 text-lg font-semibold">
            {recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }).plan === "essential" && "✅ Essential"}
            {recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }).plan === "pro" && "✅ Pro"}
            {recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }).plan === "enterprise" && "✅ Enterprise (Cloud/On-Prem)"}
          </div>
          <ul className="mt-2 text-sm list-disc pl-5 text-white/70">
            {recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }).reasons.map((r, i) => (<li key={i}>{r}</li>))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** ---------- TrustedBy (kept) ---------- */
function TrustedBy({ logos }: { logos: { src: string; alt: string }[] }) {
  const placeholders = [
    { name: "Alibaba Cloud Partner" },
    { name: "AWS Integration Ready" },
    { name: "ISO/IEC 27001 Ready*" },
    { name: "TLS 1.2+ / WAF Ready" },
    { name: "SSO / AD / OAuth2" },
    { name: "SOC 2 (process-ready*)" },
  ];
  const useLogos = logos.filter(l => !!l.src);

  return (
    <section className="relative py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <div className="text-center mb-6">
            <div className="text-white/70 text-sm">Trusted signals & Partnerships</div>
            <div className="mt-1 text-xl font-semibold text-white">ความน่าเชื่อถือระดับองค์กร</div>
          </div>

          {useLogos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center">
              {useLogos.map((l, i) => (
                <div key={i} className="flex items-center justify-center rounded-xl border border-white/10 bg-black/30 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt={l.alt || `logo-${i}`} className="max-h-10 object-contain opacity-90" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {placeholders.map((it, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="text-white/90 text-sm">{it.name}</div>
                  <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-cyan-200">Badge</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-center text-[12px] text-white/40">
            *แสดงความพร้อมกระบวนการ/การผสานระบบ — การรับรองจริงขึ้นกับขอบเขตโปรเจกต์และผู้ตรวจรับรอง
          </div>
        </div>
      </div>
    </section>
  );
}

/** ---------- Footer ---------- */
function SiteFooter() {
  return (
    <footer className="mt-0">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 md:p-8">
          {/* Grid แนวเดียวกับ content: 4 คอลัมน์บน md+ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand / Intro */}
            <div>
              <div className="text-lg font-semibold text-white">ContentFlow AI Suite</div>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                แพลตฟอร์มจัดการคอนเทนต์พร้อม AI สำหรับธุรกิจไทย — สร้าง เผยแพร่ และวัดผลอย่างมืออาชีพ
              </p>
              <p className="mt-3 text-xs text-white/50">
                รองรับ Cloud / Hybrid • PDPA & Consent • ISO/IEC 29110 (guideline)
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Product" className="text-sm">
              <div className="font-semibold text-white">Product</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="#features">Features</a></li>
                <li><a className="hover:text-white" href="#pricing">Pricing</a></li>
                <li><a className="hover:text-white" href="#cloud">Cloud Support</a></li>
                <li><a className="hover:text-white" href="#security">Security & Compliance</a></li>
                <li><a className="hover:text-white" href="/docs">Docs & API</a></li>
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label="Company" className="text-sm">
              <div className="font-semibold text-white">Company</div>
              <ul className="mt-3 space-y-2 text-white/75">
                <li><a className="hover:text-white" href="/about">About us</a></li>
                <li><a className="hover:text-white" href="/contact">Contact us</a></li>
                <li><a className="hover:text-white" href="/careers">Careers</a></li>
                <li><a className="hover:text-white" href="/partners">Partners</a></li>
              </ul>
            </nav>

            {/* Newsletter / Social / Contact */}
            <div className="text-sm">
              <div className="font-semibold text-white">Stay in the loop</div>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => { e.preventDefault(); /* TODO: wire-up */ }}
              >
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="อีเมลสำหรับข่าวสาร"
                  className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                  aria-label="Email for newsletter"
                  required
                />
                <button className="rounded-lg px-3 py-2 bg-cyan-400/90 text-black hover:bg-cyan-300">
                  สมัคร
                </button>
              </form>

              <div className="mt-4 text-white/75 space-y-1.5">
                <div><span className="text-white/50">Email:</span> <a className="hover:text-white" href="mailto:support@codediva.co.th">support@codediva.co.th</a></div>
                <div><span className="text-white/50">Mobile:</span> <a className="hover:text-white" href="tel:+66999999999">+66 99 999 9999</a></div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <a href="https://facebook.com" aria-label="Facebook" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.6V12h2.8V9.7c0-2.8 1.6-4.3 4-4.3 1.2 0 2.4.2 2.4.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h3l-.5 2.9h-2.5v7A10 10 0 0 0 22 12z"/></svg>
                </a>
                <a href="https://x.com" aria-label="X / Twitter" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.9 2H21l-6.5 7.5 7.6 12.5H16l-4.7-7-5.4 7H3l7-8.7L2 2h6.1l4.3 6.4L18.9 2zM16.9 20h1.7L8.1 4H6.3l10.6 16z"/></svg>
                </a>
                <a href="https://www.linkedin.com" aria-label="LinkedIn" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.85 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zM8 8h3.8v2.1h.1C12.7 8.9 14.3 8 16.6 8 21.2 8 22 10.9 22 15.2V23h-4v-6.7c0-1.6 0-3.8-2.3-3.8S12.9 14 12.9 16.2V23h-4V8z"/></svg>
                </a>
                <a href="https://youtube.com" aria-label="YouTube" className="text-white/70 hover:text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12c0 1.8.2 3.6.5 5.8a3 3 0 0 0 2.1 2.1C4.4 20.5 12 20.5 12 20.5s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1c.3-2.2.5-4 .5-5.8 0-1.8-.2-3.6-.5-5.8zM9.6 15.5V8.5l6.2 3.5-6.2 3.5z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 border-t border-white/10 pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/55">
            <div>© {new Date().getFullYear()} Codediva Co., Ltd. All rights reserved.</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <a className="hover:text-white" href="/policy">Privacy Policy</a>
              <a className="hover:text-white" href="/terms">Terms & Conditions</a>
              <a className="hover:text-white" href="/pdpa">PDPA & Consent</a>
              <a className="hover:text-white" href="/security">Security</a>
              <a className="hover:text-white" href="/sitemap">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** ---------- Page ---------- **/
export default function HomePage() {
  // โหลดค่าคอนฟิกจาก Admin (localStorage) — ใช้เมื่อฝั่ง client ready
  const [couponMode, setCouponMode] = useState<CouponMode>("stack");
  const [checkoutBase, setCheckoutBase] = useState<CheckoutBase>("stripe");
  const [logos, setLogos] = useState<{ src: string; alt: string }[]>([]);

  useEffect(() => {
    try {
      const cm = JSON.parse(localStorage.getItem("cfg.couponMode") || JSON.stringify("stack"));
      const co = JSON.parse(localStorage.getItem("cfg.checkoutBase") || JSON.stringify("stripe"));
      const lg = JSON.parse(localStorage.getItem("cfg.trustLogos") || "[]");
      setCouponMode(cm);
      setCheckoutBase(co);
      if (Array.isArray(lg)) setLogos(lg);
    } catch {}
  }, []);

  return (
    <main className="relative min-h-screen text-white">
      <DarkNeonBg />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Hero />
        <DemoVideo />
        {/* ✅ ใช้เฉพาะไฮไลต์ฟีเจอร์เด่น (ภาพจริง โทนมืออาชีพ) */}
        <FeatureHighlightsReal />
        <CloudSupport />
        <TrustedBy logos={logos} />
        <Compliance />
        <PricingAndChooser couponMode={couponMode} checkoutBase={checkoutBase} />
      
        <SiteFooter />
      </div>
      {/* ปุ่ม/แชต AI แบบ futuristic อยู่ใน AiAgent */}
      <AiAgent />
    </main>
  );
}
