// prisma/seed.js (CommonJS)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/** seed admin user */
async function seedAdmin() {
  const email = "admin@codediva.co.th".trim().toLowerCase();
  const plain = "Test@123";
  const passwordHash = await bcrypt.hash(plain, 10);

  const admin = await prisma.user.upsert({
    where: { email },        // prisma schema has @unique on email
    update: {
      // ถ้ารันซ้ำ จะไม่แก้ไข role/name โดยอัตโนมัติ เว้นแต่ต้องการ reset password
      // comment บรรทัดต่อไปหากไม่ต้องการ reset password ทุกครั้ง
      passwordHash,
    },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      passwordHash,
    },
    select: { id: true, email: true, role: true },
  });

  console.log(`✅ Admin user ready: ${admin.email} (role=${admin.role})`);
}

/** ---------- main ---------- */
(async () => {
  try {
    await seedAdmin();
    console.log("🎉 All seeds completed");
    process.exit(0);
  } catch (e) {
    console.error("Seed error:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();