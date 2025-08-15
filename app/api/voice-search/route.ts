// app/api/admin/voice-search/route.ts
import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// map ค่า lang ที่ UI ส่งมา → โค้ดภาษาที่โมเดลเข้าใจ
function normalizeLang(v: unknown): "th" | "en" | "zh" {
  const s = String(v || "").trim().toLowerCase();
  if (s.startsWith("en")) return "en";
  if (s.startsWith("cn") || s.startsWith("zh")) return "zh";
  return "th"; // ค่าเริ่มต้นเป็นไทย
}

// prompt เพื่อช่วยบริบทการถอดเสียงให้ใกล้เคียง use case
function promptByLang(lang: "th" | "en" | "zh") {
  if (lang === "en") return "Transcribe queries to search shops/brands/food at Future Park & ZPELL.";
  if (lang === "zh") return "将语音转写为在 Future Park 和 ZPELL 商场搜索店铺/品牌/餐饮的查询。";
  return "ถอดเสียงเพื่อใช้ค้นหาร้าน/แบรนด์/อาหารใน Future Park & ZPELL";
}

const PRIMARY_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe";
const FALLBACK_MODEL = "whisper-1";

const isTruthy = (v: unknown) => /^(1|true|yes|on)$/i.test(String(v || ""));

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const form = await req.formData();

    const lang = normalizeLang(form.get("lang"));
    const prompt = promptByLang(lang);

    // ---------- MOCK FLAG ----------
    const mock =
      isTruthy(url.searchParams.get("mock")) ||
      isTruthy(form.get("mock")) ||
      isTruthy(process.env.VOICE_SEARCH_MOCK);

    if (mock) {
      // TH → "รองเท้า", EN → "shoe", CN/zh → "苹果"
      const mockText = lang === "en" ? "shoe" : lang === "zh" ? "苹果" : "รองเท้า";
      return NextResponse.json({ text: mockText, mock: true });
    }
    // ---------- /MOCK FLAG ----------

    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

    // ลองด้วยโมเดลหลักก่อน
    try {
      const resp = await client.audio.transcriptions.create({
        file,               // รองรับ File/Blob โดยตรง
        model: PRIMARY_MODEL,
        language: lang,     // "th" | "en" | "zh"
        prompt,             // บริบทช่วยถอดคำเฉพาะ domain
        // temperature: 0,  // ถ้าต้องการสะกดคงที่
      });
      return NextResponse.json({ text: resp.text ?? "" });
    } catch (errPrimary: any) {
      // fallback whisper-1
      try {
        const resp = await client.audio.transcriptions.create({
          file,
          model: FALLBACK_MODEL,
          language: lang,
          prompt,
        });
        return NextResponse.json({ text: resp.text ?? "" });
      } catch (errFallback: any) {
        console.error("voice-search error (fallback):", errFallback);
        return NextResponse.json(
          { error: "transcription_failed", details: String(errFallback?.message || errFallback) },
          { status: 500 }
        );
      }
    }
  } catch (e: any) {
    console.error("voice-search error:", e);
    return NextResponse.json({ error: "transcription_failed" }, { status: 500 });
  }
}
