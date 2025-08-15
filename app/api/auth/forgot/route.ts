import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  // ป้องกัน user enumeration: ตอบ 200 เสมอ
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // ลบโทเค็นเก่า
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    // สร้างโทเค็นใหม่ 1 ชม.
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const link = `${base}/admin/reset/${token}`;

    // TODO: ส่งอีเมลจริง (Resend/SMTP)
    console.log("[RESET LINK]", link);
  }
  return NextResponse.json({ ok: true });
}
