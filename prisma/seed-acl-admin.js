// prisma/seed-acl-admin.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/** โครงเมนูเดียวกับ app/admin/(dashboard)/admin-nav.tsx */
const NAV = [
  { id: "home", children: [{ href: "/admin" }] },
  { id: "article", children: [{ href: "/admin/articles" }] },
  {
    id: "events-promotions",
    children: [
      { href: "/admin/events" },
      { href: "/admin/promotions" },
      { href: "/admin/categories" },
    ],
  },
  {
    id: "stores-tenants",
    children: [
      { href: "/admin/occupants" },
      { href: "/admin/tenants" },
    ],
  },
  { id: "tourist", children: [{ href: "/admin/tourist/landing" }] },
  { id: "careers", children: [{ href: "/admin/careers/new" }] },
  { id: "member", children: [{ href: "/admin/member/settings" }] },
  { id: "about", children: [{ href: "/admin/about-us/hero" }] },
  { id: "contact", children: [{ href: "/admin/contact-us/inbox" }] },
  { id: "users", children: [{ href: "/admin/users/invite" }] },
  { id: "logs", children: [{ href: "/admin/logs/export" }] },
];

async function main() {
  const websites = await prisma.website.findMany();
  if (!websites.length) {
    throw new Error("No websites found. Seed websites first.");
  }

  // ลบ rule เดิมของ ROLE:ADMIN เพื่อกันซ้ำ
  for (const w of websites) {
    await prisma.accessControl.deleteMany({
      where: { websiteId: w.id, subjectType: "ROLE", subjectId: "ADMIN" },
    });

    // 1) Rule ใหญ่สุด: ได้ทุกอย่างทุกทรัพยากรบนเว็บไซต์นี้
    const rows = [
      {
        websiteId: w.id,
        subjectType: "ROLE",
        subjectId: "ADMIN",
        resource: "*",
        action: "ALL",
        effect: "ALLOW",
      },
    ];

    // 2) Explicit เมนู (ให้ดูเมนู + เมนูย่อยทั้งหมด)
    for (const g of NAV) {
      rows.push({
        websiteId: w.id,
        subjectType: "ROLE",
        subjectId: "ADMIN",
        resource: `menu:${g.id}`,
        action: "VIEW_MENU",
        effect: "ALLOW",
      });
      for (const c of g.children) {
        rows.push({
          websiteId: w.id,
          subjectType: "ROLE",
          subjectId: "ADMIN",
          resource: `menu:${g.id}:${c.href}`,
          action: "VIEW_SUBMENU",
          effect: "ALLOW",
        });
      }
    }

    // (ออปชัน) ถ้าอยากกันอนาคตเมนูย่อยที่เพิ่มใหม่ ให้ rule ไวลด์การ์ดนี้ด้วย:
    rows.push({
      websiteId: w.id,
      subjectType: "ROLE",
      subjectId: "ADMIN",
      resource: "menu:*",
      action: "VIEW_SUBMENU",
      effect: "ALLOW",
    });

    await prisma.accessControl.createMany({ data: rows });
    console.log(`✅ Seeded ADMIN ACL for website: ${w.name} (${w.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
