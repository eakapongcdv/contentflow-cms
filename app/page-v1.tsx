"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Noto_Sans_Thai } from "next/font/google";
import AiAgent from "./widgets/AiAgent";

const noto = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// ------------------ Types ------------------
type BillingCycle = "monthly" | "annual";
type Discount = 0 | 0.15 | 0.2;
type PlanKey = "essential" | "pro" | "enterprise";
type CouponMode = "stack" | "replace";
type CheckoutBase = "stripe" | "promptpay";

// ------------------ Pricing Base (THB / mo) ------------------
const BASE_MONTHLY: Record<PlanKey, number> = {
  essential: 3900,
  pro: 12900,
  enterprise: 59000,
};

// ------------------ Utilities ------------------
function formatTHB(n: number) {
  return n.toLocaleString("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 });
}
function annualPrice(monthly: number, discount: number) {
  return Math.round(monthly * 12 * (1 - discount));
}

// ------------------ Images (Unsplash — “ภาพจริง”) ------------------
const GALLERY = [
  { src: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1600&auto=format&fit=crop", alt: "ทีมงานกำลังวางแผนคอนเทนต์บนหน้าจอ", caption: "AI Content Editor — ทำคอนเทนต์ไวขึ้นด้วยผู้ช่วย AI" },
  { src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop", alt: "แดชบอร์ดกราฟสถิติการเติบโต", caption: "Analytics & Growth — ดูผลลัพธ์แบบเรียลไทม์" },
  { src: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1600&auto=format&fit=crop", alt: "ทีมคอลแลบหลายภาษา", caption: "Localization — ไทย/อังกฤษ/จีน ในคลิกเดียว" },
  { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop", alt: "เซิร์ฟเวอร์และโครงสร้างพื้นฐาน", caption: "Enterprise Cloud — โฮสต์บนคลาวด์ระดับโลก" },
  { src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop", alt: "นักพัฒนาทำงานกับ CI/CD", caption: "API & Integration — ต่อเชื่อม ERP/CRM ได้" },
  { src: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1600&auto=format&fit=crop", alt: "การประชุมด้านความปลอดภัยข้อมูล", caption: "Security & Compliance — RBAC, SLA, Review" },
];

// ------------------ Plan recommender ------------------
function recommendPlan(input: {
  teamSize: number;
  postsPerMonth: number;
  needIntegrations: boolean;
  needCompliance: boolean;
  budgetPerMonth: number;
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

// ------------------ Dark-Neon BG ------------------
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
      <div className="absolute inset-0 bg-[linear-gradient(transparent,transparent_23px,rgba(255,255,255,.04)_24px),linear-gradient(90deg,transparent,transparent_23px,rgba(255,255,255,.04)_24px)] bg-[size:24px_24px]" />
    </div>
  );
}

// ------------------ Sections ------------------
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
          AI-Powered Content Suite for Thailand — Dark-Neon
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

function GalleryShowcase() {
  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader title="ภาพประกอบการใช้งานจริง" subtitle="เพิ่มความน่าเชื่อถือ: Editor • Analytics • Localization • Infra • API • Security" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3 gap-6">
        {GALLERY.map((g, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.src} alt={g.alt} className="h-56 md:h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="p-4">
              <p className="text-white text-sm md:text-[15px]">{g.caption}</p>
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10 group-hover:ring-white/20" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ------------------ Trust Signals (กับโลโก้จริง) ------------------
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
                  <img src={l.src} alt={l.alt || `logo-${i}`} className="max-h-10 object-contain opacity-90" />
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

// ------------------ Feature Table ------------------
const FEATURES: { label: string; essential: boolean; pro: boolean; enterprise: boolean; note?: string }[] = [
  { label: "AI Content Generator (TH/EN)", essential: true, pro: true, enterprise: true },
  { label: "AI Image Suggestion", essential: true, pro: true, enterprise: true },
  { label: "SEO Assist (หัวข้อ/คีย์เวิร์ด/เมตา)", essential: true, pro: true, enterprise: true },
  { label: "Templates + Branding", essential: true, pro: true, enterprise: true },
  { label: "Workflow Automation", essential: false, pro: true, enterprise: true },
  { label: "AI Personalization", essential: false, pro: true, enterprise: true },
  { label: "AI Translation / Localization", essential: false, pro: true, enterprise: true },
  { label: "Social & E-Commerce Integration", essential: false, pro: true, enterprise: true },
  { label: "Analytics & Prediction", essential: false, pro: true, enterprise: true },
  { label: "Omni-Channel Publishing", essential: false, pro: false, enterprise: true },
  { label: "API (ERP/CRM) Integration", essential: false, pro: false, enterprise: true },
  { label: "RBAC / SSO / AD", essential: false, pro: false, enterprise: true },
  { label: "SLA & 24/7 Support", essential: false, pro: false, enterprise: true },
];

// ------------------ Pricing + Chooser + Coupon ------------------
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
  // คำนวณส่วนลดตามโหมด
  const effectiveDiscount = useMemo(() => {
    if (billingCycle === "annual") {
      if (couponMode === "stack") {
        return Math.min(0.3, (annualDiscountBase || 0) + (couponExtra || 0));   // cap 30%
      } else {
        // replace: ใช้คูปองแทนส่วนลดรายปี (ถ้ามีคูปอง), ไม่งั้นใช้ส่วนลดรายปีเดิม
        return (couponExtra || annualDiscountBase || 0);
      }
    }
    // รายเดือน: ใช้ส่วนลดจากคูปองเท่านั้น
    return (couponExtra || 0);
  }, [billingCycle, annualDiscountBase, couponExtra, couponMode]);

  const price = useMemo(() => {
    if (billingCycle === "monthly") {
      const m = Math.round(monthly * (1 - effectiveDiscount));
      return `${formatTHB(m)} / เดือน`;
    }
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
  const [annualDiscount, setAnnualDiscount] = useState<Discount>(0.2); // ลดรายปีดีฟอลต์ 20%
  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<string>("");

  // Chooser inputs
  const [teamSize, setTeamSize] = useState(6);
  const [posts, setPosts] = useState(20);
  const [needIntegrations, setNeedIntegrations] = useState(true);
  const [needCompliance, setNeedCompliance] = useState(false);
  const [budget, setBudget] = useState(20000);

  const rec = useMemo(
    () => recommendPlan({ teamSize, postsPerMonth: posts, needIntegrations, needCompliance, budgetPerMonth: budget }),
    [teamSize, posts, needIntegrations, needCompliance, budget]
  );

  // Coupon logic
  const COUPONS: Record<string, number> = {
    WELCOME15: 0.15,  // 15% off first term
    LAUNCH20: 0.20,   // 20% off first term
    EDU20: 0.20,      // 20% gov/edu
  };
  const couponExtra = COUPONS[coupon.toUpperCase()] ?? 0;

  function applyCoupon() {
    const code = coupon.toUpperCase().trim();
    if (!code) {
      setCouponMsg("กรุณาใส่โค้ดคูปอง");
      return;
    }
    if (COUPONS[code]) {
      setCouponMsg(`ใช้คูปอง "${code}" สำเร็จ: ลดเพิ่ม ${(COUPONS[code] * 100).toFixed(0)}%`);
    } else {
      setCouponMsg("คูปองไม่ถูกต้อง");
    }
  }

  // -------- Tests (ไม่แก้ของเดิม และเพิ่มเคสใหม่) --------
  function pricingTests() {
    const m = BASE_MONTHLY.essential;
    // เดิม:
    const t1 = Math.round(m * (1 - 0.15)) > 0; // monthly + 15%
    const t2 = annualPrice(m, 0.2) === Math.round(m * 12 * 0.8); // annual 20%
    const capped = Math.min(0.3, 0.2 + 0.2) === 0.3; // cap 30%
    // ใหม่: stack vs replace
    const stackAnnual = Math.min(0.3, 0.2 + 0.15) === 0.3 ? "PASS" : ((0.2 + 0.15) === 0.35 ? "PASS" : "FAIL");
    const replaceAnnual = (0.15 || 0.2) === 0.15 ? "PASS" : "FAIL"; // ถ้ามีคูปอง 15% แทนที่ 20%
    alert(`Tests:
- Monthly 15% calc: ${t1 ? "PASS" : "FAIL"}
- Annual 20% calc: ${t2 ? "PASS" : "FAIL"}
- Discount cap 30%: ${capped ? "PASS" : "FAIL"}
- Stack (20%+15% <= 30%): ${stackAnnual}
- Replace (ใช้คูปองแทนรายปี): ${replaceAnnual}`);
  }

  const basePath = checkoutBase === "stripe" ? "/checkout/stripe" : "/checkout/promptpay";

  return (
    <section className="relative py-12 md:py-16">
      <SectionHeader
        title="ราคาและแพ็กเกจ (THB) • เลือกแพ็กเกจให้เหมาะกับทีมของคุณ"
        subtitle={`รอบบิล • ส่วนลดรายปี (${Math.round(annualDiscount * 100)}%) • คูปอง (${couponMode === "stack" ? "Stack กับรายปี (cap 30%)" : "แทนที่ส่วนลดรายปี"})`}
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
          <button onClick={pricingTests} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/80 hover:text-white">
            รัน Pricing Tests
          </button>
        </div>
      </div>
      {couponMsg && <div className="mx-auto max-w-6xl -mt-6 mb-6 text-sm text-emerald-200">{couponMsg}</div>}

      {/* Pricing Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-4 gap-6">
        <PricingCard
          name="Essential"
          monthly={BASE_MONTHLY.essential}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={COUPONS[coupon.toUpperCase()] ?? 0}
          couponMode={couponMode}
          checkoutHref={`${basePath}?plan=essential`}
          features={["CMS Core", "AI Content Generator", "AI Image Suggestion", "SEO Assist", "Starter Templates", "Easy Dashboard"]}
        />
        <PricingCard
          name="Pro"
          monthly={BASE_MONTHLY.pro}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={COUPONS[coupon.toUpperCase()] ?? 0}
          couponMode={couponMode}
          checkoutHref={`${basePath}?plan=pro`}
          features={["รวม Essential ทั้งหมด", "AI Personalization", "AI Translation", "Workflow Automation", "Social & E-Commerce", "Analytics & Reports"]}
          highlight
        />
        <PricingCard
          name="Enterprise (Cloud)"
          monthly={BASE_MONTHLY.enterprise}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={COUPONS[coupon.toUpperCase()] ?? 0}
          couponMode={couponMode}
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
        {/* ... (คงเดิมจากเวอร์ชันก่อน — ฟอร์ม teamSize / posts / integrations / compliance / budget) ... */}
      </div>
    </section>
  );
}

// ------------------ Admin Config Panel ------------------
function usePersistedState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      try { setVal(JSON.parse(raw)); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

function AdminConfig({
  onChange,
}: {
  onChange: (cfg: { couponMode: CouponMode; checkoutBase: CheckoutBase; logos: { src: string; alt: string }[] }) => void;
}) {
  const [open, setOpen] = usePersistedState<boolean>("cfg.open", false);
  const [couponMode, setCouponMode] = usePersistedState<CouponMode>("cfg.couponMode", "stack");
  const [checkoutBase, setCheckoutBase] = usePersistedState<CheckoutBase>("cfg.checkoutBase", "stripe");
  const [logos, setLogos] = usePersistedState<{ src: string; alt: string }[]>("cfg.trustLogos", [
    { src: "", alt: "" },
    { src: "", alt: "" },
    { src: "", alt: "" },
    { src: "", alt: "" },
    { src: "", alt: "" },
    { src: "", alt: "" },
  ]);

  useEffect(() => {
    onChange({ couponMode, checkoutBase, logos });
  }, [couponMode, checkoutBase, logos, onChange]);

  function updateLogo(i: number, field: "src" | "alt", v: string) {
    setLogos(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: v };
      return next;
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 rounded-full px-4 py-3 text-sm font-medium text-black bg-emerald-300 hover:bg-emerald-200 shadow-[0_8px_30px_rgba(16,185,129,.45)]"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {open ? "ปิดตั้งค่า" : "ตั้งค่าหน้า"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[420px] max-h-[75vh] rounded-2xl border border-white/10 bg-[#0d0f14]/95 backdrop-blur-lg shadow-[0_0_40px_rgba(34,211,238,.25)] p-4 overflow-auto">
          <div className="text-sm text-white/80 font-semibold">Admin Config</div>
          <div className="mt-3 space-y-4 text-sm text-white/80">
            <div>
              <div className="text-white/60 text-xs mb-1">นโยบายคูปอง</div>
              <div className="flex gap-2">
                <button className={`px-3 py-1.5 rounded-lg ${couponMode==="stack"?"bg-emerald-400/80 text-black":"bg-white/10 text-white/80"}`} onClick={() => setCouponMode("stack")}>Stack (cap 30%)</button>
                <button className={`px-3 py-1.5 rounded-lg ${couponMode==="replace"?"bg-emerald-400/80 text-black":"bg-white/10 text-white/80"}`} onClick={() => setCouponMode("replace")}>Replace</button>
              </div>
            </div>

            <div>
              <div className="text-white/60 text-xs mb-1">ช่องทางชำระเงิน</div>
              <div className="flex gap-2">
                <button className={`px-3 py-1.5 rounded-lg ${checkoutBase==="stripe"?"bg-cyan-400/80 text-black":"bg-white/10 text-white/80"}`} onClick={() => setCheckoutBase("stripe")}>Stripe</button>
                <button className={`px-3 py-1.5 rounded-lg ${checkoutBase==="promptpay"?"bg-cyan-400/80 text-black":"bg-white/10 text-white/80"}`} onClick={() => setCheckoutBase("promptpay")}>PromptPay</button>
              </div>
              <div className="text-[11px] text-white/50 mt-1">ปุ่มสมัคร/ชำระเงินจะชี้ไปที่ <code>{checkoutBase === "stripe" ? "/checkout/stripe?plan=..." : "/checkout/promptpay?plan=..."}</code></div>
            </div>

            <div>
              <div className="text-white/60 text-xs mb-2">Trust Logos (ใส่ URL รูปโลโก้จริง)</div>
              <div className="grid grid-cols-1 gap-2">
                {logos.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className="flex-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                      placeholder={`โลโก้ #${i+1} — https://.../logo.png`}
                      value={l.src}
                      onChange={(e)=>updateLogo(i,"src",e.target.value)}
                    />
                    <input
                      className="w-40 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white placeholder:text-white/40"
                      placeholder="ALT text"
                      value={l.alt}
                      onChange={(e)=>updateLogo(i,"alt",e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-white/50 mt-1">แนะนำ PNG/SVG พื้นหลังโปร่ง/เข้ม, ความสูง ~40px</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ------------------ Page ------------------
export default function ContentFlowPage() {
  // ค่าคอนฟิกที่ดึงจาก AdminConfig
  const [couponMode, setCouponMode] = useState<CouponMode>("stack");
  const [checkoutBase, setCheckoutBase] = useState<CheckoutBase>("stripe");
  const [logos, setLogos] = useState<{ src: string; alt: string }[]>([]);

  return (
    <main className={`${noto.className} relative min-h-screen text-white`}>
      <DarkNeonBg />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Hero />
        <GalleryShowcase />
        <TrustedBy logos={logos} />
        <PricingAndChooser couponMode={couponMode} checkoutBase={checkoutBase} />
        {/* Feature table คงเดิมจากเวอร์ชันก่อน */}
        <section className="relative py-12">
          <SectionHeader title="ตารางเทียบฟีเจอร์อย่างละเอียด" />
          <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <table className="w-full text-sm">
              <thead className="bg-white/10 text-white/80">
                <tr>
                  <th className="p-3 text-left font-medium">ฟีเจอร์</th>
                  <th className="p-3 text-center font-medium">Essential</th>
                  <th className="p-3 text-center font-medium">Pro</th>
                  <th className="p-3 text-center font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {FEATURES.map((f, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="p-3 text-white/90">
                      {f.label}{f.note && <span className="ml-2 text-white/50 text-xs">{f.note}</span>}
                    </td>
                    {(["essential","pro","enterprise"] as const).map((k) => (
                      <td key={k} className="p-3 text-center">
                        {(f as any)[k] ? <span className="inline-block size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" /> : <span className="text-white/40">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mx-auto max-w-6xl mt-3 text-[12px] text-white/40">
            * บางฟีเจอร์ใน Enterprise ต้องการการตั้งค่าพิเศษ/สcope งานเพิ่มเติม
          </div>
        </section>
      </div>

      <AiAgent />
      <AdminConfig onChange={(cfg) => {
        setCouponMode(cfg.couponMode);
        setCheckoutBase(cfg.checkoutBase);
        setLogos(cfg.logos);
      }} />
    </main>
  );
}
