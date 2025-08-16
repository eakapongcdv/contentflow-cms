// app/admin/(dashboard)/events/page.tsx
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import CalendarClient from "./CalendarClient";
import { Button, IconButton } from "@/app/components/ui/button";
import {
  Plus,
  RefreshCw,
  Search as SearchIcon,
  PencilLine,
} from "lucide-react";
import { Thumb } from "@/app/components/ui/thumb";
import { PaginationFooter } from "@/app/components/ui/pagination";

/* -------- date utils (SSR) -------- */
function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return stripTime(s);
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}
function endOfYear(d: Date) {
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}
function parseDateParam(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

type ViewMode = "day" | "week" | "month" | "year";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: { view?: ViewMode; date?: string };
}) {
  const view = (searchParams?.view as ViewMode) || "month";
  const baseDate = parseDateParam(searchParams?.date) || new Date();

  // กำหนดช่วงวันที่สำหรับดึง event ฝั่งเซิร์ฟเวอร์
  let rangeStart: Date;
  let rangeEnd: Date;
  if (view === "day") {
    rangeStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    rangeEnd = new Date(rangeStart);
    rangeEnd.setHours(23, 59, 59, 999);
  } else if (view === "week") {
    rangeStart = startOfWeek(baseDate);
    rangeEnd = endOfWeek(baseDate);
  } else if (view === "year") {
    rangeStart = startOfYear(baseDate);
    rangeEnd = endOfYear(baseDate);
  } else {
    rangeStart = startOfMonth(baseDate);
    rangeEnd = endOfMonth(baseDate);
  }

  // ดึงอีเวนต์ที่ทับซ้อนช่วง (overlap)
  const events = await prisma.event.findMany({
    where: { AND: [{ startDate: { lte: rangeEnd } }, { endDate: { gte: rangeStart } }] },
    orderBy: [{ startDate: "asc" }, { nameEn: "asc" }],
    take: 5000,
    select: {
      id: true,
      externalId: true,
      nameEn: true,
      nameTh: true,
      descriptionEn: true,
      descriptionTh: true,
      startDate: true,
      endDate: true,
      dailyStartTime: true,
      dailyEndTime: true,
      isFeatured: true,
      websiteLink: true,
      coverImageUrl: true,
      coverThumbUrl: true,
      logoUrl: true,
    },
  });

  const eventsPlain = events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
  }));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link href={`/admin/events/new`} title="New article">
          <IconButton variant="zspell" aria-label="New">
            <Plus className="h-4 w-4" />
          </IconButton>
        </Link>
      </div>

        <CalendarClient
          initialView={view}
          initialDate={baseDate.toISOString()}
          initialEvents={eventsPlain}
        />
    </div>
  );
}
