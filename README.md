# ContentFlow AI Suite (contentflow-cms)

AI-powered content platform for Thai SMEs & enterprises — สร้าง/แปล/เผยแพร่/วัดผล ได้เร็วขึ้นด้วยผู้ช่วย AI  
โปรเจ็กต์นี้คือ **Frontend (Next.js App Router + TypeScript + Tailwind)** พร้อม **AI Agent**, **i18n แบบ path** (`/en`, `/th`, `/cn`), **หน้า Marketing ครบ**, **Careers**, และ **แผง Admin (ป้องกันด้วย NextAuth)**

> *สั้น ๆ*: **ContentFlow CMS** = โปรเจ็กต์นี้

---

## 1) แนวคิด & เป้าหมาย

- **All‑in‑one Content Suite**: Editor, Automation, Analytics highlights, Localization, Social/E‑commerce (UI stubs) และสัญญาณความน่าเชื่อถือระดับองค์กร
- **UX ลื่นไหล**: โทน dark‑neon, ใช้ภาพจริง (โฟกัสผู้ใช้เอเชีย), responsive, เข้าถึงได้ (a11y)
- **Enterprise‑ready**: PDPA/Consent wording, Security & Compliance section, Cloud Support (AWS/Azure/Alibaba) พร้อม SVG/fallback
- **AI Everywhere**: Floating **AI Agent** ปุ่มทรงอนาคต (orb) + แชต `/api/ai-agent`

---

## 2) ภาพรวมสถาปัตยกรรม

**Stack**: Next.js 14+ (App Router) • TypeScript • Tailwind CSS  
**Auth**: NextAuth (Credentials + OAuth: Google, Azure AD/B2C)  
**i18n**: Path‑based `/en`, `/th`, `/cn` (ตัวสลับภาษาแบบ overlay ปุ่มธง)  
**AI**: Client widget + API route (`/api/ai-agent` ใช้ `OPENAI_API_KEY`)  
**FX**: Particle Orb (2D/3D) สำหรับปุ่ม/ออร่า AI

```
app/
  ├─ (lang)/
  │   ├─ en/  ┆ page.tsx           # หน้า EN
  │   ├─ th/  ┆ page.tsx           # หน้า TH (default)
  │   └─ cn/  ┆ page.tsx           # หน้า CN
  ├─ components/
  │   ├─ SiteHeader.tsx            # Header: sticky, highlight ตามสโครล, overlay สลับภาษา
  │   ├─ SiteFooter.tsx            # Footer: กว้างเท่า header, bottom divider, social, overlay ภาษา
  │   ├─ ClientLangLayout.tsx      # ห่อ header/footer ให้รับภาษาเดียวกับหน้า
  │   └─ ...
  ├─ widgets/
  │   ├─ AiAgent.tsx               # ปุ่ม orb + แผงแชต AI
  │   ├─ ParticleOrb2D.tsx         # 2D canvas orb (ดีฟอลต์)
  │   └─ ParticleOrb3D.tsx         # 3D Three.js orb (ออปชัน)
  ├─ careers/
  │   ├─ page.tsx                  # รายการงาน
  │   ├─ [id]/page.tsx             # รายละเอียดงาน (ใช้ SiteHeader/SiteFooter เดียวกัน)
  │   └─ _data.ts                  # ข้อมูลงาน
  ├─ about/ | docs/ | policy/ | terms/ | pdpa/ | security/ | sitemap/
  │   └─ page.tsx                  # เพจคงที่ธีมเดียวกับหน้าแรก
  ├─ admin/
  │   ├─ (auth)/login/page.tsx     # หน้าเข้าสู่ระบบ Admin
  │   └─ ...                       # หน้าฝั่ง Admin ที่ป้องกันด้วย middleware
  ├─ api/
  │   └─ ai-agent/route.ts         # Endpoint แชต AI (ต้องมี OPENAI_API_KEY)
  ├─ layout.tsx                    # ฟอนต์/ธีม/โครงร่าง html
  ├─ globals.css                   # Tailwind + โทน dark-neon
  └─ page.tsx                      # entry (อาจ redirect ไปภาษาค่าเริ่มต้น)
middleware.ts                       # ป้องกัน /admin & /api/admin
public/
  ├─ images/
  │   ├─ aws.svg  azure.svg  alibaba.svg
  │   └─ client-logos/* (ถ้ามี)
  └─ logo.png
```

> **Header/Footer** ใช้ container เดียวกัน (`max-w-7xl`) — footer มีเส้นแบ่งล่าง + ปุ่มภาษา overlay (ธง TH/EN/CN)

---

## 3) ฟีเจอร์หลัก

### Marketing Home
- **Hero** + **DemoVideo** (YouTube หรือ `<video>` self‑host)
- **Feature Highlights (ภาพจริง โทนมืออาชีพ)**: 6 การ์ด (AI Editor, Localization, Analytics, Workflow, E‑commerce/Social, Security & RBAC)
- **Cloud Support**: AWS / Azure / Alibaba — ใช้โลคัล **SVG** + fallback URL
- **TrustedBy**: พาร์ตเนอร์/ลูกค้า + Testimonial
- **Security & Compliance**: PDPA/Consent + แนวทางความปลอดภัย (ISO/IEC 27001 readiness, SOC 2 wording)
- **Pricing + Plan Chooser**: 3 แพลน, รายเดือน/รายปี, คูปอง stack/replace (cap), ตัวช่วยเลือกแพลนแบบ Interactive  
  ↳ คำ/ปุ่ม/คำอธิบาย **แปล 3 ภาษา** ครบ (TH/EN/CN)

### AI Agent
- ปุ่ม **orb** เปิด/ปิดแชต
- เชื่อม `/api/ai-agent` (ต้องตั้ง `OPENAI_API_KEY`)
- ปรับ persona/behavior ได้ใน component/route

### Careers
- Index + Job detail, Quick facts, Responsibilities/Requirements, Hiring process
- CTA “Apply via Email” พร้อม subject/body template
- ใช้ SiteHeader/SiteFooter ชุดเดียวกับหน้าแรก

### i18n
- Path‑based: `/th` (default), `/en`, `/cn`
- สลับภาษาด้วยปุ่มวงกลมเดียว (overlay ธง)
- Header/Footer/ป้ายเมนู/ปุ่ม/ข้อความย่อยผูกกับ dictionary ตามภาษา

---

## 4) การตั้งค่าแวดล้อม (Environment)

สร้าง `.env.local`:

```ini
NEXT_PUBLIC_BASE_URL=http://localhost:4000
OPENAI_API_KEY=sk-...

# NextAuth
NEXTAUTH_URL=http://localhost:4000
NEXTAUTH_SECRET=your-long-random-string

# OAuth (ถ้าใช้)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...

# DATABASE_URL=postgresql://user:pass@host:5432/db   # ถ้าใช้ DB adapter
```

> ถ้าเปิด OAuth จริง ควรเพิ่ม DB Adapter + `DATABASE_URL` ให้ครบ

---

## 5) การเริ่มพัฒนา (Dev)

ต้องการ Node 18+ (หรือ 20+) และ **pnpm** / yarn / npm

```bash
pnpm install
pnpm dev          # http://localhost:4000
pnpm typecheck
pnpm lint
pnpm build
pnpm start
```

> พอร์ตดีฟอลต์ 4000 (แก้ได้จาก env/scripts)

---

## 6) Routing & Middleware

### Admin Guard

```ts
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  callbacks: {
    authorized: ({ token, req }) => {
      const p = req.nextUrl.pathname;
      if (p.startsWith("/admin/login")) return true; // กัน loop
      const isAdmin = p.startsWith("/admin") || p.startsWith("/api/admin");
      return isAdmin ? !!token : true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
```

### i18n by Path
- ใช้โครง `(lang)/{th|en|cn}` + `ClientLangLayout` ให้ header/footer รับภาษาเดียวกับหน้า
- ลิงก์ภายในคง locale เดิม + รองรับ anchor `#features/#pricing/#cloud/#security`

---

## 7) หมายเหตุด้าน UI

- Tailwind + Dark‑neon BG (div หลายชั้น)
- Font: `Noto Sans Thai` (ประกาศใน `layout.tsx`)
- Header: sticky, rounded, highlight เมนูตาม section ที่กำลังมอง, ปุ่มภาษา overlay
- Footer: ความกว้างเท่า header (`max-w-7xl`), bottom divider, newsletter, social, ปุ่มภาษา overlay
- ปุ่มหลักมีไอคอนตกแต่ง (เฉพาะปุ่ม CTA)

---

## 8) Components สำคัญ

- **`widgets/AiAgent.tsx`** — ปุ่ม orb + แชต เรียก `/api/ai-agent`
- **`widgets/ParticleOrb2D.tsx`** — 2D orb (เบา/เสถียร)  
  *TS Tip*: เวลา `Object.assign(aura.style, {...})` หากชนกับ `CSSStyleDeclaration` ให้ cast:  
  `Object.assign(aura.style, {...} as unknown as CSSStyleDeclaration)`
- **`widgets/ParticleOrb3D.tsx`** — Three.js particle sphere (ต้องติดตั้ง `three`)
- **`CloudLogo`** — โลคัล SVG + onError fallback URL (กันโหลดไม่ติด)

---

## 9) Careers Data (ตัวอย่าง)

```ts
export type Job = {
  id: string;
  title: string;
  dept: string;
  level: "Junior" | "Mid" | "Senior" | "Lead";
  type: "Full-time" | "Contract" | "Intern";
  location: string;
  salaryHint?: string;
  summary: string;
  aboutTeam?: string;
  tags?: string[];
  requirements: { must: string[]; nice?: string[]; };
  applyEmail?: string;
};
```

---

## 10) Troubleshooting

- **CSSStyleDeclaration error** → ใช้ `as unknown as CSSStyleDeclaration`
- **NextAuth redirect loop** → อนุญาต `/admin/login` ใน callback แล้ว
- **Cloud SVG ไม่ขึ้น** → ตรวจ `public/images/aws.svg|azure.svg|alibaba.svg` มีจริง มิฉะนั้นจะใช้ fallback URL
- **i18n ไม่สลับ** → ตรวจ path (`/en` ฯลฯ) + ให้ header/footer รับ prop `lang` ตรงกับหน้า

---

## 11) Packaging โค้ดเป็น Zip (ออปชัน)

```bash
zip -r contentflow-cms-$(date +%Y%m%d-%H%M).zip . \
  -x "node_modules/*" ".next/*" ".git/*" ".env.local" "*.DS_Store"
```

---

## License

© Codediva Co., Ltd. All rights reserved.