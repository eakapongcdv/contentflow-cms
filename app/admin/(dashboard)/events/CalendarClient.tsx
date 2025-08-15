// app/admin/(dashboard)/events/CalendarClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sun,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Calendar,
  Pencil,
} from "lucide-react";

/* ---------- Types ---------- */
type ViewMode = "day" | "week" | "month" | "year";

type EventItem = {
  id: string;
  externalId: string | null;
  nameEn: string;
  nameTh: string | null;
  descriptionEn: string | null;
  descriptionTh: string | null;
  startDate: string; // ISO
  endDate: string;   // ISO
  dailyStartTime: string | null;
  dailyEndTime: string | null;
  isFeatured: boolean;
  websiteLink: string | null;
  coverImageUrl: string | null;
  coverThumbUrl: string | null;
  logoUrl: string | null;
};
type HydratedEvent = EventItem & { _s: Date; _e: Date };

type Holiday = { date: string; title: string };

/* ---------- Date helpers ---------- */
const isoToDateOnly = (iso: string) => {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const fmtISODate = (d: Date) => d.toISOString().slice(0, 10);
const startOfWeek = (d: Date) => {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  return new Date(s.getFullYear(), s.getMonth(), s.getDate());
};
const endOfWeek = (d: Date) => {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const inRange = (d: Date, a: Date, b: Date) => d >= a && d <= b;

/* ---------- Holidays ---------- */
function buildHolidayMap(list: Holiday[]) {
  const map = new Map<string, Holiday[]>();
  const seen = new Set<string>(); // date|title
  for (const h of list) {
    const key = `${h.date}|${h.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = map.get(h.date) || [];
    arr.push(h);
    map.set(h.date, arr);
  }
  return map;
}

/* ===================================================== */

export default function CalendarClient({
  initialView,
  initialDate,
  initialEvents,
}: {
  initialView: ViewMode;
  initialDate: string;
  initialEvents: EventItem[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // state
  const [view, setView] = useState<ViewMode>(initialView);
  const [baseIso, setBaseIso] = useState(initialDate);
  const base = useMemo(() => new Date(baseIso), [baseIso]);
  const today = useMemo(() => new Date(), []);
  const [holidayMap, setHolidayMap] = useState<Map<string, Holiday[]>>(new Map());
  const holidaysLoadingRef = useRef(false);

  // events hydration
  const events: HydratedEvent[] = useMemo(
    () =>
      initialEvents.map((e) => ({
        ...e,
        _s: isoToDateOnly(e.startDate),
        _e: isoToDateOnly(e.endDate),
      })),
    [initialEvents]
  );

  // current range
  const currentRange = useMemo(() => {
    if (view === "day") {
      const s = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    if (view === "week") return { start: startOfWeek(base), end: endOfWeek(base) };
    if (view === "year") {
      const s = new Date(base.getFullYear(), 0, 1);
      const e = new Date(base.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start: s, end: e };
    }
    return { start: startOfMonth(base), end: endOfMonth(base) };
  }, [base, view]);

  // push url
  const pushState = (nextView: ViewMode, date: Date) => {
    const params = new URLSearchParams(sp.toString());
    params.set("view", nextView);
    params.set("date", date.toISOString());
    startTransition(() => router.push(`/admin/events?${params.toString()}`));
  };

  // toolbar actions (icon buttons)
  const goToday = () => pushState(view, new Date());
  const goPrev = () => {
    if (view === "day") pushState(view, addDays(base, -1));
    else if (view === "week") pushState(view, addDays(base, -7));
    else if (view === "month") pushState(view, addMonths(base, -1));
    else pushState(view, new Date(base.getFullYear() - 1, base.getMonth(), base.getDate()));
  };
  const goNext = () => {
    if (view === "day") pushState(view, addDays(base, +1));
    else if (view === "week") pushState(view, addDays(base, +7));
    else if (view === "month") pushState(view, addMonths(base, +1));
    else pushState(view, new Date(base.getFullYear() + 1, base.getMonth(), base.getDate()));
  };

  // sync from SSR if changed
  useEffect(() => {
    setView(initialView);
    setBaseIso(initialDate);
  }, [initialView, initialDate]);

  // load holidays for current range (stable, no flicker)
  useEffect(() => {
    const startStr = fmtISODate(currentRange.start);
    const endStr = fmtISODate(currentRange.end);
    const ctrl = new AbortController();
    holidaysLoadingRef.current = true;

    (async () => {
      try {
        const res = await fetch(`/api/admin/holidays?start=${startStr}&end=${endStr}&lang=th`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: Holiday[] = (data?.items || []).map((x: any) => ({
          date: String(x.date),
          title: String(x.title),
        }));
        const map = buildHolidayMap(list);
        setHolidayMap(map);
      } catch {
        /* ignore */
      } finally {
        holidaysLoadingRef.current = false;
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRange.start, currentRange.end]);

  /* ---------- Right-below: events for range ---------- */
  const rangeEvents = useMemo(() => {
    const out = events.filter((e) => e._e >= currentRange.start && e._s <= currentRange.end);
    out.sort((a, b) => a._s.getTime() - b._s.getTime() || a.nameEn.localeCompare(b.nameEn));
    return out;
  }, [events, currentRange.start, currentRange.end]);

  /* -------------------- UI -------------------- */
  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 bg-white/80 rounded-2xl p-2 border">
        {/* Today */}
        <button
          className="h-9 w-9 grid place-items-center rounded-xl border hover:bg-red-50 text-red-600 border-red-200"
          onClick={goToday}
          title="Today"
          aria-label="Today"
        >
          <Sun className="h-5 w-5" />
        </button>

        {/* Prev / Next */}
        <div className="inline-flex rounded-xl overflow-hidden border border-red-200">
          <button
            className="h-9 w-9 grid place-items-center hover:bg-red-50 text-red-600"
            onClick={goPrev}
            title="Previous"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="h-9 w-9 grid place-items-center hover:bg-red-50 text-red-600"
            onClick={goNext}
            title="Next"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Date input */}
        <input
          type="date"
          value={baseIso.slice(0, 10)}
          onChange={(e) => pushState(view, new Date(e.target.value))}
          className="h-9 rounded-xl border border-red-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          aria-label="Pick date"
        />

        {/* view modes */}
        <div className="ml-auto flex items-center gap-1">
          <IconToggle
            active={view === "day"}
            onClick={() => pushState("day", new Date(baseIso))}
            ariaLabel="Day view"
            title="Day"
          >
            <Sun className="h-5 w-5" />
          </IconToggle>
          <IconToggle
            active={view === "week"}
            onClick={() => pushState("week", new Date(baseIso))}
            ariaLabel="Week view"
            title="Week"
          >
            <CalendarRange className="h-5 w-5" />
          </IconToggle>
          <IconToggle
            active={view === "month"}
            onClick={() => pushState("month", new Date(baseIso))}
            ariaLabel="Month view"
            title="Month"
          >
            <CalendarDays className="h-5 w-5" />
          </IconToggle>
          <IconToggle
            active={view === "year"}
            onClick={() => pushState("year", new Date(baseIso))}
            ariaLabel="Year view"
            title="Year"
          >
            <Calendar className="h-5 w-5" />
          </IconToggle>
        </div>
      </div>

      {/* Calendar */}
      <div className="min-w-0">
        {view === "day" && (
          <DayView base={new Date(baseIso)} events={events} holidayMap={holidayMap} today={today} />
        )}
        {view === "week" && (
          <WeekView base={new Date(baseIso)} events={events} holidayMap={holidayMap} today={today} />
        )}
        {view === "month" && (
          <MonthView base={new Date(baseIso)} events={events} holidayMap={holidayMap} today={today} />
        )}
        {view === "year" && (
          <YearView base={new Date(baseIso)} events={events} holidayMap={holidayMap} today={today} />
        )}
      </div>

      {/* UNDER CALENDAR */}
      {/* Events in range (hide on day view) */}
      {view !== "day" && (
        <section className="rounded-2xl border bg-white/80 p-4">
          <h4 className="font-semibold text-red-700 mb-2">Events in range</h4>
          {rangeEvents.length === 0 ? (
            <div className="text-sm text-gray-500">—</div>
          ) : (
            <ul className="grid gap-2">
              {rangeEvents.map((e) => (
                <li key={e.id} className="rounded-xl border border-red-200/60 p-2 flex items-start gap-3">
                  <div className="h-11 w-11 rounded-md bg-gray-100 overflow-hidden grid place-items-center shrink-0">
                    {e.coverThumbUrl || e.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={(e.coverThumbUrl || e.logoUrl)!}
                        alt={e.nameTh || e.nameEn}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{e.nameTh || e.nameEn}</div>
                    <div className="text-[16px] text-gray-500">
                      {new Date(e.startDate).toLocaleDateString()} –{" "}
                      {new Date(e.endDate).toLocaleDateString()}
                    </div>
                    <div className="text-[16px] text-gray-500">
                      {e.dailyStartTime || "—"} – {e.dailyEndTime || "—"}
                    </div>
                  </div>
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="h-8 w-8 grid place-items-center rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                    title="Edit"
                    aria-label="Edit event"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* วันหยุดไทย */}
      <section className="rounded-2xl border bg-white/80 p-4">
        <h4 className="font-semibold text-red-700 mb-2">วันหยุดไทย</h4>
        <div className="grid gap-2">
          {Array.from(holidayMap.entries()).length === 0 ? (
            <div className="text-sm text-gray-500">—</div>
          ) : (
            Array.from(holidayMap.entries())
              .sort(([a], [b]) => (a < b ? -1 : 1))
              .map(([d, arr]) => (
                <div key={d} className="text-sm">
                  <div className="text-[16px] text-gray-500 mb-1">{d}</div>
                  <ul className="grid gap-1">
                    {arr.map((h, i) => (
                      <li key={`${h.title}-${i}`} className="flex items-start gap-2">
                        <span className="inline-block mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span className="leading-tight">{h.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- IconToggle (icon-only) ---------- */
function IconToggle({
  active,
  onClick,
  ariaLabel,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      className={
        active
          ? "h-9 w-9 grid place-items-center rounded-xl border border-red-500 bg-red-50 text-red-700"
          : "h-9 w-9 grid place-items-center rounded-xl border border-red-200 hover:bg-red-50 text-red-600"
      }
    >
      {children}
    </button>
  );
}

/* ================= Views ================= */

function DayView({
  base,
  events,
  holidayMap,
  today,
}: {
  base: Date;
  events: HydratedEvent[];
  holidayMap: Map<string, Holiday[]>;
  today: Date;
}) {
  const list = useMemo(() => events.filter((e) => inRange(base, e._s, e._e)), [events, base]);
  const key = fmtISODate(base);
  const holidays = holidayMap.get(key) || [];
  const isToday = isSameDay(base, today);

  return (
    <div className="rounded-2xl border bg-white/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{base.toLocaleDateString()}</h3>
        <span
          className={`inline-grid place-items-center h-8 w-8 rounded-full text-sm ${
            isToday ? "border-2 border-red-500 text-red-700" : "border border-gray-300 text-gray-700"
          }`}
          title={isToday ? "Today" : ""}
        >
          {base.getDate()}
        </span>
      </div>

      <div className="grid gap-2">
        {holidays.length > 0 && (
          <div className="rounded-xl border border-red-200/70 bg-red-50/50 p-2 text-sm text-red-700">
            {holidays.map((h, i) => (
              <div key={`${h.title}-${i}`}>• {h.title}</div>
            ))}
          </div>
        )}

        {list.length === 0 ? (
          <div className="text-sm text-gray-500">No events.</div>
        ) : (
          list.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-red-200/60 p-3 flex items-start gap-3 hover:bg-red-50/30"
            >
              <div className="h-11 w-11 rounded-md bg-gray-100 overflow-hidden grid place-items-center shrink-0">
                {e.coverThumbUrl || e.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(e.coverThumbUrl || e.logoUrl)!}
                    alt={e.nameTh || e.nameEn}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{e.nameTh || e.nameEn}</div>
                <div className="text-[16px] text-gray-500">
                  {e.dailyStartTime || "—"} – {e.dailyEndTime || "—"}
                </div>
                <div className="text-[16px] text-gray-500">
                  {new Date(e.startDate).toLocaleDateString()} –{" "}
                  {new Date(e.endDate).toLocaleDateString()}
                </div>
              </div>
              <Link
                href={`/admin/events/${e.id}`}
                className="h-8 w-8 grid place-items-center rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                title="Edit"
                aria-label="Edit event"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function WeekView({
  base,
  events,
  holidayMap,
  today,
}: {
  base: Date;
  events: HydratedEvent[];
  holidayMap: Map<string, Holiday[]>;
  today: Date;
}) {
  const start = startOfWeek(base);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const keyOf = (d: Date) => fmtISODate(d);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, HydratedEvent[]>();
    days.forEach((d) => m.set(keyOf(d), []));
    for (const e of events) {
      for (const d of days) if (inRange(d, e._s, e._e)) m.get(keyOf(d))!.push(e);
    }
    return m;
  }, [events, days]);

  return (
    <div className="rounded-2xl border bg-white/80">
      <div className="grid grid-cols-7 gap-px bg-red-200/60 p-2">
        {days.map((d) => {
          const k = keyOf(d);
          const list = eventsByDay.get(k) || [];
          const holidays = holidayMap.get(k) || [];
          const isToday = isSameDay(d, today);

          return (
            <div key={k} className="bg-white h-44 rounded p-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-grid place-items-center h-7 w-7 rounded-full text-sm ${
                    isToday ? "border-2 border-red-500 text-red-700" : "border border-gray-300 text-gray-700"
                  }`}
                >
                  {d.getDate()}
                </span>
                {!!holidays.length && (
                  <span className="text-[11px] text-red-600 truncate ml-2" title={holidays[0].title}>
                    {holidays[0].title}
                  </span>
                )}
              </div>

              <div className="mt-1 grid gap-1 overflow-auto">
                {list.slice(0, 4).map((e) => (
                  <Link
                    key={e.id + k}
                    href={`/admin/events/${e.id}`}
                    className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[16px] truncate hover:bg-red-100"
                    title={e.nameTh || e.nameEn}
                  >
                    {e.nameTh || e.nameEn}
                  </Link>
                ))}
                {list.length > 4 && (
                  <div className="text-[16px] text-gray-500">+{list.length - 4} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({
  base,
  events,
  holidayMap,
  today,
}: {
  base: Date;
  events: HydratedEvent[];
  holidayMap: Map<string, Holiday[]>;
  today: Date;
}) {
  const sMonth = startOfMonth(base);
  const eMonth = endOfMonth(base);

  const firstWeekday = sMonth.getDay();
  const daysInMonth = eMonth.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(new Date(sMonth.getFullYear(), sMonth.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, HydratedEvent[]>();
    for (const e of events) {
      const s = e._s > sMonth ? e._s : sMonth;
      const eEnd = e._e < eMonth ? e._e : eMonth;
      if (s > eEnd) continue;
      for (let d = new Date(s); d <= eEnd; d = addDays(d, 1)) {
        const k = fmtISODate(d);
        const arr = m.get(k) || [];
        arr.push(e);
        m.set(k, arr);
      }
    }
    return m;
  }, [events, sMonth, eMonth]);

  return (
    <div className="rounded-2xl border bg-white/80 overflow-hidden">
      <div className="grid grid-cols-7 text-[11px] text-gray-500 px-4 pt-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center pb-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-red-200/60 p-2">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} className="bg-white h-28 rounded" />;
          const k = fmtISODate(d);
          const list = eventsByDay.get(k) || [];
          const holidays = holidayMap.get(k) || [];
          const isToday = isSameDay(d, today);

          return (
            <div key={k} className="bg-white h-28 rounded p-2 flex flex-col">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-grid place-items-center h-7 w-7 rounded-full text-sm ${
                    isToday ? "border-2 border-red-500 text-red-700" : "border border-gray-300 text-gray-700"
                  }`}
                >
                  {d.getDate()}
                </span>
                {!!holidays.length && (
                  <span className="text-[11px] text-red-600 truncate ml-2" title={holidays[0].title}>
                    {holidays[0].title}
                  </span>
                )}
              </div>

              <div className="mt-1 grid gap-1">
                {list.slice(0, 3).map((e) => (
                  <Link
                    key={e.id + k}
                    href={`/admin/events/${e.id}`}
                    className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[16px] truncate hover:bg-red-100"
                    title={e.nameTh || e.nameEn}
                  >
                    {e.nameTh || e.nameEn}
                  </Link>
                ))}
                {list.length > 3 && (
                  <div className="text-[16px] text-gray-500">+{list.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearView({
  base,
  events,
  holidayMap,
  today,
}: {
  base: Date;
  events: HydratedEvent[];
  holidayMap: Map<string, Holiday[]>;
  today: Date;
}) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(base.getFullYear(), i, 1));
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {months.map((m) => (
        <div key={`${m.getFullYear()}-${m.getMonth()}`} className="rounded-2xl border bg-white/80">
          <div className="px-4 py-2 border-b text-sm font-medium">
            {m.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <MonthView base={m} events={events} holidayMap={holidayMap} today={today} />
        </div>
      ))}
    </div>
  );
}
