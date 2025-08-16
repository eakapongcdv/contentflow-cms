"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

export type SeriesPoint = { day: string; count: number };

/* ------------------------------------------------------------------
   Shared styles — soft neon gradients + depth (front-page tone)
------------------------------------------------------------------ */
const containerStyle: React.CSSProperties = {
  width: "100%",
  height: 300,
  filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.35))",
};

const gridProps = { strokeDasharray: "3 3", stroke: "currentColor", className: "text-white/10" } as any;

function DayTick({ x, y, payload }: any) {
  const d = parseISO(payload.value);
  return (
    <text x={x} y={y} dy={16} textAnchor="middle" className="fill-white/70 text-[10px]">
      {format(d, "MM-dd")}
    </text>
  );
}

/** Neon gradient palette (soft, front-page style) */
const PALETTE = [
  { id: "gradA", from: "#22d3ee", to: "#a78bfa" }, // cyan → violet
  { id: "gradB", from: "#34d399", to: "#60a5fa" }, // emerald → sky
  { id: "gradC", from: "#f472b6", to: "#f59e0b" }, // pink → amber
];

/* ------------------------------------------------------------------
   Helpers for merging time-series
------------------------------------------------------------------ */
function useMergedDays(a: SeriesPoint[], b: SeriesPoint[]) {
  return useMemo(() => {
    const map = new Map<string, { day: string; A?: number; B?: number }>();
    for (const p of a) map.set(p.day, { day: p.day, A: p.count, B: 0 });
    for (const p of b) {
      const cur = map.get(p.day) || { day: p.day, A: 0, B: 0 };
      cur.B = p.count;
      map.set(p.day, cur);
    }
    return Array.from(map.values()).sort((x, y) => x.day.localeCompare(y.day));
  }, [a, b]);
}

/* ------------------------------------------------------------------
   Custom tooltip (dark glass)
------------------------------------------------------------------ */
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-black/50 backdrop-blur px-3 py-2 text-xs text-white shadow-xl">
      <div className="mb-1 text-white/70">{format(parseISO(label), "yyyy-MM-dd")}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.stroke || p.fill }} />
          <span className="text-white/80">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Chart components (neon/3D)
------------------------------------------------------------------ */
export function TimeSeries({
  seriesA,
  seriesB,
  className,
}: {
  seriesA: { name: string; data: SeriesPoint[] };
  seriesB: { name: string; data: SeriesPoint[] };
  className?: string;
}) {
  const data = useMergedDays(seriesA.data, seriesB.data);
  return (
    <div className={className} style={containerStyle}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
          <defs>
            {PALETTE.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.95} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0.95} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="day" tick={<DayTick />} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip content={<GlassTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="A" name={seriesA.name} dot={false} strokeWidth={3} stroke="url(#gradA)" />
          <Line type="monotone" dataKey="B" name={seriesB.name} dot={false} strokeWidth={3} stroke="url(#gradB)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContentStacked({
  articles,
  promotions,
  events,
  className,
}: {
  articles: SeriesPoint[];
  promotions: SeriesPoint[];
  events: SeriesPoint[];
  className?: string;
}) {
  const days = Array.from(new Set([...articles, ...promotions, ...events].map((d) => d.day))).sort();
  const map = new Map<string, any>();
  for (const d of days) map.set(d, { day: d, articles: 0, promotions: 0, events: 0 });
  for (const p of articles) map.get(p.day).articles = p.count;
  for (const p of promotions) map.get(p.day).promotions = p.count;
  for (const p of events) map.get(p.day).events = p.count;
  const data = Array.from(map.values());

  return (
    <div className={className} style={containerStyle}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 4 }}>
          <defs>
            {PALETTE.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.9} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0.9} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="day" tick={<DayTick />} tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip content={<GlassTooltip />} />
          <Legend />
          <Bar dataKey="articles" stackId="x" name="Articles" fill="url(#gradA)" radius={[6,6,0,0]} />
          <Bar dataKey="promotions" stackId="x" name="Promotions" fill="url(#gradB)" radius={[6,6,0,0]} />
          <Bar dataKey="events" stackId="x" name="Events" fill="url(#gradC)" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TemplatePie({ data, className }: { data: Array<{ template: string; count: number }>; className?: string }) {
  const total = data.reduce((s, x) => s + x.count, 0) || 1;
  const grads = ["gradA", "gradB", "gradC", "gradA", "gradB", "gradC"]; // cycle
  return (
    <div className={className} style={containerStyle}>
      <ResponsiveContainer>
        <PieChart>
          <defs>
            {PALETTE.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g.from} stopOpacity={0.95} />
                <stop offset="100%" stopColor={g.to} stopOpacity={0.95} />
              </linearGradient>
            ))}
          </defs>
          <Tooltip content={<GlassTooltip />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="template"
            outerRadius={110}
            innerRadius={48}
            paddingAngle={2}
            strokeWidth={2}
            stroke="rgba(255,255,255,0.08)"
            label={({ name, value }) => `${name} (${Math.round((value / total) * 100)}%)`}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#${grads[i % grads.length]})`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------
   Default export: Dashboard layout (dark glass like front page)
------------------------------------------------------------------ */
export default function AdminDashboardPage() {
  // Mock series for layout demo; replace with your real data loader
  const today = new Date();
  const days: string[] = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const seriesA = {
    name: "Articles",
    data: days.map((day, i) => ({ day, count: 10 + ((i * 7) % 13) })),
  };
  const seriesB = {
    name: "Promotions",
    data: days.map((day, i) => ({ day, count: 5 + ((i * 5) % 11) })),
  };

  const stacked = {
    articles: seriesA.data,
    promotions: seriesB.data,
    events: days.map((day, i) => ({ day, count: 6 + ((i * 3) % 9) })),
  };

  const templatePie = [
    { template: "COMPANY_PROFILE", count: 12 },
    { template: "ECOMMERCE", count: 7 },
    { template: "MALL", count: 5 },
    { template: "NEWS_BLOGS", count: 9 },
    { template: "JOBS_SEARCH", count: 3 },
  ];

  return (
    <main className="">
      <div className="mx-auto max-w-screen-2xl">
        {/* Header */}
        <div className="p-4 mb-4">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-white/60">Overview of content activity across all websites</p>
        </div>

        {/* KPIs (placeholder) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[{ label: "Websites", v: 4 }, { label: "Articles", v: 132 }, { label: "Promotions", v: 58 }, { label: "Events", v: 37 }].map((k) => (
            <div key={k.label} className="admin-card p-4">
              <div className="text-xs text-white/60">{k.label}</div>
              <div className="text-2xl font-semibold text-white mt-1">{k.v}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="admin-card p-3">
            <h2 className="text-sm font-medium text-white/80 mb-2">Articles vs Promotions (14 days)</h2>
            <TimeSeries seriesA={seriesA} seriesB={seriesB} />
          </section>

          <section className="admin-card p-3">
            <h2 className="text-sm font-medium text-white/80 mb-2">Content Created per Day</h2>
            <ContentStacked articles={stacked.articles} promotions={stacked.promotions} events={stacked.events} />
          </section>

          <section className="admin-card p-3 lg:col-span-2">
            <h2 className="text-sm font-medium text-white/80 mb-2">Website Templates</h2>
            <TemplatePie data={templatePie} />
          </section>
        </div>
      </div>
    </main>
  );
}
