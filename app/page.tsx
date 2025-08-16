// app/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AiAgent from "./components/widgets/AiAgent";

/** ---------- Types ---------- **/
type BillingCycle = "monthly" | "annual";
type Discount = 0 | 0.15 | 0.2;
type PlanKey = "essential" | "pro" | "enterprise";
type CouponMode = "stack" | "replace";
type CheckoutBase = "stripe" | "promptpay";
type Lang = "TH" | "EN" | "CN";

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

/** ---------- Language helpers ---------- **/
function useLangFromPath(): Lang {
  const pathname = usePathname() || "/";
  const seg = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (seg === "en") return "EN";
  if (seg === "cn") return "CN";
  return "TH";
}

const TXT = {
  heroPill: {
    TH: "AI-Powered Content Suite for Your Business",
    EN: "AI-Powered Content Suite for Your Business",
    CN: "面向企业的 AI 内容套件",
  },
  heroTitle: {
    TH: <>ContentFlow <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300">AI Suite</span></>,
    EN: <>ContentFlow <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300">AI Suite</span></>,
    CN: <>ContentFlow <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-cyan-300 to-fuchsia-300">AI Suite</span></>,
  },
  heroSub: {
    TH: "สร้างเนื้อหาอย่างชาญฉลาด เผยแพร่ได้เร็วยิ่งขึ้น — ครบทั้ง Editor, Automation, Analytics และ Localization",
    EN: "Create smarter, publish faster — with Editor, Automation, Analytics and Localization built-in.",
    CN: "更智能地创作、更快速地发布——集成编辑、自动化、分析与本地化。",
  },

  // Features (ภาพจริง)
  featuresTitle: {
    TH: "ไฮไลต์ฟีเจอร์เด่น",
    EN: "Feature Highlights",
    CN: "核心功能亮点",
  },
  featuresSub: {
    TH: "เน้นประสบการณ์ใช้งานจริง เหมาะกับทีมในไทย",
    EN: "Real-world workflows, tailored for teams in Thailand.",
    CN: "贴合真实业务流程，适配泰国团队。",
  },
  features: {
    TH: [
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
    ],
    EN: [
      {
        title: "AI Content Editor",
        desc: "Draft with AI, adjust tone, and get image suggestions instantly.",
        bullets: ["Thai/English ready", "Starter templates", "Grammar & tone"],
        img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1600&auto=format&fit=crop",
        alt: "Asian team collaborating",
      },
      {
        title: "Localization (TH/EN/CN)",
        desc: "One click, three languages — meta/slug per locale.",
        bullets: ["Human-in-the-loop", "Language preview", "SEO keywords check"],
        img: "https://images.unsplash.com/photo-1542744095-291d1f67b221?q=80&w=1600&auto=format&fit=crop",
        alt: "Asian content manager presenting",
      },
      {
        title: "Analytics & Insights",
        desc: "See top-performing content in real time.",
        bullets: ["Realtime cards", "Export reports", "Basic attribution"],
        img: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop",
        alt: "Dashboard with charts",
      },
      {
        title: "Workflow & Automation",
        desc: "Plan-approve-publish automatically, cut repetitive work.",
        bullets: ["Kanban/Calendar", "Webhooks/Jobs", "Notifications"],
        img: "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1600&auto=format&fit=crop",
        alt: "Team planning on whiteboard",
      },
      {
        title: "E-Commerce & Social",
        desc: "Connect shops & socials, publish across channels.",
        bullets: ["Facebook/IG/TikTok", "Shopee/Lazada", "Short-form assist"],
        img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop",
        alt: "Social team at work",
      },
      {
        title: "Security & RBAC",
        desc: "Granular roles, audit logs, and security policies.",
        bullets: ["Role/Rule based", "Audit trails", "SLA options"],
        img: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1600&auto=format&fit=crop",
        alt: "Security meeting",
      },
    ],
    CN: [
      {
        title: "AI 内容编辑器",
        desc: "AI 起草、语气调整与图片建议一键完成。",
        bullets: ["支持泰/英", "模板即用", "语法与语气"],
        img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=1600&auto=format&fit=crop",
        alt: "亚洲团队协作",
      },
      {
        title: "多语言本地化（TH/EN/CN）",
        desc: "一键三语，按语言生成 meta/slug。",
        bullets: ["人工审校", "语言预览", "SEO 关键词检查"],
        img: "https://images.unsplash.com/photo-1542744095-291d1f67b221?q=80&w=1600&auto=format&fit=crop",
        alt: "亚洲内容经理汇报",
      },
      {
        title: "分析与洞察",
        desc: "实时查看表现最佳的内容。",
        bullets: ["实时卡片", "导出报表", "基础归因"],
        img: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600&auto=format&fit=crop",
        alt: "数据图表面板",
      },
      {
        title: "流程与自动化",
        desc: "规划-审批-发布自动化，减少重复劳动。",
        bullets: ["看板/日历", "Webhook/任务", "通知提醒"],
        img: "https://images.unsplash.com/photo-1552581234-26160f608093?q=80&w=1600&auto=format&fit=crop",
        alt: "团队白板规划",
      },
      {
        title: "电商与社媒",
        desc: "连接商城与社媒，多渠道分发内容。",
        bullets: ["Facebook/IG/TikTok", "Shopee/Lazada", "短内容助手"],
        img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1600&auto=format&fit=crop",
        alt: "社媒团队工作",
      },
      {
        title: "安全与权限",
        desc: "细粒度角色、审计日志与安全策略。",
        bullets: ["基于角色/规则", "审计日志", "SLA 选项"],
        img: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?q=80&w=1600&auto=format&fit=crop",
        alt: "安全会议",
      },
    ],
  },

  // Cloud
  cloudTitle: {
    TH: "Cloud Support & Deployment",
    EN: "Cloud Support & Deployment",
    CN: "云部署支持",
  },
  cloudSub: {
    TH: "รองรับ AWS • Alibaba Cloud • Microsoft Azure รวมถึง Hybrid / Multi-Cloud",
    EN: "Supports AWS • Alibaba Cloud • Microsoft Azure, plus Hybrid / Multi-Cloud",
    CN: "支持 AWS、阿里云、微软 Azure，以及混合/多云",
  },

  // Compliance
  secTitle: {
    TH: "Security & Compliance",
    EN: "Security & Compliance",
    CN: "安全与合规",
  },
  secSub: {
    TH: "PDPA • Consent • ISO/IEC 27001/27018 (guideline) • Access Control",
    EN: "PDPA • Consent • ISO/IEC 27001/27018 (guideline) • Access Control",
    CN: "PDPA • 同意管理 • ISO/IEC 27001/27018（指南）• 访问控制",
  },
  secItems: {
    TH: [
      { title: "PDPA Compliance-ready", desc: "แนวปฏิบัติ Privacy, Data Retention, DSR พร้อมคู่มือ" },
      { title: "Consent Management", desc: "แบนเนอร์คุกกี้/Consent Log, บันทึกความยินยอม" },
      { title: "Access Control & Audit", desc: "RBAC, บันทึกกิจกรรม, การแจ้งเตือนเหตุผิดปกติ" },
    ],
    EN: [
      { title: "PDPA Compliance-ready", desc: "Privacy practice, data retention & DSR guide" },
      { title: "Consent Management", desc: "Cookie banner, consent logs, evidence tracking" },
      { title: "Access Control & Audit", desc: "RBAC, activity logs, anomaly alerts" },
    ],
    CN: [
      { title: "PDPA 合规准备", desc: "隐私实践、数据保留与 DSR 指南" },
      { title: "同意管理", desc: "Cookie 横幅、同意日志与证据留存" },
      { title: "访问控制与审计", desc: "RBAC、活动日志、异常提醒" },
    ],
  },

  // Pricing section (หัวข้อ + chooser)
  pricingTitle: {
    TH: "ราคาและแพ็กเกจ (THB) • เลือกแพ็กเกจให้เหมาะกับทีมของคุณ",
    EN: "Pricing (THB) • Pick the plan that fits your team",
    CN: "价格（泰铢）• 为你的团队选择合适方案",
  },
  pricingSub: (annual: number, mode: CouponMode, lang: Lang) =>
    ({
      TH: `รอบบิล • ส่วนลดรายปี (${Math.round(annual * 100)}%) • คูปอง (${mode === "stack" ? "ลดเพิ่มสูงสุด 30%" : "แทนที่ส่วนลดรายปี"})`,
      EN: `Billing • Annual discount (${Math.round(annual * 100)}%) • Coupons (${mode === "stack" ? "stack up to 30%" : "replace annual discount"})`,
      CN: `结算周期 • 年付折扣（${Math.round(annual * 100)}%）• 优惠券（${mode === "stack" ? "最高叠加至 30%" : "替代年付折扣"}）`,
    }[lang]),
  monthly: { TH: "รายเดือน", EN: "Monthly", CN: "月付" },
  annual: { TH: "รายปี", EN: "Annual", CN: "年付" },
  off: { TH: "ลด", EN: "OFF", CN: "折" },
  couponPH: {
    TH: "ใส่โค้ดคูปอง (WELCOME15 / LAUNCH20 / EDU20)",
    EN: "Enter coupon (WELCOME15 / LAUNCH20 / EDU20)",
    CN: "输入优惠码（WELCOME15 / LAUNCH20 / EDU20）",
  },
  applyCoupon: { TH: "ใช้คูปอง", EN: "Apply", CN: "使用" },
  couponEmpty: {
    TH: "กรุณาใส่โค้ดคูปอง",
    EN: "Please enter a coupon code",
    CN: "请输入优惠码",
  },
  couponInvalid: { TH: "คูปองไม่ถูกต้อง", EN: "Invalid coupon", CN: "无效的优惠码" },

  chooserTitle: { TH: "ตัวช่วยเลือกแพ็กเกจ", EN: "Plan chooser", CN: "套餐选择助手" },
  teamSize: { TH: "ขนาดทีม (คน)", EN: "Team size (people)", CN: "团队人数" },
  posts: { TH: "โพสต์/เดือน", EN: "Posts / month", CN: "每月帖子数" },
  needIntegr: { TH: "ต้องการ Integrations", EN: "Need integrations", CN: "需要集成" },
  needComp: { TH: "มีข้อกำกับ/Compliance", EN: "Regulated / compliance", CN: "有监管/合规" },
  budget: { TH: "งบ/เดือน (THB)", EN: "Budget / month (THB)", CN: "每月预算（泰铢）" },
  sysRec: { TH: "คำแนะนำของระบบ", EN: "Recommended", CN: "系统推荐" },

  // PricingCard labels
  cardLabels: (lang: Lang) => ({
    perMonth: { TH: " / เดือน", EN: " / mo", CN: " / 月" }[lang],
    perYear: { TH: " / ปี", EN: " / yr", CN: " / 年" }[lang],
    badgeMonthly: (off: number) =>
      ({
        TH: `รายเดือน ${off}%${TXT.off.TH}`,
        EN: `Monthly ${off}% ${TXT.off.EN}`,
        CN: `月付 ${off}%${TXT.off.CN}`,
      }[lang]),
    badgeAnnual: (off: number) =>
      ({
        TH: `รายปี ลด ${off}%`,
        EN: `Annual ${off}% OFF`,
        CN: `年付 ${off}%折`,
      }[lang]),
    cta: { TH: "สมัครใช้งาน / ชำระเงิน", EN: "Subscribe / Checkout", CN: "订阅 / 结算" }[lang],
    vat: { TH: "*ราคายังไม่รวม VAT 7%", EN: "*Prices exclude 7% VAT", CN: "*价格不含 7% VAT" }[lang],
  }),

  // Cloud card labels
  aws: { TH: "Amazon Web Services", EN: "Amazon Web Services", CN: "Amazon Web Services" },
  ali: { TH: "Alibaba Cloud", EN: "Alibaba Cloud", CN: "阿里云" },
  azure: { TH: "Microsoft Azure", EN: "Microsoft Azure", CN: "微软 Azure" },

  // On-premise
  contactSales: { TH: "ติดต่อฝ่ายขาย", EN: "Contact sales", CN: "联系销售" },
  bookDemo: {
    TH: "นัดเดโม / ขอใบเสนอราคา",
    EN: "Book a demo / Quote",
    CN: "预约演示 / 索取报价",
  },
};

/** ---------- Chat Assistant Shortcuts (chips) ---------- **/
function getQuickChips(lang: Lang) {
  return [
    { href: "#features", label: { TH: "ฟีเจอร์เด่น", EN: "Features", CN: "功能亮点" }[lang] },
    { href: "#pricing",  label: { TH: "ราคา/แพ็กเกจ", EN: "Pricing", CN: "价格方案" }[lang] },
    { href: "#cloud",    label: { TH: "คลาวด์", EN: "Cloud", CN: "云部署" }[lang] },
    { href: "#security", label: { TH: "ความปลอดภัย", EN: "Security", CN: "安全合规" }[lang] },
  ];
}

function chipsToMarkup(chips: { href: string; label: string }[]) {
  // AiAgent renders [[#anchor|label]] as interactive chips
  return chips.map((c) => `[[${c.href}|${c.label}]]`).join(" ");
}

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

function Hero({ lang }: { lang: Lang }) {
  return (
    <section className="relative py-12 md:py-16">
      <div className="mx-auto max-w-6xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] text-white/70">
          <span className="inline-block size-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
          {TXT.heroPill[lang]}
        </div>
        <h1 className="mt-5 text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_0_30px_rgba(34,211,238,.25)]">
          {TXT.heroTitle[lang]}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-white/70">
          {TXT.heroSub[lang]}
        </p>
      </div>
    </section>
  );
}

function DemoVideo() {
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
            <video className="absolute inset-0 h-full w-full" controls playsInline preload="metadata" poster="/video-poster.jpg">
              <source src={url} />
            </video>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------- Real-photo Feature Highlights ---------- */
function FeatureHighlightsReal({ lang }: { lang: Lang }) {
  const features = TXT.features[lang];
  return (
    <section id="features" className="relative py-12 md:py-16">
      <SectionHeader title={TXT.featuresTitle[lang]} subtitle={TXT.featuresSub[lang]} />
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, idx) => (
          <article key={idx} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.img} alt={f.alt} className="h-44 md:h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
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

/* ---------- Cloud / Compliance ---------- */
function CloudSupport({ lang }: { lang: Lang }) {
  return (
    <section id="cloud" className="relative py-12 md:py-16">
      <SectionHeader title={TXT.cloudTitle[lang]} subtitle={TXT.cloudSub[lang]} />
      <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-6">
        <CloudCard label={TXT.aws[lang]}>
          <CloudLogo
            primary="/images/aws.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
            alt="AWS"
          />
        </CloudCard>
        <CloudCard label={TXT.ali[lang]}>
          <CloudLogo
            primary="/images/alibaba.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/1/1d/Alibaba_Cloud_logo.svg"
            alt="Alibaba Cloud"
          />
        </CloudCard>
        <CloudCard label={TXT.azure[lang]}>
          <CloudLogo
            primary="/images/azure.svg"
            fallback="https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg"
            alt="Microsoft Azure"
          />
        </CloudCard>
      </div>
      <p className="mt-4 text-center text-white/60 text-sm">
        * CI/CD & IaC (Terraform) available; choose region/network per policy.
      </p>
    </section>
  );
}
function CloudCard({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md grid place-items-center">
      <div className="h-16 w-36 grid place-items-center">{children}</div>
      <div className="mt-3 text-sm text-white/80">{label}</div>
    </div>
  );
}
function CloudLogo({ primary, fallback, alt }: { primary: string; fallback: string; alt: string }) {
  const [src, setSrc] = useState(primary);
  return <img src={src} alt={alt} onError={() => setSrc(fallback)} className="max-h-12 w-auto object-contain opacity-90" loading="lazy" />;
}

function Compliance({ lang }: { lang: Lang }) {
  const items = TXT.secItems[lang];
  return (
    <section id="security" className="relative py-12 md:py-16">
      <SectionHeader title={TXT.secTitle[lang]} subtitle={TXT.secSub[lang]} />
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

/** ---------- PricingCard (i18n) ---------- **/
function PricingCard({
  name,
  monthly,
  billingCycle,
  annualDiscountBase,
  couponExtra,
  couponMode,
  checkoutHref,
  features,
  labels,
  highlight = false,
}: {
  name: string;
  monthly: number;
  billingCycle: BillingCycle;
  annualDiscountBase: Discount;
  couponExtra: number;
  couponMode: CouponMode;
  checkoutHref: string;
  features: string[];
  labels: {
    perMonth: string;
    perYear: string;
    badgeMonthly: (offPercent: number) => string;
    badgeAnnual: (offPercent: number) => string;
    cta: string;
    vat: string;
  };
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
    return couponExtra || 0;
  }, [billingCycle, annualDiscountBase, couponExtra, couponMode]);

  const price = useMemo(() => {
    if (billingCycle === "monthly") return `${formatTHB(Math.round(monthly * (1 - effectiveDiscount)))}${labels.perMonth}`;
    return `${formatTHB(annualPrice(monthly, effectiveDiscount))}${labels.perYear}`;
  }, [billingCycle, monthly, effectiveDiscount, labels]);

  const badge =
    billingCycle === "annual"
      ? labels.badgeAnnual(Math.round(effectiveDiscount * 100))
      : effectiveDiscount > 0
      ? labels.badgeMonthly(Math.round(effectiveDiscount * 100))
      : labels.badgeMonthly(0).replace(/\s?0%.*$/,"");

  return (
    <div className={`relative rounded-2xl border bg-white/5 backdrop-blur-md p-6 ${highlight ? "border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,.25)]" : "border-white/10"}`}>
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
      <a href={checkoutHref} className={`mt-6 block w-full text-center rounded-xl px-4 py-2.5 text-sm font-medium ${highlight ? "bg-cyan-400/90 text-black hover:bg-cyan-300" : "bg-white/10 text-white hover:bg-white/20"}`}>
        {labels.cta}
      </a>
      <div className="mt-3 text-[12px] text-white/50">{labels.vat}</div>
    </div>
  );
}

/** ---------- Pricing + Chooser (i18n) ---------- **/
function PricingAndChooser({
  couponMode,
  checkoutBase,
  lang,
}: {
  couponMode: CouponMode;
  checkoutBase: CheckoutBase;
  lang: Lang;
}) {
  // i18n labels for card
  const L = TXT.cardLabels(lang);

  // plan features per language
  const PLAN_FEATURES: Record<Lang, Record<PlanKey, string[]>> = {
    TH: {
      essential: ["CMS Core", "AI Content Generator", "AI Image Suggestion", "SEO Assist", "Starter Templates", "Easy Dashboard"],
      pro: ["รวม Essential ทั้งหมด", "AI Personalization", "AI Translation", "Workflow Automation", "Social & E-Commerce", "Analytics & Reports"],
      enterprise: ["รวม Pro ทั้งหมด", "Omni-Channel Publishing", "Advanced AI Analytics", "API (ERP/CRM) Integration", "RBAC (สิทธิ์หลายระดับ)", "SLA & 24/7 Support"],
    },
    EN: {
      essential: ["CMS Core", "AI Content Generator", "AI Image Suggestion", "SEO Assist", "Starter Templates", "Easy Dashboard"],
      pro: ["Everything in Essential", "AI Personalization", "AI Translation", "Workflow Automation", "Social & E-Commerce", "Analytics & Reports"],
      enterprise: ["Everything in Pro", "Omni-Channel Publishing", "Advanced AI Analytics", "API (ERP/CRM) Integration", "RBAC (granular roles)", "SLA & 24/7 Support"],
    },
    CN: {
      essential: ["CMS 核心", "AI 内容生成", "AI 图片建议", "SEO 助手", "模板即用", "易用仪表盘"],
      pro: ["含 Essential 全部功能", "AI 个性化", "AI 翻译", "流程自动化", "社媒与电商集成", "分析与报表"],
      enterprise: ["含 Pro 全部功能", "全渠道分发", "高级 AI 分析", "API（ERP/CRM）集成", "RBAC（细粒度权限）", "SLA 与 7×24 支持"],
    },
  };

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

  const COUPONS: Record<string, number> = { WELCOME15: 0.15, LAUNCH20: 0.2, EDU20: 0.2 };
  const couponExtra = COUPONS[coupon.toUpperCase()] ?? 0;

  function applyCoupon() {
    const code = coupon.toUpperCase().trim();
    if (!code) return setCouponMsg(TXT.couponEmpty[lang]);
    setCouponMsg(
      COUPONS[code]
        ? (lang === "TH"
            ? `ใช้คูปอง "${code}" สำเร็จ: ลดเพิ่ม ${(COUPONS[code] * 100).toFixed(0)}%`
            : lang === "EN"
            ? `Applied "${code}": extra ${(COUPONS[code] * 100).toFixed(0)}% off`
            : `已使用 “${code}”：额外 ${(COUPONS[code] * 100).toFixed(0)}%`)
        : TXT.couponInvalid[lang]
    );
  }

  const basePath = checkoutBase === "stripe" ? "/checkout/stripe" : "/checkout/promptpay";

  return (
    <section id="pricing" className="relative py-12 md:py-16">
      <SectionHeader title={TXT.pricingTitle[lang]} subtitle={TXT.pricingSub(annualDiscount, couponMode, lang)} />

      {/* Billing & Coupon */}
      <div className="mx-auto max-w-6xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className={`px-4 py-2 rounded-xl text-sm ${billing === "monthly" ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:text-white"}`} onClick={() => setBilling("monthly")}>
            {TXT.monthly[lang]}
          </button>
          <button className={`px-4 py-2 rounded-xl text-sm ${billing === "annual" ? "bg-white/15 text-white" : "bg-white/5 text-white/70 hover:text-white"}`} onClick={() => setBilling("annual")}>
            {TXT.annual[lang]}
          </button>
          {billing === "annual" && (
            <div className="ml-3 inline-flex rounded-2xl bg-white/10 p-1">
              {[0.15, 0.2].map((d) => (
                <button key={d} onClick={() => setAnnualDiscount(d as Discount)} className={`px-3 py-1.5 rounded-lg text-xs ${annualDiscount === d ? "bg-emerald-400/80 text-black" : "text-white/80 hover:text-white"}`}>
                  {TXT.off[lang]} {Math.round(d * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-2 py-1.5">
            <input className="bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none px-2" placeholder={TXT.couponPH[lang]} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button onClick={applyCoupon} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-400/90 text-black hover:bg-cyan-300">
              {TXT.applyCoupon[lang]}
            </button>
          </div>
        </div>
      </div>
      {couponMsg && <div className="mx-auto max-w-6xl -mt-6 mb-6 text-sm text-emerald-200">{couponMsg}</div>}

      {/* Pricing Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-4 gap-6">
        <PricingCard
          name={lang === "EN" ? "Essential" : lang === "CN" ? "Essential" : "Essential"}
          monthly={BASE_MONTHLY.essential}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={couponExtra}
          couponMode={couponMode}
          checkoutHref={`${basePath}?plan=essential`}
          features={PLAN_FEATURES[lang].essential}
          labels={L}
        />
        <PricingCard
          name={lang === "EN" ? "Pro" : lang === "CN" ? "Pro" : "Pro"}
          monthly={BASE_MONTHLY.pro}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={couponExtra}
          couponMode={couponMode}
          checkoutHref={`${basePath}?plan=pro`}
          features={PLAN_FEATURES[lang].pro}
          labels={L}
          highlight
        />
        <PricingCard
          name={lang === "EN" ? "Enterprise (Cloud)" : lang === "CN" ? "Enterprise（云）" : "Enterprise (Cloud)"}
          monthly={BASE_MONTHLY.enterprise}
          billingCycle={billing}
          annualDiscountBase={annualDiscount}
          couponExtra={couponExtra}
          couponMode={couponMode}
          checkoutHref={`${basePath}?plan=enterprise`}
          features={PLAN_FEATURES[lang].enterprise}
          labels={L}
        />
        {/* On-Prem box */}
        <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
          <h3 className="text-xl font-semibold text-white">On-Premise</h3>
          <div className="mt-3 text-2xl font-semibold text-white">{TXT.contactSales[lang]}</div>
          <ul className="mt-5 space-y-2 text-white/80 text-sm">
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Deploy in your DC</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />SSO/AD, Custom SLA</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Security/Compliance Review</li>
            <li className="flex items-start gap-2"><span className="mt-1 size-1.5 rounded-full bg-emerald-400/80" />Migration & Training</li>
          </ul>
          <a href="mailto:sales@codediva.co.th?subject=ขอใบเสนอราคา%20On-Premise%20ContentFlow%20AI%20Suite" className="mt-6 block w-full text-center rounded-xl px-4 py-2.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20">
            {TXT.bookDemo[lang]}
          </a>
          <div className="mt-3 text-[12px] text-white/50">{L.vat}</div>
        </div>
      </div>

      {/* Chooser */}
      <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
        <h4 className="text-lg font-semibold text-white">{TXT.chooserTitle[lang]}</h4>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <label className="flex flex-col text-white/80">{TXT.teamSize[lang]}
            <input type="number" min={1} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
              value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="flex flex-col text-white/80">{TXT.posts[lang]}
            <input type="number" min={0} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
              value={posts} onChange={(e) => setPosts(parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="flex items-center gap-2 text-white/80">
            <input type="checkbox" className="size-4 accent-emerald-400" checked={needIntegrations} onChange={(e) => setNeedIntegrations(e.target.checked)} />
            {TXT.needIntegr[lang]}
          </label>
          <label className="flex items-center gap-2 text-white/80">
            <input type="checkbox" className="size-4 accent-emerald-400" checked={needCompliance} onChange={(e) => setNeedCompliance(e.target.checked)} />
            {TXT.needComp[lang]}
          </label>
          <label className="flex flex-col text-white/80">{TXT.budget[lang]}
            <input type="number" min={0} className="mt-1 rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-white"
              value={budget} onChange={(e) => setBudget(parseInt(e.target.value || "0", 10))} />
          </label>
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-white/90">
          <div className="text-sm">{TXT.sysRec[lang]}</div>
          <div className="mt-1 text-lg font-semibold">
            {rec.plan === "essential" && "✅ Essential"}
            {rec.plan === "pro" && "✅ Pro"}
            {rec.plan === "enterprise" && "✅ Enterprise (Cloud/On-Prem)"}
          </div>
          <ul className="mt-2 text-sm list-disc pl-5 text-white/70">
            {rec.reasons.map((r, i) => (<li key={i}>{r}</li>))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** ---------- Page ---------- **/
export default function HomePage() {
  const lang = useLangFromPath();
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

  // Seed chat assistant with page-specific shortcut chips (no-op if AiAgent doesn't listen)
  useEffect(() => {
    const chips = getQuickChips(lang);
    const chipMsg = chipsToMarkup(chips);
    const greeting = (
      lang === "TH"
        ? `เลือกดูส่วนที่สนใจได้เลย → ${chipMsg}`
        : lang === "EN"
        ? `Quick jump to a section → ${chipMsg}`
        : `快速跳转到版块 → ${chipMsg}`
    );

    // Dispatch a custom event; AiAgent can subscribe to 'cf:aiagent:seed'
    try {
      window.dispatchEvent(new CustomEvent("cf:aiagent:seed", {
        detail: { chips, initialMessage: greeting },
      }));
    } catch {}
  }, [lang]);

  return (
    <main className="relative min-h-screen text-white">
      <DarkNeonBg />
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <Hero lang={lang} />
        <DemoVideo />
        <FeatureHighlightsReal lang={lang} />
        <CloudSupport lang={lang} />
        <Compliance lang={lang} />
        <PricingAndChooser couponMode={couponMode} checkoutBase={checkoutBase} lang={lang} />
      </div>
      <AiAgent />
    </main>
  );
}