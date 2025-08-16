"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Menu, X, LayoutDashboard, Newspaper, Tags, FolderTree, CalendarDays, Megaphone, Building2, Landmark, Image as ImageIcon, Info, Globe2, Users, UserCog, KeySquare, ShieldCheck, Search, MousePointer , Settings } from "lucide-react";

/**
 * AdminNav — responsive admin navigation for routes under /admin/*
 *
 * Design goals:
 * - Sidebar on desktop, overlay drawer on mobile
 * - Active state based on current pathname
 * - Grouped sections to match app/admin/* directories
 * - Minimal dependencies (Tailwind + lucide-react)
 * - Keyboard accessible (Tab / Esc)
 */

export type AdminNavProps = {
  websiteId: string;
  websiteName?: string;
  initialRules: Array<{ resource: string; action: string; effect: "ALLOW" | "DENY" }>;
};

/**
 * Define your admin menu structure here.
 * Add/remove items to reflect actual pages under app/admin/*
 */
const NAV: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon?: React.ComponentType<any>; exact?: boolean }>
}> = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/articles", label: "Articles", icon: Newspaper },
      //{ href: "/admin/categories", label: "Categories", icon: FolderTree },
      //{ href: "/admin/tags", label: "Tags", icon: Tags },
      { href: "/admin/promotions", label: "Promotions", icon: Megaphone },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/occupants", label: "Occupants", icon: Landmark },
      //{ href: "/admin/brands", label: "Brands", icon: Building2 },
      //{ href: "/admin/features", label: "Features", icon: StarIcon },
      //{ href: "/admin/info-cards", label: "Info Cards", icon: Info },
      //{ href: "/admin/hero-slides", label: "Hero Slides", icon: ImageIcon },
    ],
  },
  {
    label: "SEO & Website",
    items: [
      { href: "/admin/seo", label: "SEO Meta", icon: Globe2 },
      { href: "/admin/websites", label: "Websites", icon: Globe2 },
    ],
  },
  {
    label: "Access",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/groups", label: "Groups", icon: UserCog },
      { href: "/admin/access", label: "Access Control", icon: KeySquare },
      { href: "/admin/audit", label: "Audit / Policies", icon: ShieldCheck },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/admin/search-logs", label: "Search Logs", icon: Search },
      { href: "/admin/click-logs", label: "Click Logs", icon: MousePointer },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Fallback star icon (inline) to avoid extra import weight
function StarIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden focusable={false} {...props}>
      <path fill="currentColor" d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 7.1-1.01L12 2z"/>
    </svg>
  );
}

function useActiveMap(pathname: string) {
  return useMemo(() => {
    const isActive = (href: string, exact?: boolean) =>
      exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
    const map = new Map<string, boolean>();
    NAV.forEach((g) => g.items.forEach((it) => map.set(it.href, isActive(it.href, it.exact))));
    return map;
  }, [pathname]);
}

export default function AdminNav({ websiteId: _websiteId, websiteName: _websiteName, initialRules: _initialRules }: AdminNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = useActiveMap(pathname || "/admin");

  // Close on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <nav className="relative">
      {/* Top bar (tablet & mobile) */}
      <div className="lg:hidden flex items-center justify-between h-12 rounded-xl bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(900px_400px_at_120%_-40%,rgba(192,132,252,0.14),transparent_60%),linear-gradient(180deg,rgba(2,6,23,0.9),rgba(2,6,23,0.7))] border border-white/10 backdrop-blur supports-[backdrop-filter]:backdrop-blur px-2 shadow-[0_0_0_1px_rgba(148,163,184,0.08),0_8px_30px_rgba(56,189,248,0.12)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="md:hidden inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_18px_rgba(56,189,248,0.22)]"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm">Menu</span>
        </button>
        <div className="text-xs md:text-sm text-white/70 truncate max-w-[60%]">{pathname}</div>
      </div>

      {/* Inline menu on tablet (md to lg-1) */}
      <div className="hidden md:block lg:hidden mt-2 rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.9),rgba(2,6,23,0.6))] px-2 py-2 overflow-x-auto">
        <div className="flex items-center gap-3 whitespace-nowrap min-w-0">
          {NAV.map((group) => (
            <div key={group.label} className="flex items-center gap-2 pr-3 mr-1 border-r border-white/10 last:border-r-0">
              <span className="text-[11px] uppercase tracking-wider text-white/60">
                {group.label}
              </span>
              <div className="flex items-center gap-1">
                {group.items.map((it) => (
                  <AdminLink key={it.href} href={it.href} active={!!active.get(it.href)} icon={it.icon} size="sm">
                    {it.label}
                  </AdminLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block shrink-0">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
          <NavGroups active={active} />
        </div>
      </aside>

      {/* Drawer (mobile only) */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          {/* Top sheet */}
          <div
            className="absolute inset-x-0 top-0 max-h-[80vh] overflow-y-auto rounded-b-2xl border border-white/10 bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(56,189,248,0.20),transparent_60%),radial-gradient(900px_400px_at_120%_-40%,rgba(192,132,252,0.16),transparent_60%),linear-gradient(180deg,rgba(2,6,23,0.95),rgba(2,6,23,0.85))] shadow-[0_10px_40px_rgba(56,189,248,0.18)] p-3"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-emerald-300">Admin Menu</div>
              <button
                aria-label="Close admin menu"
                onClick={() => setOpen(false)}
                className="p-2 rounded-md hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavGroups active={active} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </nav>
  );
}

function NavGroups({ active, onNavigate }: { active: Map<string, boolean>; onNavigate?: () => void }) {
  return (
    <ul className="space-y-5">
      {NAV.map((group) => (
        <li key={group.label}>
          <div className="px-2 text-[11px] uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
            <span className="h-1 w-1.5 rounded-full bg-cyan-300/70 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
            {group.label}
          </div>
          <ul className="space-y-1">
            {group.items.map((it) => (
              <li key={it.href}>
                <AdminLink href={it.href} active={!!active.get(it.href)} icon={it.icon} onClick={onNavigate}>
                  {it.label}
                </AdminLink>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function AdminLink({ href, active, icon: Icon, children, onClick, size = "md" }: { href: string; active?: boolean; icon?: React.ComponentType<any>; children: React.ReactNode; onClick?: () => void; size?: "sm" | "md"; }) {
  const padding = size === "sm" ? "px-2 py-1.5 text-[13px]" : "px-2.5 py-2 text-sm";
  const className = [
    "flex items-center gap-2 rounded-md transition-colors border",
    padding,
    active
      ? "border-cyan-300/30 bg-white/5 text-cyan-200 shadow-[0_0_0_1px_rgba(56,189,248,0.18)]"
      : "border-white/10 text-white/80 hover:text-white hover:bg-white/10",
  ].join(" ");
  return (
    <Link href={href} onClick={onClick} className={className}>
      {Icon ? <Icon className={active ? "h-4 w-4 text-cyan-300" : "h-4 w-4 text-white/80"} /> : null}
      <span>{children}</span>
    </Link>
  );
}
