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
      {/* Top bar (mobile) */}
      <div className="lg:hidden flex items-center justify-between h-12">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 hover:bg-white/15"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm">Menu</span>
        </button>
        <div className="text-sm opacity-70">{pathname}</div>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
          <NavGroups active={active} />
        </div>
      </aside>

      {/* Drawer (mobile) */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full w-80 bg-[#0b0f14] border-r border-white/10 shadow-xl p-3"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Admin Menu</div>
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
          <div className="px-2 text-xs uppercase tracking-wider text-white/50 mb-2">{group.label}</div>
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

function AdminLink({ href, active, icon: Icon, children, onClick }: { href: string; active?: boolean; icon?: React.ComponentType<any>; children: React.ReactNode; onClick?: () => void; }) {
  const className = active
    ? "flex items-center gap-2 rounded-md px-2 py-2 bg-emerald-500/15 text-emerald-300"
    : "flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/10 text-white/80 hover:text-white";
  return (
    <Link href={href} onClick={onClick} className={className}>
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span className="text-sm">{children}</span>
    </Link>
  );
}
