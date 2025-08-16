// app/admin/(dashboard)/page.tsx
import { TimeSeries, ContentStacked, TemplatePie } from "./_charts";

export const dynamic = "force-dynamic";

// Server Component page that renders client charts
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
