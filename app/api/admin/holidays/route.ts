import { NextResponse } from "next/server";
import * as ical from "node-ical";

// Calendar ID ของ Google “Holidays in Thailand” (ภาษาอังกฤษ)
const CAL_ID_EN = "en.th.official#holiday@group.v.calendar.google.com";
// ใช้ภาษาไทยโดยเปลี่ยน prefix ตามแพทเทิร์นของ Google (ถ้าอยากได้ชื่อวันหยุดเป็นไทย)
const CAL_ID_TH = "th.th#holiday@group.v.calendar.google.com";

// สร้าง URL ของไฟล์ ICS (public)
function icsUrl(lang: string) {
  const id = lang === "th" ? CAL_ID_TH : CAL_ID_EN;
  return `https://calendar.google.com/calendar/ical/${encodeURIComponent(id)}/public/basic.ics`;
}

export const dynamic = "force-dynamic";
// cache ICS 6 ชม. เพื่อลดการยิงซ้ำ
const REVALIDATE_SECONDS = 6 * 60 * 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = (searchParams.get("lang") || "th").toLowerCase(); // "th" | "en"
    const startStr = searchParams.get("start"); // YYYY-MM-DD
    const endStr = searchParams.get("end");     // YYYY-MM-DD

    // default: ปีปัจจุบันทั้งปี (โซนเวลาไทย)
    const now = new Date();
    const y = now.getFullYear();
    const start = startStr ? new Date(startStr + "T00:00:00+07:00") : new Date(`${y}-01-01T00:00:00+07:00`);
    const end = endStr ? new Date(endStr + "T23:59:59+07:00") : new Date(`${y}-12-31T23:59:59+07:00`);

    const url = icsUrl(lang);
    const icsText = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } }).then(r => r.text());

    // แปลง ICS -> JSON
    const data = ical.parseICS(icsText);

    // ดึง VEVENT ทั้งหมด แล้ว map เฉพาะช่วงวันที่ขอ
    const items: Array<{
      date: string;          // YYYY-MM-DD
      title: string;         // ชื่อวันหยุด
      start: string;         // ISO datetime
      end: string;           // ISO datetime (DTEND ของ ICS มักเป็น exclusive)
      allDay: boolean;
      uid?: string;
      location?: string | null;
      description?: string | null;
    }> = [];

    for (const k of Object.keys(data)) {
      const ev = data[k] as any;
      if (!ev || ev.type !== "VEVENT") continue;

      // DTSTART / DTEND
      const s = ev.start instanceof Date ? ev.start : new Date(ev.start);
      const e = ev.end   instanceof Date ? ev.end   : new Date(ev.end);

      // กรองช่วงเวลา
      if (e < start || s > end) continue;

      // all-day holiday ส่วนมากเป็นวันเดียว (DTEND exclusive -> ไม่ต้อง -1 วันก็ได้ถ้าใช้ start แสดง)
      const dayStr = new Date(s).toISOString().slice(0, 10);

      items.push({
        date: dayStr,
        title: ev.summary || ev.description || "Holiday",
        start: s.toISOString(),
        end: e.toISOString(),
        allDay: !!ev.datetype || true,
        uid: ev.uid,
        location: ev.location || null,
        description: ev.description || null,
      });
    }

    // จัดเรียงตามวันที่
    items.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      source: "google_calendar_ics",
      lang,
      start: start.toISOString(),
      end: end.toISOString(),
      count: items.length,
      items,
    });
  } catch (e) {
    console.error("GET /api/admin/holidays error:", e);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
