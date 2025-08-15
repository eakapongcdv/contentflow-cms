// app/admin/(dashboard)/admin-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  BadgePercent,
  Store,
  Tags,
  Globe2,
  Building2,
  BriefcaseBusiness,
  IdCard,
  Info,
  Phone,
  Users,
  ScrollText,
  ChevronDown,
  Settings as SettingsIcon,
} from "lucide-react";

/** โครงสร้างเมนู */
type NavChild = { href: string; label: string; icon: React.ComponentType<any> };
type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  children: NavChild[];
};

const NAV: NavGroup[] = [
  {
    id: "home",
    label: "Home",
    icon: LayoutDashboard,
    children: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    id: "article",
    label: "Article",
    icon: LayoutDashboard,
    children: [{ href: "/admin/articles", label: "Article", icon: LayoutDashboard }],
  },
  {
    id: "events-promotions",
    label: "Events & Promotions",
    icon: CalendarRange,
    children: [
      { href: "/admin/events", label: "Events", icon: CalendarRange },
      { href: "/admin/promotions", label: "Promotions", icon: BadgePercent },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    id: "stores-tenants",
    label: "Stores & Tenants",
    icon: Store,
    children: [
      { href: "/admin/occupants", label: "Store Directory", icon: Store },
      { href: "/admin/tenants", label: "Tenants", icon: Building2 },
    ],
  },
  {
    id: "tourist",
    label: "Tourist",
    icon: Globe2,
    children: [{ href: "/admin/tourist/landing", label: "Landing", icon: Info }],
  },
  {
    id: "careers",
    label: "Careers",
    icon: BriefcaseBusiness,
    children: [{ href: "/admin/careers/new", label: "New Job", icon: BriefcaseBusiness }],
  },
  {
    id: "member",
    label: "Member Info",
    icon: IdCard,
    children: [{ href: "/admin/member/settings", label: "Settings", icon: IdCard }],
  },
  {
    id: "about",
    label: "About Us",
    icon: Info,
    children: [{ href: "/admin/about-us/hero", label: "Hero", icon: Info }],
  },
  {
    id: "contact",
    label: "Contact Us",
    icon: Phone,
    children: [{ href: "/admin/contact-us/inbox", label: "Inbox", icon: Phone }],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    children: [
      { href: "/admin/users/invite", label: "Invite User", icon: Users },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    id: "logs",
    label: "Activity Log",
    icon: ScrollText,
    children: [{ href: "/admin/logs/export", label: "Export", icon: ScrollText }],
  },
  {
    id: "settings",
    label: "Settings",
    icon: SettingsIcon,
    children: [{ href: "/admin/settings", label: "General", icon: SettingsIcon }],
  },
];

/* ---------- helpers ---------- */
function isChildActive(pathname: string, childHref: string) {
  return pathname === childHref || pathname.startsWith(childHref + "/");
}
function getActiveGroupId(pathname: string): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const g of NAV) {
    for (const c of g.children) {
      if (isChildActive(pathname, c.href) && c.href.length > bestLen) {
        bestLen = c.href.length;
        best = g.id;
      }
    }
  }
  if (!best && pathname === "/admin") best = "home";
  return best;
}

/* ---------- styled components ---------- */
function GroupHeader({
  label,
  icon: Icon,
  open,
  onToggle,
}: {
  label: string;
  icon: React.ComponentType<any>;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium",
        "transition-all duration-200 border border-transparent",
        open
          ? "bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-100"
          : "hover:bg-gray-50",
      ].join(" ")}
    >
      <Icon className="h-[18px] w-[18px] text-zpell" />
      <span className="truncate">{label}</span>
      <ChevronDown
        className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180 text-zpell" : "text-gray-500"}`}
        aria-hidden
      />
    </button>
  );
}

function SubLink({
  href,
  label,
  icon: Icon,
  active,
  onChosen,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  active: boolean;
  onChosen: () => void;
}) {
  return (
    <li className="relative group">
      {/* accent bar (ซ้าย) — เข้มขึ้นเมื่อ active */}
      <span
        aria-hidden
        className={[
          "absolute left-1 top-1/2 -translate-y-1/2 h-8 w-[6px] rounded-full",
          "transition-all duration-200 bg-gradient-to-b",
          active
            ? "from-emerald-700 to-emerald-500 opacity-100"
            : "from-emerald-300 to-emerald-200 opacity-0 group-hover:opacity-70",
        ].join(" ")}
      />
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onChosen}
        className={[
          "relative pl-6 pr-3 py-2.5 rounded-xl flex items-center gap-2 border border-transparent",
          "text-sm transition-colors focus:outline-none focus-visible:ring-2",
          active
            // 🔥 ซับเมนู active เข้มชัด (พื้นหลังแบรนด์/เขียวเข้ม + ตัวอักษร/ไอคอนสีขาว)
            ? "bg-zpell text-white shadow-sm hover:bg-zpell/90 focus-visible:ring-zpell"
            : "text-gray-700 hover:bg-emerald-50 focus-visible:ring-emerald-300",
        ].join(" ")}
      >
        <Icon className={`h-[17px] w-[17px] ${active ? "text-white" : "text-emerald-700"}`} />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}


/* ---------- main ---------- */
export default function AdminNav() {
  const pathname = usePathname();
  const initialActive = useMemo(() => getActiveGroupId(pathname), [pathname]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = getActiveGroupId(pathname);
    const next: Record<string, boolean> = {};
    if (id) next[id] = true;
    setOpen(next);
  }, [pathname]);

  const toggleExclusive = (id: string) =>
    setOpen((prev) => {
      const isOpen = !!prev[id];
      return isOpen ? {} : { [id]: true };
    });

  return (
    <aside className="min-w-0">
      <nav aria-label="Admin" className="grid gap-1 min-w-0">
        {NAV.map((group) => {
          const isOpen = !!open[group.id] || initialActive === group.id;
          return (
            <div key={group.id} className="mb-1 min-w-0">
              <GroupHeader
                label={group.label}
                icon={group.icon}
                open={isOpen}
                onToggle={() => toggleExclusive(group.id)}
              />
              {isOpen ? (
                <ul className="mt-1 ml-2 grid gap-1">
                  {group.children.map((child) => {
                    const active = isChildActive(pathname, child.href);
                    return (
                      <SubLink
                        key={child.href}
                        href={child.href}
                        label={child.label}
                        icon={child.icon}
                        active={active}
                        onChosen={() => setOpen({ [group.id]: true })}
                      />
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
