// app/api/admin/website/select/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const websiteId = body?.websiteId as string | null | undefined;

  const res = NextResponse.json({ ok: true });
  if (websiteId) {
    res.cookies.set("websiteId", websiteId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  } else {
    // clear cookie
    res.cookies.set("websiteId", "", { path: "/", maxAge: 0, sameSite: "lax" });
  }
  return res;
}
