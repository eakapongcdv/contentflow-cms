import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires < new Date()) {
    return NextResponse.json({ error: "Token invalid or expired" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: vt.identifier } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
