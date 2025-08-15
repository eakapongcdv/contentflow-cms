// app/admin/(dashboard)/occupants/OccupantForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";

/* TinyMCE only on client */
const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((m) => m.Editor),
  { ssr: false }
);

/* ===================== Types ===================== */
type OccupantFormProps = {
  mode: "create" | "edit";
  id?: string;
  initial?: Partial<OccupantFormState>;
};

type SeoState = {
  metaTitleTh?: string;
  metaTitleEn?: string;
  metaDescriptionTh?: string;
  metaDescriptionEn?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  robotsNoindex?: boolean;
  robotsNofollow?: boolean;
  structuredData?: string; // JSON string
};

type OccupantFormState = {
  externalId: string;
  nameTh: string;
  nameEn: string;
  shortName?: string;
  category?: string;
  phone?: string;
  venueId?: string;
  anchorId?: string;
  unitId?: string;
  kioskId?: string;
  unitIds?: string;
  kioskIds?: string;
  promotionIds?: string;
  privilegeIds?: string;
  localCategoryIds?: string;
  groupIds?: string;
  keywords?: string;

  renderPriority: number;
  renderType?: string;
  canReserve: boolean;
  isFeatured: boolean;
  isLandmark: boolean;
  websiteLink?: string;

  descriptionEn?: string;
  descriptionTh?: string;
  roomNo?: string;
  style?: string;
  hours?: string;

  startDate?: string;
  endDate?: string;
  isMaintenance: boolean;
  maintenanceStartDate?: string;
  maintenanceEndDate?: string;

  logoUrl?: string;
  coverImageUrl?: string;
  featuredImageUrl?: string;

  createdAtRaw?: string;
  updatedAtRaw?: string;
  publishedAt?: string;

  latitude?: string;
  longitude?: string;

  seo?: SeoState;
};

/* ===================== Icons ===================== */
const Icon = {
  hash: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M10 3L8 21M16 3l-2 18M4 8h16M3 16h16" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  user: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm7 9a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  tag: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M20 13l-7 7-9-9V4h7l9 9Z" stroke="currentColor" strokeWidth="2"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor"/></svg>
  ),
  phone: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.9 19.9 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.9 19.9 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.7 12.7 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.7 12.7 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  link: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 1 1 7 7l-1 1M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  cog: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm7.4-3a7.4 7.4 0 0 1-.1 1l2.1 1.6-2 3.4-2.5-1a7.6 7.6 0 0 1-1.7 1l-.4 2.7H9.2l-.4-2.7a7.6 7.6 0 0 1-1.7-1l-2.5 1-2-3.4L4.7 13a7.4 7.4 0 0 1 0-2L2.6 9.4l2-3.4 2.5 1a7.6 7.6 0 0 1 1.7-1L9.2 3.3h5.6l.4 2.7a7.6 7.6 0 0 1 1.7 1l2.5-1 2 3.4L19.3 11Z" stroke="currentColor" strokeWidth="1.6"/></svg>
  ),
  map: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M12 22s7-5.4 7-12a7 7 0 0 0-14 0c0 6.6 7 12 7 12Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="2" fill="currentColor"/></svg>
  ),
  clock: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  calendar: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  image: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M21 15l-4.5-4.5L9 18" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>
  ),
  tags: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M9 3l8 8-6 6L3 9l6-6Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  seo: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 9-9v9H3Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  bolt: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M11 21l1-7H7l6-11-1 7h5l-6 11Z" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  doc: (cls = "h-4 w-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12V8l-4-6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  chevron: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2"/></svg>
  ),
  collapseAll: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M7 10l5-5 5 5M7 19h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  expandAll: (cls = "h-5 w-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none">
      <path d="M7 14l5 5 5-5M7 5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

/* ===================== Collapsible Section ===================== */
function CollapsibleSection({
  title,
  subtitle,
  icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b bg-[color-mix(in_srgb,var(--zp-primary)_8%,white)]"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl grid place-items-center border border-zpell/40 text-zpell bg-white">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>
          {Icon.chevron("h-5 w-5")}
        </span>
      </button>

      {open && <div className="p-4 grid gap-4">{children}</div>}
    </section>
  );
}

/* ===================== Labeled input (icon in label line) ===================== */
function InputField({
  label,
  icon,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </span>
      <input {...props} className={`inp ${props.className || ""}`} />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

/* ===================== WYSIWYG (label + icon) ===================== */
function RichText({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key";
  return (
    <div className="grid gap-1">
      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        {label}
      </span>
      <Editor
        apiKey={apiKey}
        value={value}
        init={{
          menubar: false,
          height: 260,
          plugins: [
            "advlist","autolink","lists","link","charmap","searchreplace",
            "visualblocks","code","fullscreen","insertdatetime","table",
            "wordcount"
          ],
          toolbar:
            "undo redo | blocks | bold italic underline | " +
            "alignleft aligncenter alignright | bullist numlist outdent indent | link | removeformat",
          placeholder: placeholder || "",
          branding: false,
          statusbar: false,
          content_style:
            "body{font-family:ui-sans-serif, system-ui, -apple-system; font-size:14px; color:#111827}",
        }}
        onEditorChange={onChange}
      />
    </div>
  );
}

/* ===================== Image field (fixed height even if no image) ===================== */
function ImageField({
  label,
  icon,
  value,
  onChange,
  name,
}: {
  label: string;
  icon?: React.ReactNode;
  value?: string;
  onChange: (v: string) => void;
  name: keyof Pick<OccupantFormState, "logoUrl" | "featuredImageUrl" | "coverImageUrl">;
}) {
  const has = !!value;
  return (
    <div className="group grid gap-2">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
          {icon && <span className="text-gray-500">{icon}</span>}
          {label}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-outline-zpell"
            onClick={() => {
              const url = prompt("Paste image URL", value || "") || "";
              onChange(url.trim());
            }}
          >
            Replace
          </button>
          <button
            type="button"
            className="btn btn-outline-zpell"
            onClick={() => onChange("")}
            disabled={!has}
          >
            Clear
          </button>
        </div>
      </div>

      {/* hidden url slot */}
      <input type="hidden" name={String(name)} value={value || ""} />

      {/* fixed height always */}
      <div className="mt-1 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 grid place-items-center h-56">
        {has ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="h-full w-full object-contain p-3"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        ) : (
          <div className="text-xs text-gray-500">No Image</div>
        )}
      </div>
    </div>
  );
}

/* ===================== Main Form ===================== */
export default function OccupantForm({ mode, id, initial }: OccupantFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<OccupantFormState>({
    externalId: "",
    nameTh: "",
    nameEn: "",
    renderPriority: 0,
    canReserve: false,
    isFeatured: false,
    isLandmark: false,
    isMaintenance: false,
    seo: {
      metaTitleTh: "",
      metaTitleEn: "",
      metaDescriptionTh: "",
      metaDescriptionEn: "",
      metaKeywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      canonicalUrl: "",
      robotsNoindex: false,
      robotsNofollow: false,
      structuredData: "",
    },
    ...initial,
  });

  const [open, setOpen] = useState({
    basic: true,
    descriptions: true,
    locHours: true,
    dates: false,
    media: true,
    tags: false,
    seo: false,
  });

  const toggle = (k: keyof typeof open) => () => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const setAll = (val: boolean) =>
    setOpen({ basic: val, descriptions: val, locHours: val, dates: val, media: val, tags: val, seo: val });

  const update = (k: keyof OccupantFormState, v: any) => setForm((s) => ({ ...s, [k]: v }));
  const updateSeo = (k: keyof SeoState, v: any) =>
    setForm((s) => ({ ...s, seo: { ...(s.seo || {}), [k]: v } }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        externalId: form.externalId,
        nameTh: form.nameTh,
        nameEn: form.nameEn,
        shortName: form.shortName || null,
        category: form.category || null,
        phone: form.phone || null,
        venueId: form.venueId || null,
        anchorId: form.anchorId || null,
        unitId: form.unitId || null,
        kioskId: form.kioskId || null,

        unitIds: csvToArray(form.unitIds),
        kioskIds: csvToArray(form.kioskIds),
        promotionIds: csvToArray(form.promotionIds),
        privilegeIds: csvToArray(form.privilegeIds),
        localCategoryIds: csvToArray(form.localCategoryIds),
        groupIds: csvToArray(form.groupIds),
        keywords: csvToArray(form.keywords),

        renderPriority: Number(form.renderPriority) || 0,
        renderType: form.renderType || null,
        canReserve: !!form.canReserve,
        isFeatured: !!form.isFeatured,
        isLandmark: !!form.isLandmark,
        websiteLink: form.websiteLink || null,

        descriptionEn: form.descriptionEn || null,
        descriptionTh: form.descriptionTh || null,
        roomNo: form.roomNo || null,
        style: form.style || null,
        hours: form.hours || null,

        startDate: form.startDate ? new Date(form.startDate) : null,
        endDate: form.endDate ? new Date(form.endDate) : null,
        isMaintenance: !!form.isMaintenance,
        maintenanceStartDate: form.maintenanceStartDate ? new Date(form.maintenanceStartDate) : null,
        maintenanceEndDate: form.maintenanceEndDate ? new Date(form.maintenanceEndDate) : null,

        logoUrl: form.logoUrl || null,
        coverImageUrl: form.coverImageUrl || null,
        featuredImageUrl: form.featuredImageUrl || null,

        createdAtRaw: form.createdAtRaw ? new Date(form.createdAtRaw) : null,
        updatedAtRaw: form.updatedAtRaw ? new Date(form.updatedAtRaw) : null,
        publishedAt: form.publishedAt ? new Date(form.publishedAt) : null,

        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,

        seo: form.seo,
      };

      const url = mode === "create" ? "/api/admin/occupants" : `/api/admin/occupants/${id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || j?.message || "Failed to save");
      }

      router.push("/admin/occupants");
      router.refresh();
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this occupant?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/occupants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/occupants");
      router.refresh();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      {/* Heading + Collapse All / Expand All */}
      <div className="card p-4 flex items-center justify-between shadow-card">
        <div>
          <div className="text-lg font-semibold">{mode === "edit" ? "Edit Occupant" : "Create Occupant"}</div>
          <div className="text-xs text-gray-500">จัดการข้อมูลร้านค้า/ผู้เช่า</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAll(false)}
            className="btn btn-outline-zpell"
            title="Collapse all"
            aria-label="Collapse all sections"
          >
            {Icon.collapseAll()}
          </button>
          <button
            type="button"
            onClick={() => setAll(true)}
            className="btn btn-outline-zpell"
            title="Expand all"
            aria-label="Expand all sections"
          >
            {Icon.expandAll()}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* BASIC */}
      <CollapsibleSection
        title="Basic"
        subtitle="ข้อมูลหลักของร้านค้า/ผู้เช่า"
        icon={Icon.user("h-5 w-5")}
        open={open.basic}
        onToggle={toggle("basic")}
      >
        <div className="grid gap-4">
          <InputField
            label="External ID *"
            icon={Icon.hash()}
            required
            value={form.externalId}
            onChange={(e) => update("externalId", (e.target as HTMLInputElement).value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Name (TH) *"
              icon={Icon.user()}
              required
              value={form.nameTh}
              onChange={(e) => update("nameTh", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Name (EN) *"
              icon={Icon.user()}
              required
              value={form.nameEn}
              onChange={(e) => update("nameEn", (e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Short Name"
              icon={Icon.user()}
              value={form.shortName || ""}
              onChange={(e) => update("shortName", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Category"
              icon={Icon.tag()}
              value={form.category || ""}
              onChange={(e) => update("category", (e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Phone"
              icon={Icon.phone()}
              value={form.phone || ""}
              onChange={(e) => update("phone", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Website"
              icon={Icon.link()}
              value={form.websiteLink || ""}
              onChange={(e) => update("websiteLink", (e.target as HTMLInputElement).value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Render Type"
              icon={Icon.cog()}
              value={form.renderType || ""}
              onChange={(e) => update("renderType", (e.target as HTMLInputElement).value)}
            />
            <InputField
              label="Render Priority"
              icon={Icon.cog()}
              type="number"
              value={String(form.renderPriority)}
              onChange={(e) => update("renderPriority", Number((e.target as HTMLInputElement).value || 0))}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="chip chip-emerald cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={form.isFeatured}
                onChange={(e) => update("isFeatured", e.target.checked)}
              />
              Featured
            </label>
            <label className="chip chip-sky cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={form.canReserve}
                onChange={(e) => update("canReserve", e.target.checked)}
              />
              Can Reserve
            </label>
            <label className="chip chip-gray cursor-pointer">
              <input
                type="checkbox"
                className="mr-1"
                checked={form.isLandmark}
                onChange={(e) => update("isLandmark", e.target.checked)}
              />
              Landmark
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* DESCRIPTIONS */}
      <CollapsibleSection
        title="Descriptions"
        subtitle="คำอธิบาย 2 ภาษา"
        icon={Icon.doc("h-5 w-5")}
        open={open.descriptions}
        onToggle={toggle("descriptions")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <RichText
            label="Description (TH)"
            icon={Icon.doc()}
            value={form.descriptionTh || ""}
            onChange={(v) => update("descriptionTh", v)}
            placeholder="พิมพ์คำอธิบายภาษาไทย…"
          />
          <RichText
            label="Description (EN)"
            icon={Icon.doc()}
            value={form.descriptionEn || ""}
            onChange={(v) => update("descriptionEn", v)}
            placeholder="Write English description…"
          />
        </div>
      </CollapsibleSection>

      {/* LOCATION & HOURS */}
      <CollapsibleSection
        title="Location & Hours"
        subtitle="ข้อมูลสถานที่และเวลาเปิด"
        icon={Icon.map("h-5 w-5")}
        open={open.locHours}
        onToggle={toggle("locHours")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label="Venue ID" icon={Icon.map()} value={form.venueId || ""} onChange={(e) => update("venueId", (e.target as HTMLInputElement).value)} />
            <InputField label="Anchor ID" icon={Icon.map()} value={form.anchorId || ""} onChange={(e) => update("anchorId", (e.target as HTMLInputElement).value)} />
            <InputField label="Room No" icon={Icon.map()} value={form.roomNo || ""} onChange={(e) => update("roomNo", (e.target as HTMLInputElement).value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label="Unit ID" icon={Icon.map()} value={form.unitId || ""} onChange={(e) => update("unitId", (e.target as HTMLInputElement).value)} />
            <InputField label="Kiosk ID" icon={Icon.map()} value={form.kioskId || ""} onChange={(e) => update("kioskId", (e.target as HTMLInputElement).value)} />
            <InputField label="Hours" icon={Icon.clock()} value={form.hours || ""} onChange={(e) => update("hours", (e.target as HTMLInputElement).value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Latitude" icon={Icon.map()} placeholder="13.987..." value={form.latitude || ""} onChange={(e) => update("latitude", (e.target as HTMLInputElement).value)} />
            <InputField label="Longitude" icon={Icon.map()} placeholder="100.634..." value={form.longitude || ""} onChange={(e) => update("longitude", (e.target as HTMLInputElement).value)} />
          </div>
        </div>
      </CollapsibleSection>

      {/* DATES & MAINTENANCE */}
      <CollapsibleSection
        title="Dates & Maintenance"
        subtitle="ช่วงเวลาแสดงผลและสถานะบำรุงรักษา"
        icon={Icon.calendar("h-5 w-5")}
        open={open.dates}
        onToggle={toggle("dates")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Start Date" icon={Icon.calendar()} type="date" value={form.startDate || ""} onChange={(e) => update("startDate", (e.target as HTMLInputElement).value)} />
            <InputField label="End Date" icon={Icon.calendar()} type="date" value={form.endDate || ""} onChange={(e) => update("endDate", (e.target as HTMLInputElement).value)} />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="chip chip-gray cursor-pointer">
              <input type="checkbox" className="mr-1" checked={form.isMaintenance} onChange={(e) => update("isMaintenance", e.target.checked)} />
              Maintenance
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Maintenance Start" icon={Icon.calendar()} type="date" value={form.maintenanceStartDate || ""} onChange={(e) => update("maintenanceStartDate", (e.target as HTMLInputElement).value)} />
            <InputField label="Maintenance End" icon={Icon.calendar()} type="date" value={form.maintenanceEndDate || ""} onChange={(e) => update("maintenanceEndDate", (e.target as HTMLInputElement).value)} />
          </div>
        </div>
      </CollapsibleSection>

      {/* MEDIA */}
      <CollapsibleSection
        title="Media"
        subtitle="โลโก้และรูปภาพประกอบ (URL เก็บใน hidden)"
        icon={Icon.image("h-5 w-5")}
        open={open.media}
        onToggle={toggle("media")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <ImageField label="Logo" icon={Icon.image()} name="logoUrl" value={form.logoUrl || ""} onChange={(v) => update("logoUrl", v)} />
          <ImageField label="Featured Image" icon={Icon.image()} name="featuredImageUrl" value={form.featuredImageUrl || ""} onChange={(v) => update("featuredImageUrl", v)} />
          <ImageField label="Cover Image" icon={Icon.image()} name="coverImageUrl" value={form.coverImageUrl || ""} onChange={(v) => update("coverImageUrl", v)} />
        </div>
      </CollapsibleSection>

      {/* TAGS / ARRAYS */}
      <CollapsibleSection
        title="Tags / Arrays"
        subtitle="คั่นด้วยจุลภาค เช่น men,shoes,fashion"
        icon={Icon.tags("h-5 w-5")}
        open={open.tags}
        onToggle={toggle("tags")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Unit IDs" icon={Icon.tags()} hint="เช่น F1-101,F1-102" value={form.unitIds || ""} onChange={(e) => update("unitIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Kiosk IDs" icon={Icon.tags()} value={form.kioskIds || ""} onChange={(e) => update("kioskIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Promotion IDs" icon={Icon.tags()} value={form.promotionIds || ""} onChange={(e) => update("promotionIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Privilege IDs" icon={Icon.tags()} value={form.privilegeIds || ""} onChange={(e) => update("privilegeIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Local Category IDs" icon={Icon.tags()} value={form.localCategoryIds || ""} onChange={(e) => update("localCategoryIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Group IDs" icon={Icon.tags()} value={form.groupIds || ""} onChange={(e) => update("groupIds", (e.target as HTMLInputElement).value)} />
          <InputField label="Keywords" icon={Icon.tags()} value={form.keywords || ""} onChange={(e) => update("keywords", (e.target as HTMLInputElement).value)} />
        </div>
      </CollapsibleSection>

      {/* SEO */}
      <CollapsibleSection
        title="SEO"
        subtitle="เมตาแท็กและข้อมูลโครงสร้าง (JSON-LD)"
        icon={Icon.seo("h-5 w-5")}
        open={open.seo}
        onToggle={toggle("seo")}
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Meta Title (TH)" icon={Icon.seo()} value={form.seo?.metaTitleTh || ""} onChange={(e) => updateSeo("metaTitleTh", (e.target as HTMLInputElement).value)} />
            <InputField label="Meta Title (EN)" icon={Icon.seo()} value={form.seo?.metaTitleEn || ""} onChange={(e) => updateSeo("metaTitleEn", (e.target as HTMLInputElement).value)} />
            <RichText label="Meta Description (TH)" icon={Icon.seo()} value={form.seo?.metaDescriptionTh || ""} onChange={(v) => updateSeo("metaDescriptionTh", v)} />
            <RichText label="Meta Description (EN)" icon={Icon.seo()} value={form.seo?.metaDescriptionEn || ""} onChange={(v) => updateSeo("metaDescriptionEn", v)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Meta Keywords" icon={Icon.seo()} placeholder="shoe, fashion, sport" value={form.seo?.metaKeywords || ""} onChange={(e) => updateSeo("metaKeywords", (e.target as HTMLInputElement).value)} />
            <InputField label="Canonical URL" icon={Icon.link()} placeholder="https://www.futurepark.co.th/..." value={form.seo?.canonicalUrl || ""} onChange={(e) => updateSeo("canonicalUrl", (e.target as HTMLInputElement).value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="OG Title" icon={Icon.seo()} value={form.seo?.ogTitle || ""} onChange={(e) => updateSeo("ogTitle", (e.target as HTMLInputElement).value)} />
            <InputField label="OG Description" icon={Icon.seo()} value={form.seo?.ogDescription || ""} onChange={(e) => updateSeo("ogDescription", (e.target as HTMLInputElement).value)} />
            <InputField label="OG Image URL" icon={Icon.image()} value={form.seo?.ogImageUrl || ""} onChange={(e) => updateSeo("ogImageUrl", (e.target as HTMLInputElement).value)} />

            <div className="grid grid-cols-2 items-center gap-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!form.seo?.robotsNoindex} onChange={(e) => updateSeo("robotsNoindex", e.target.checked)} />
                <span className="text-sm">robots: noindex</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={!!form.seo?.robotsNofollow} onChange={(e) => updateSeo("robotsNofollow", e.target.checked)} />
                <span className="text-sm">robots: nofollow</span>
              </label>
            </div>
          </div>

          <label className="grid gap-1">
            <span className="inline-flex items-center gap-1 text-sm text-gray-700">
              {Icon.seo()} Structured Data (JSON-LD)
            </span>
            <textarea
              className="inp font-mono text-xs"
              rows={6}
              value={form.seo?.structuredData || ""}
              onChange={(e) => updateSeo("structuredData", (e.target as HTMLTextAreaElement).value)}
              placeholder='{"@context":"https://schema.org","@type":"Store","name":"..."}'
            />
          </label>
        </div>
      </CollapsibleSection>

      {/* ACTIONS */}
      <div className="sticky bottom-4 z-10">
        <div className="card shadow-card px-4 py-3 flex items-center justify-between bg-white">
          {mode === "edit" ? (
            <button type="button" onClick={onDelete} className="btn btn-outline-zpell">Delete</button>
          ) : <span />}
          <button type="submit" className="btn btn-zpell" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ===================== Utils ===================== */
function csvToArray(s?: string): string[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}
