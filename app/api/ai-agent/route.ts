import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Ensure Node.js runtime so we can read files from disk
export const runtime = "nodejs";

type KB = { raw: string; chunks: string[] };

declare global {
  // Cache the loaded CHATBOT.md across hot reloads / requests
  // eslint-disable-next-line no-var
  var __CHATBOT_MD__: KB | undefined;
}

function resolveKbPath(): string | null {
  const candidates = [
    "CHATBOT.md",
    "docs/CHATBOT.md",
    "app/CHATBOT.md",
    "README-CHATBOT.md",
  ].map((p) => path.join(process.cwd(), p));
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function chunkText(text: string, max = 1400): string[] {
  const sections = text.split(/\n(?=##\s)|\n(?=###\s)|\n---\n/g);
  const chunks: string[] = [];
  for (const s of sections) {
    if (!s) continue;
    if (s.length <= max) {
      chunks.push(s.trim());
      continue;
    }
    const paras = s.split(/\n{2,}/);
    let acc = "";
    for (const p of paras) {
      if (!p) continue;
      if ((acc + "\n\n" + p).length > max) {
        if (acc) chunks.push(acc.trim());
        if (p.length > max) {
          for (let i = 0; i < p.length; i += max) chunks.push(p.slice(i, i + max));
          acc = "";
        } else {
          acc = p;
        }
      } else {
        acc = acc ? acc + "\n\n" + p : p;
      }
    }
    if (acc) chunks.push(acc.trim());
  }
  return chunks.filter(Boolean);
}

function loadKB(): KB {
  if (globalThis.__CHATBOT_MD__) return globalThis.__CHATBOT_MD__!;
  let raw = "";
  const p = resolveKbPath();
  if (p) {
    try {
      raw = fs.readFileSync(p, "utf8");
      // eslint-disable-next-line no-console
      console.log(`[ai-agent] Loaded CHATBOT.md from: ${p} (length=${raw.length})`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ai-agent] Failed to read CHATBOT.md:", e);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn("[ai-agent] CHATBOT.md not found. Proceeding without KB.");
  }
  const chunks = raw ? chunkText(raw, 1400) : [];
  const kb = { raw, chunks };
  globalThis.__CHATBOT_MD__ = kb;
  return kb;
}

// Very small keyword scorer (naive retrieval)
const STOP = new Set([
  "the","a","an","and","or","for","of","to","with","is","are","in","on","at","by","as","that","this","these","those",
  "จาก","และ","หรือ","ของ","ที่","ใน","บน","เป็น","คือ","สำหรับ",
]);

function scoreChunks(q: string, chunks: string[], k = 6): string[] {
  const toks = (q || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));
  if (toks.length === 0) return chunks.slice(0, Math.min(k, chunks.length));
  const scored = chunks.map((c, i) => {
    const lc = c.toLowerCase();
    let s = 0;
    for (const t of toks) {
      const m = lc.split(t).length - 1;
      s += m;
    }
    if (/^#{1,3}\s/m.test(c)) s += 0.5; // prefer sections
    return { i, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, k).map(({ i }) => chunks[i]);
}

// Warm KB at module load (server start / first import)
const __KB_WARM = loadKB();

export async function POST(req: NextRequest) {
  try {
    const { messages = [] } = await req.json();
    const kb = loadKB();

    // Last user text for retrieval
    const lastUser = [...messages].reverse().find((m: any) => m?.role === "user")?.content ?? "";
    const snippets = kb.chunks.length ? scoreChunks(String(lastUser), kb.chunks, 6) : [];
    const kbPrompt = snippets.length
      ? `Knowledge base snippets from CHATBOT.md (use as trusted context, but keep answers concise and Thai-brand tone):\n\n-----\n${snippets.join("\n\n-----\n")}`
      : "No external KB loaded.";

    const sysBase = {
      role: "system",
      content: [
        "You are ContentFlow AI Suite assistant.",
        "Reply in Thai by default (use English only if user asks).",
        "Voice: professional, friendly, concise; avoid overselling; provide concrete steps.",
        "If question is about pricing, features, security, cloud, PDPA/consent, or industries, prefer details from the knowledge base.",
        "If unsure, say so briefly and propose next actions (เช่น แนะนำเดโมหรือเอกสาร).",
      ].join("\n"),
    } as const;

    const sysKB = { role: "system", content: kbPrompt } as const;

    const userMessages = (messages ?? []).filter((m: any) => m.role !== "system");

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [sysBase, sysKB, ...userMessages],
    } as const;

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
    return NextResponse.json({ reply, source: snippets.length ? "kb+llm" : "llm" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
