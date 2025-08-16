// app/careers/_data.ts

export type Job = {
  id: string;
  title: string;
  dept: "Engineering" | "Product" | "Growth" | "Success";
  level: "Junior" | "Mid" | "Senior" | "Lead";
  type: "Full-time" | "Contract" | "Intern";
  location: "Bangkok · Hybrid" | "Remote (TH)" | "Remote (SEA)";
  tags: string[];
  summary: string;
  responsibilities: string[];
  requirements: {
    must: string[];
    nice?: string[];
  };
  aboutTeam?: string;
  salaryHint?: string;
  applyEmail?: string; // default: careers@codediva.co.th
};

// ✅ รวมประกาศงานไว้ที่เดียว ใช้ทั้งหน้า /careers และ /careers/[id]
export const JOBS: Job[] = [
  {
    id: "fe-next",
    title: "Frontend Engineer (Next.js)",
    dept: "Engineering",
    level: "Mid",
    type: "Full-time",
    location: "Bangkok · Hybrid",
    tags: ["Next.js", "TypeScript", "Tailwind", "RSC"],
    summary:
      "พัฒนาเว็บแอปคุณภาพสูงบน Next.js ร่วมออกแบบ UX กับ Product/Design โฟกัส performance, accessibility, และ DX",
    aboutTeam:
      "ทีม Frontend ทำงานร่วมกับ Product/Design แบบ cross-functional ใช้ Next.js App Router, TS, Tailwind, Vitest, Playwright",
    responsibilities: [
      "พัฒนา UI/UX บน Next.js (App Router, RSC) ให้มีประสิทธิภาพและคงคุณภาพโค้ด",
      "ทำงานร่วมกับ Designer/PM เพื่อแปลงดีไซน์และ requirement เป็นฟีเจอร์",
      "เชื่อมต่อ API/GraphQL, จัดการ state, error, loading ที่เป็นระบบ",
      "เขียนเทสพื้นฐาน (unit/e2e) และร่วมปรับปรุง DX/CI",
      "โค้ดรีวิว แบ่งปัน best practices ภายในทีม",
    ],
    requirements: {
      must: [
        "มีประสบการณ์ React/Next.js, TypeScript",
        "เข้าใจพื้นฐานเว็บ: semantics, a11y, responsive, performance",
        "คุ้นเคย Git, PR review และการทำงานเป็นทีม",
      ],
      nice: [
        "เคยใช้ App Router/RSC, SSR/ISR, Edge runtime",
        "มีประสบการณ์กับ Playwright/Vitest/RTL",
        "มีผลงาน OSS/บล็อก/พอร์ตโฟลิโอ",
      ],
    },
    salaryHint: "60–100K THB (ตามประสบการณ์)",
  },
  {
    id: "be-node",
    title: "Backend Engineer (Node/Prisma)",
    dept: "Engineering",
    level: "Senior",
    type: "Full-time",
    location: "Remote (TH)",
    tags: ["Node.js", "Prisma", "Postgres", "API"],
    summary:
      "ออกแบบและพัฒนา API, data model, jobs/queues และความปลอดภัยให้สอดคล้องมาตรฐานองค์กร",
    aboutTeam:
      "ทีม Backend รับผิดชอบ core service, DB schema, คิวงาน, observability และ security baseline",
    responsibilities: [
      "ออกแบบสคีมาและพัฒนา API (REST/GraphQL) ที่อ่านง่ายและปลอดภัย",
      "ดูแลฐานข้อมูล (Postgres/Prisma), migration, performance tuning",
      "สร้าง background jobs/queues, scheduling, และ telemetry",
      "ยกระดับความปลอดภัย (authz, input validation, rate limit, audit)",
      "ร่วมออกแบบสถาปัตยกรรมและแนวทาง CI/CD",
    ],
    requirements: {
      must: [
        "มีประสบการณ์ Node.js/TypeScript production",
        "คุ้นเคย Prisma/SQL และการออกแบบสคีมาอย่างเหมาะสม",
        "เข้าใจ security พื้นฐานสำหรับเว็บบริการ (OWASP, authz, logging)",
      ],
      nice: [
        "เคยใช้ gRPC, GraphQL, หรือ message queue",
        "มีประสบการณ์ on-call/SLA, SLO, tracing/monitoring",
      ],
    },
    salaryHint: "90–150K THB (ตามประสบการณ์)",
  },
  {
    id: "ai-engineer",
    title: "AI Engineer (LLM/Inference)",
    dept: "Engineering",
    level: "Mid",
    type: "Full-time",
    location: "Bangkok · Hybrid",
    tags: ["LLM", "RAG", "Prompting", "Vector DB"],
    summary:
      "ต่อยอดฟีเจอร์ AI: retrieval, evals, latency/throughput และอินทิเกรตกับระบบจริง",
    aboutTeam:
      "ทีม AI ทำงานเชื่อมกับ Backend/Frontend เน้น productization ของ LLM features",
    responsibilities: [
      "ออกแบบ/พัฒนา RAG, tools, คิวรีทรัพยากร และ pipeline ที่วัดผลได้",
      "ทำ evaluation (qual/quant), telemetry, guardrails",
      "ปรับรุ่น/โมเดล/พารามิเตอร์เพื่อความแม่น/เร่งเวลา inference",
      "อินทิเกรต AI features กับ UX จริงทำงานลื่น",
    ],
    requirements: {
      must: [
        "พื้นฐาน Python/Node หนึ่งอย่างขึ้นไป",
        "เข้าใจ vector DB, embeddings, chunking, caching",
        "สื่อสารการทดลอง/ผลลัพธ์เป็นระบบ",
      ],
      nice: [
        "เคยใช้งาน OpenAI/Anthropic/Bedrock/Azure OpenAI",
        "ประสบการณ์ fine-tuning/LoRA หรือ tools orchestration",
      ],
    },
    salaryHint: "80–130K THB (ตามประสบการณ์)",
  },
  {
    id: "product-designer",
    title: "Product Designer (UX/UI)",
    dept: "Product",
    level: "Mid",
    type: "Full-time",
    location: "Bangkok · Hybrid",
    tags: ["UX Research", "UI", "Design System", "Prototyping"],
    summary:
      "วิจัยผู้ใช้ ออกแบบโฟลว์/อินเทอร์เฟซ และสร้าง Design System ให้สอดคล้องแบรนด์",
    responsibilities: [
      "ทำ UX research: สัมภาษณ์/ทดสอบใช้งาน/สังเกตการณ์",
      "ออกแบบ user flow, wireframe, hi-fi mockup/prototype",
      "วาง Design System (components/tokens) และเอกสารอธิบาย",
      "ร่วมกับทีม dev เพื่อส่งมอบงานใช้งานได้จริง",
    ],
    requirements: {
      must: [
        "ผลงาน UX/UI ที่อธิบายเหตุผลการออกแบบชัดเจน",
        "คุ้นเคย Figma และการทำ prototype",
      ],
      nice: [
        "เข้าใจข้อจำกัดเทคนิค (web platform/React)",
        "ประสบการณ์ B2B/SaaS/Analytics dashboard",
      ],
    },
    salaryHint: "60–100K THB (ตามประสบการณ์)",
  },
  {
    id: "growth-marketer",
    title: "Growth Marketer",
    dept: "Growth",
    level: "Junior",
    type: "Full-time",
    location: "Remote (TH)",
    tags: ["SEO", "Paid Social", "Analytics", "Content"],
    summary:
      "วางกลยุทธ์การเติบโต ทำแคมเปญคอนเทนต์/โฆษณา และอ่านค่า analytics เพื่อ optimize",
    responsibilities: [
      "วางแผนคอนเทนต์, A/B test ข้อความ/ครีเอทีฟ",
      "ดูแล SEO on-page/off-page เบื้องต้น",
      "จัดการแคมเปญ paid social/SEM ตามงบประมาณ",
      "รายงานผลและข้อเสนอแนะเพื่อการเติบโต",
    ],
    requirements: {
      must: [
        "พื้นฐาน SEO/SEM หรือ Paid social อย่างน้อยหนึ่งด้าน",
        "ใช้เครื่องมือ analytics ได้ (GA4, Data Studio)",
      ],
      nice: ["คอนเทนต์/ครีเอทีฟได้, เข้าใจ B2B funnel"],
    },
    salaryHint: "35–60K THB (ตามประสบการณ์)",
  },
  {
    id: "cs-manager",
    title: "Customer Success Manager",
    dept: "Success",
    level: "Mid",
    type: "Full-time",
    location: "Bangkok · Hybrid",
    tags: ["Onboarding", "SLA", "Playbooks", "Upsell"],
    summary:
      "ช่วยลูกค้าใช้งานได้ผลลัพธ์สูงสุด วาง playbook และบริหารความพึงพอใจ/การต่ออายุ",
    responsibilities: [
      "ดูแล onboarding/enablement ให้ลูกค้าใช้งานได้คล่อง",
      "ติดตาม health/usage, จัดทำ playbook และรายงานผล",
      "ประสานงาน incident ตาม SLA, ร่วมวางแผน roadmap ฝั่งลูกค้า",
      "โอกาส upsell/cross-sell ที่เหมาะสม",
    ],
    requirements: {
      must: [
        "ทักษะสื่อสาร/ประสานงานดีมาก มีใจบริการ",
        "จัดการข้อมูล/รายงานอย่างเป็นระบบ",
      ],
      nice: ["ประสบการณ์ SaaS/MarTech/Analytics จะพิจารณาเป็นพิเศษ"],
    },
    salaryHint: "50–90K THB (ตามประสบการณ์)",
  },
];

export const jobIds = () => JOBS.map((j) => j.id);
export const getJobById = (id: string) => JOBS.find((j) => j.id === id);
export const defaultApplyEmail = "careers@codediva.co.th";
