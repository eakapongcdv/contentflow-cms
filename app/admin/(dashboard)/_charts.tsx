"use client";
// DashboardCharts — Client components using Recharts
// Theme: AI futuristic style with soft neon glow (named exports)

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

function DayTick({ x, y, payload }: any) {
  const d = parseISO(payload.value);
  return (
    <text x={x} y={y} dy={16} textAnchor="middle" className="fill-white/70 text-[10px]">
      {format(d, "MM-dd")}
    </text>
  );
}

const axisStyle = { stroke: "#9ca3af" } as any; // gray-400
const gridStyle = { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" } as any;
const neonPalette = ["#00ffe5", "#ff80ff", "#80ff00", "#ffd500", "#7dd3fc", "#fca5a5"]; // soft neon

export function TimeSeries({ seriesA, seriesB }: { seriesA: { name: string; data: SeriesPoint[] }; seriesB: { name: string; data: SeriesPoint[] } }) {
  const data = useMergedDays(seriesA.data, seriesB.data);
  return (
    <div style={{ width: "100%", height: 280 }} className="bg-[#0a0a0f] rounded-xl p-2">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="day" tick={<DayTick />} tickLine={false} axisLine={false} {...axisStyle} />
          <YAxis tickLine={false} axisLine={false} {...axisStyle} />
          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} labelFormatter={(v) => format(parseISO(v as string), "yyyy-MM-dd")} />
          <Legend />
          <Line type="monotone" dataKey="A" name={seriesA.name} dot={false} strokeWidth={2} stroke={neonPalette[0]} />
          <Line type="monotone" dataKey="B" name={seriesB.name} dot={false} strokeWidth={2} stroke={neonPalette[1]} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContentStacked({ articles, promotions, events }: { articles: SeriesPoint[]; promotions: SeriesPoint[]; events: SeriesPoint[] }) {
  const days = Array.from(new Set([...articles, ...promotions, ...events].map((d) => d.day))).sort();
  const map = new Map<string, any>();
  for (const d of days) map.set(d, { day: d, articles: 0, promotions: 0, events: 0 });
  for (const p of articles) map.get(p.day).articles = p.count;
  for (const p of promotions) map.get(p.day).promotions = p.count;
  for (const p of events) map.get(p.day).events = p.count;
  const data = Array.from(map.values());

  return (
    <div style={{ width: "100%", height: 280 }} className="bg-[#0a0a0f] rounded-xl p-2">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="day" tick={<DayTick />} tickLine={false} axisLine={false} {...axisStyle} />
          <YAxis tickLine={false} axisLine={false} {...axisStyle} />
          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} labelFormatter={(v) => format(parseISO(v as string), "yyyy-MM-dd")} />
          <Legend />
          <Bar dataKey="articles" stackId="x" name="Articles" fill={neonPalette[2]} />
          <Bar dataKey="promotions" stackId="x" name="Promotions" fill={neonPalette[3]} />
          <Bar dataKey="events" stackId="x" name="Events" fill={neonPalette[4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TemplatePie({ data }: { data: Array<{ template: string; count: number }> }) {
  const total = data.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <div style={{ width: "100%", height: 280 }} className="bg-[#0a0a0f] rounded-xl p-2">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} formatter={(v: any) => [`${v}`, "count"]} />
          <Pie data={data} dataKey="count" nameKey="template" outerRadius={100} label={({ name, value }) => `${name} (${Math.round((value / total) * 100)}%)`}>
            {data.map((_, i) => (
              <Cell key={i} fill={neonPalette[i % neonPalette.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}