import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const sys = {
      role: "system",
      content:
        "You are ContentFlow AI Suite assistant. Answer in Thai for business users. Be concise, helpful, and trustworthy.",
    };
    const userMessages = (messages ?? []).filter((m: any) => m.role !== "system");
    const body = {
      model: "gpt-4o-mini",
      messages: [sys, ...userMessages],
      temperature: 0.3,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: `OpenAI error: ${resp.status} ${t}` }, { status: 500 });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "ขออภัย ฉันยังไม่มีคำตอบในขณะนี้ค่ะ";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
