import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { itemType, itemId, term } = await req.json();
    if (!itemType || !itemId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

    const ua = req.headers.get("user-agent") || undefined;
    const ref = req.headers.get("referer") || undefined;
    if (!ref.includes("/?q=")) return NextResponse.json({ ok: true });
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      (req as any).ip ||
      undefined;

    await prisma.clickLog.create({
      data: { itemType, itemId, term: term?.slice(0, 128), ip, userAgent: ua, referer: ref },
    });

    // ตอบไว ๆ ไม่ต้องรออะไร
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: true }); // เงียบ ๆ ไม่ให้ขัด UX
  }
}
