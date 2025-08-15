// prisma/seed-acl.js
const { PrismaClient, AclAction, AclEffect, AclSubject, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // เลือกเว็บไซต์สักอัน (หรือวนทุกเว็บ)
  const websites = await prisma.website.findMany({ take: 1 });
  if (!websites.length) throw new Error('No website found, seed websites first');
  const website = websites[0];

  // หาแอดมินอย่างน้อยหนึ่งคน
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) console.warn('No ADMIN user found; skip user-specific rules');

  // 1) สิทธิ์ระดับ ROLE (ADMIN = ทุกอย่าง)
  await prisma.accessControl.create({
    data: {
      websiteId: website.id,
      subjectType: 'ROLE',
      subjectId: 'ADMIN',   // อิง enum Role
      resource: '*',
      action: 'ALL',
      effect: 'ALLOW',
    },
  });

  // 2) สร้างกลุ่ม Editor ต่อเว็บไซต์
  const editorGroup = await prisma.userGroup.upsert({
    where: { websiteId_name: { websiteId: website.id, name: 'Editors' } },
    create: { websiteId: website.id, name: 'Editors' },
    update: {},
  });

  // (ตัวอย่าง) ใส่สมาชิกกลุ่ม (ถ้ามี user ปกติ)
  const anyUser = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (anyUser) {
    await prisma.userGroupMember.upsert({
      where: { groupId_userId: { groupId: editorGroup.id, userId: anyUser.id } },
      create: { groupId: editorGroup.id, userId: anyUser.id },
      update: {},
    });
  }

  // 3) สิทธิ์ของ Editors (เห็นเมนู Events & Promotions + CRUD promotions)
  // เมนูกลุ่ม
  await prisma.accessControl.createMany({
    data: [
      {
        websiteId: website.id,
        subjectType: 'GROUP',
        subjectId: editorGroup.id,
        resource: 'menu:events-promotions',
        action: 'VIEW_MENU',
        effect: 'ALLOW',
      },
      // เมนูย่อย
      {
        websiteId: website.id,
        subjectType: 'GROUP',
        subjectId: editorGroup.id,
        resource: 'menu:events-promotions:/admin/promotions',
        action: 'VIEW_SUBMENU',
        effect: 'ALLOW',
      },
      {
        websiteId: website.id,
        subjectType: 'GROUP',
        subjectId: editorGroup.id,
        resource: 'menu:events-promotions:/admin/events',
        action: 'VIEW_SUBMENU',
        effect: 'ALLOW',
      },
      // CRUD resource
      ...['CREATE','READ','UPDATE','DELETE'].map((action) => ({
        websiteId: website.id,
        subjectType: 'GROUP',
        subjectId: editorGroup.id,
        resource: 'res:promotions',
        action,
        effect: 'ALLOW',
      })),
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeded ACL rules');
}

main().catch(console.error).finally(() => prisma.$disconnect());
